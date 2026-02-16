'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, updateDoc, getDoc, where, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { addOrder, updateOrderFromQuote, Order, getOrderById, updateOrderStatus, updateOrderPaymentStatus } from './orders';
import { addInvoiceFromOrder } from './invoices';

export interface QuoteItem {
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  purchasePrice?: number;
  total: number;
  photo?: string;
  weight?: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    orderId?: string;
    items: QuoteItem[];
    subTotal: number;
    transportCost?: number;
    commissionRate?: number;
    commissionBasis?: 'products_only' | 'total';
    totalAmount: number;
    status: "draft" | "sent" | "accepted" | "rejected" | "paid";
    shippingAddress?: string;
    notes?: string;
    issueDate: string;
    validUntil: string;
    createdAt: string;
    depositRequired?: boolean;
    depositPercentage?: number;
    exchangeRate: number; // Freeze EUR price
}

const parseDate = (val: any) => {
    if (!val) return new Date().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'object' && val && 'seconds' in val) {
        return new Date(val.seconds * 1000).toISOString();
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

async function getGlobalExchangeRate(): Promise<number> {
    try {
        const configRef = doc(db, 'config', 'finance');
        const snap = await getDoc(configRef);
        if (snap.exists()) {
            return snap.data().exchangeRate || 0.13;
        }
        return 0.13;
    } catch (e) {
        return 0.13;
    }
}

/**
 * Adds a new Proforma to both global and client subcollection.
 */
export async function addQuote(values: any) {
    try {
        const currentRate = await getGlobalExchangeRate();
        const quoteId = `QT-${Date.now()}`;
        const data = {
            ...values,
            id: quoteId,
            exchangeRate: currentRate,
            createdAt: serverTimestamp(),
        };

        // Admin Master Copy
        await setDoc(doc(db, 'quotes', quoteId), data);
        
        // Client Distinct Copy
        if (values.customerId) {
            await setDoc(doc(db, 'clients', values.customerId, 'quotes', quoteId), data);
        }

        return { success: true, message: 'Proforma Invoice added successfully!', id: quoteId };
    } catch (error: any) {
        console.error("Add quote error:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateQuote(id: string, values: any) {
    try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnap = await getDoc(quoteRef);
        
        if (!quoteSnap.exists()) return { success: false, message: "Quote not found" };
        const quoteData = quoteSnap.data();

        await updateDoc(quoteRef, values);

        // Update Client Copy
        if (quoteData.customerId) {
            const clientQuoteRef = doc(db, 'clients', quoteData.customerId, 'quotes', id);
            await updateDoc(clientQuoteRef, values);
        }

        const updatedQuote = await getQuoteById(id);
        if (updatedQuote && (updatedQuote.status === 'accepted' || updatedQuote.status === 'paid')) {
            await updateOrderFromQuote(updatedQuote);
        }

        return { success: true, message: 'Proforma Invoice updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

/**
 * Synchronizes an existing Quote with current Order data and resets status to 'sent'
 * for client re-validation.
 */
export async function syncQuoteFromOrder(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        if (!order) return { success: false, message: "Commande introuvable." };

        const quotesQuery = query(collection(db, "quotes"), where("orderId", "==", orderId));
        const quotesSnapshot = await getDocs(quotesQuery);

        if (quotesSnapshot.empty) {
            return { success: false, message: "Aucune PI liée à cette commande." };
        }

        const quoteDoc = quotesSnapshot.docs[0];
        const quoteId = quoteDoc.id;

        // Fetch client basis
        const clientRef = doc(db, 'clients', order.customerId);
        const clientSnap = await getDoc(clientRef);
        const basis = clientSnap.exists() ? clientSnap.data().commissionBasis : 'products_only';

        const itemsSubTotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const transport = Number(order.transportCost) || 0;
        const commRate = Number(order.commissionRate) || 0;

        let calculatedTotal = 0;
        if (basis === 'total') {
            calculatedTotal = (itemsSubTotal + transport) * (1 + commRate / 100);
        } else {
            const commAmount = itemsSubTotal * (commRate / 100);
            calculatedTotal = itemsSubTotal + transport + commAmount;
        }

        const updatedQuoteData = {
            items: order.items.map(item => ({
                sku: item.sku || "",
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                purchasePrice: (item as any).purchasePrice || 0,
                total: item.total,
                photo: (item as any).photo || "",
                weight: item.weight || 0
            })),
            subTotal: itemsSubTotal,
            transportCost: transport,
            commissionRate: commRate,
            commissionBasis: basis,
            totalAmount: calculatedTotal,
            status: "sent" as const, // Forces client to accept new conditions
            updatedAt: serverTimestamp(),
        };

        await updateQuote(quoteId, updatedQuoteData);

        return { success: true, message: "PI mise à jour et renvoyée pour validation." };
    } catch (error: any) {
        console.error("Sync quote error:", error);
        return { success: false, message: "Erreur lors de la synchronisation." };
    }
}

export async function createQuoteFromOrder(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        if (!order) return { success: false, message: "Commande introuvable." };
        
        // Fetch client basis
        const clientRef = doc(db, 'clients', order.customerId);
        const clientSnap = await getDoc(clientRef);
        const basis = clientSnap.exists() ? clientSnap.data().commissionBasis : 'products_only';

        const currentRate = await getGlobalExchangeRate();
        const quoteId = `PI-AUTO-${Date.now()}`;

        const itemsSubTotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const transport = Number(order.transportCost) || 0;
        const commRate = Number(order.commissionRate) || 0;
        
        let calculatedTotal = 0;
        if (basis === 'total') {
            calculatedTotal = (itemsSubTotal + transport) * (1 + commRate / 100);
        } else {
            const commAmount = itemsSubTotal * (commRate / 100);
            calculatedTotal = itemsSubTotal + transport + commAmount;
        }

        const newQuoteData = {
            id: quoteId,
            quoteNumber: `PI-${order.orderNumber.replace('ORD-', '').replace('O-', '')}`,
            customerId: order.customerId,
            customerName: order.customerName,
            orderId: order.id,
            issueDate: new Date().toISOString(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
            items: order.items.map(item => ({
                sku: item.sku || "",
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0,
                purchasePrice: (item as any).purchasePrice || 0,
                total: item.total || 0,
                photo: (item as any).photo || "",
                weight: item.weight || 0
            })),
            subTotal: itemsSubTotal,
            transportCost: transport,
            commissionRate: commRate,
            commissionBasis: basis,
            totalAmount: calculatedTotal,
            status: "draft" as const,
            shippingAddress: order.shippingAddress || "",
            notes: "Généré automatiquement depuis la commande " + order.orderNumber,
            depositRequired: order.depositRequired || true,
            depositPercentage: order.depositPercentage || 30,
            exchangeRate: currentRate,
            createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'quotes', quoteId), newQuoteData);
        await setDoc(doc(db, 'clients', order.customerId, 'quotes', quoteId), newQuoteData);

        return { success: true, message: 'Proforma générée automatiquement !', id: quoteId };
    } catch (error: any) {
        console.error("Auto quote generation error:", error);
        return { success: false, message: 'Échec de la génération automatique.' };
    }
}

export async function getQuotes(): Promise<Quote[]> {
  try {
    const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const quotes: Quote[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          ...data,
          issueDate: parseDate(data.issueDate),
          validUntil: parseDate(data.validUntil),
          createdAt: parseDate(data.createdAt),
          exchangeRate: data.exchangeRate || 0.13,
        } as Quote);
    });

    return quotes;
  } catch (error) {
    return [];
  }
}

export async function getQuoteById(id: string, clientId?: string): Promise<Quote | null> {
    try {
        const quoteRef = clientId 
            ? doc(db, 'clients', clientId, 'quotes', id)
            : doc(db, 'quotes', id);
            
        const quoteSnap = await getDoc(quoteRef);

        if (!quoteSnap.exists()) return null;

        const data = quoteSnap.data();
        return {
            id: quoteSnap.id,
            ...data,
            issueDate: parseDate(data.issueDate),
            validUntil: parseDate(data.validUntil),
            createdAt: parseDate(data.createdAt),
            exchangeRate: data.exchangeRate || 0.13,
        } as Quote;
    } catch (error) {
        return null;
    }
}

export async function deleteQuote(id: string) {
    try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnap = await getDoc(quoteRef);
        
        if (quoteSnap.exists()) {
            const data = quoteSnap.data();
            if (data.customerId) {
                await deleteDoc(doc(db, 'clients', data.customerId, 'quotes', id));
            }
        }
        
        await deleteDoc(quoteRef);
        return { success: true, message: 'Proforma Invoice deleted successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateQuoteStatus(id: string, status: string) {
    try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnap = await getDoc(quoteRef);
        if (!quoteSnap.exists()) return { success: false, message: 'Proforma not found.' };
        
        const quoteData = quoteSnap.data();
        const previousStatus = quoteData.status;

        await updateDoc(quoteRef, { status });
        
        // Sync Client Copy
        if (quoteData.customerId) {
            await updateDoc(doc(db, 'clients', quoteData.customerId, 'quotes', id), { status });
        }
        
        const isPositiveStatus = status === 'accepted' || status === 'paid';
        const wasPositiveStatus = previousStatus === 'accepted' || previousStatus === 'paid';

        if (isPositiveStatus && !wasPositiveStatus) {
            const fullQuote = await getQuoteById(id);
            if(fullQuote) {
                if (fullQuote.orderId) {
                    await updateOrderFromQuote(fullQuote);
                    await updateOrderStatus(fullQuote.orderId, 'validated');
                    
                    if (status === 'paid') {
                        await updateOrderPaymentStatus(fullQuote.orderId, 'paid');
                    }
                } else {
                    const orderResult = await addOrder(fullQuote);
                    if (orderResult.success && orderResult.id && status === 'paid') {
                         await updateOrderPaymentStatus(orderResult.id, 'paid');
                    }
                }
            }
        } else if (status === 'paid' && previousStatus === 'accepted') {
            const fullQuote = await getQuoteById(id);
            if (fullQuote && fullQuote.orderId) {
                await updateOrderPaymentStatus(fullQuote.orderId, 'paid');
            }
        }
        
        return { success: true, message: 'Proforma status updated successfully!' };
    } catch (error: any) {
        console.error("Error updating quote status:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
