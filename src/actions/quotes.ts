'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, updateDoc, getDoc, where, setDoc } from 'firebase/firestore';
import { addOrder, updateOrderFromQuote, Order, getOrderById, updateOrderStatus, updateOrderPaymentStatus } from './orders';
import { addInvoiceFromOrder } from './invoices';

export interface QuoteItem {
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitPriceEur?: number;
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
    updatedAt?: string;
    depositRequired?: boolean;
    depositPercentage?: number;
    exchangeRate: number; 
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

async function getExchangeRateForClient(clientId?: string): Promise<number> {
    try {
        if (clientId) {
            const clientRef = doc(db, 'clients', clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists() && clientSnap.data().exchangeRate) {
                return Number(clientSnap.data().exchangeRate);
            }
        }
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

export async function addQuote(values: any) {
    try {
        const currentRate = await getExchangeRateForClient(values.customerId);
        const quoteId = `QT-${Date.now()}`;
        
        const subTotal = values.items.reduce((sum: number, i: any) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);
        const transport = Number(values.transportCost) || 0;
        const commRate = Number(values.commissionRate) || 0;
        const basis = values.commissionBasis || 'products_only';
        
        let totalAmount = 0;
        if (basis === 'total') {
            totalAmount = (subTotal + transport) * (1 + commRate / 100);
        } else {
            totalAmount = subTotal * (1 + commRate / 100) + transport;
        }

        const data = {
            ...values,
            id: quoteId,
            subTotal,
            totalAmount,
            exchangeRate: currentRate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            issueDate: values.issueDate instanceof Date ? values.issueDate.toISOString() : parseDate(values.issueDate),
            validUntil: values.validUntil instanceof Date ? values.validUntil.toISOString() : parseDate(values.validUntil),
        };

        // Master Copy
        await setDoc(doc(db, 'quotes', quoteId), data);
        // Client Copy
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
        const items = values.items || quoteData.items;
        const subTotal = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);
        const transport = values.transportCost !== undefined ? Number(values.transportCost) : (quoteData.transportCost || 0);
        const commRate = values.commissionRate !== undefined ? Number(values.commissionRate) : (quoteData.commissionRate || 0);
        const basis = values.commissionBasis || quoteData.commissionBasis || 'products_only';

        let totalAmount = 0;
        if (basis === 'total') {
            totalAmount = (subTotal + transport) * (1 + commRate / 100);
        } else {
            totalAmount = subTotal * (1 + commRate / 100) + transport;
        }

        const updateData = {
            ...values,
            subTotal,
            totalAmount,
            updatedAt: serverTimestamp(),
            issueDate: values.issueDate instanceof Date ? values.issueDate.toISOString() : parseDate(values.issueDate || quoteData.issueDate),
            validUntil: values.validUntil instanceof Date ? values.validUntil.toISOString() : parseDate(values.validUntil || quoteData.validUntil),
        };

        await updateDoc(quoteRef, updateData);
        if (quoteData.customerId) {
            const clientQuoteRef = doc(db, 'clients', quoteData.customerId, 'quotes', id);
            await updateDoc(clientQuoteRef, updateData);
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

export async function syncQuoteFromOrder(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        if (!order) return { success: false, message: "Commande introuvable." };

        const quotesQuery = query(collection(db, "quotes"), where("orderId", "==", orderId));
        const quotesSnapshot = await getDocs(quotesQuery);

        if (quotesSnapshot.empty) return { success: false, message: "Aucune PI liée." };

        const quoteDoc = quotesSnapshot.docs[0];
        const itemsSubTotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const transport = Number(order.transportCost) || 0;
        const commRate = Number(order.commissionRate) || 0;
        const basis = order.commissionBasis || 'products_only';

        let calculatedTotal = 0;
        if (basis === 'total') {
            calculatedTotal = (itemsSubTotal + transport) * (1 + commRate / 100);
        } else {
            calculatedTotal = itemsSubTotal * (1 + commRate / 100) + transport;
        }

        const updatedQuoteData = {
            items: order.items.map(item => ({
                sku: item.sku || "",
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitPriceEur: item.unitPriceEur || 0,
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
            status: "sent" as const, 
            updatedAt: serverTimestamp(),
        };

        await updateQuote(quoteDoc.id, updatedQuoteData);
        return { success: true, message: "PI mise à jour." };
    } catch (error: any) {
        return { success: false, message: "Erreur lors de la synchronisation." };
    }
}

export async function createQuoteFromOrder(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        if (!order) return { success: false, message: "Commande introuvable." };
        
        const currentRate = await getExchangeRateForClient(order.customerId);
        const quoteId = `PI-AUTO-${Date.now()}`;

        const itemsSubTotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const transport = Number(order.transportCost) || 0;
        const commRate = Number(order.commissionRate) || 0;
        const basis = order.commissionBasis || 'products_only';
        
        let calculatedTotal = 0;
        if (basis === 'total') {
            calculatedTotal = (itemsSubTotal + transport) * (1 + commRate / 100);
        } else {
            calculatedTotal = itemsSubTotal * (1 + commRate / 100) + transport;
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
                unitPriceEur: item.unitPriceEur || 0,
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
            updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'quotes', quoteId), newQuoteData);
        await setDoc(doc(db, 'clients', order.customerId, 'quotes', quoteId), newQuoteData);

        return { success: true, message: 'Proforma générée !', id: quoteId };
    } catch (error: any) {
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
          ...data,
          id: doc.id,
          issueDate: parseDate(data.issueDate),
          validUntil: parseDate(data.validUntil),
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
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
            ...data,
            id: quoteSnap.id,
            issueDate: parseDate(data.issueDate),
            validUntil: parseDate(data.validUntil),
            createdAt: parseDate(data.createdAt),
            updatedAt: parseDate(data.updatedAt),
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

        await updateDoc(quoteRef, { status, updatedAt: serverTimestamp() });
        if (quoteData.customerId) {
            await updateDoc(doc(db, 'clients', quoteData.customerId, 'quotes', id), { status, updatedAt: serverTimestamp() });
        }
        
        const isPositiveStatus = status === 'accepted' || status === 'paid';
        const wasPositiveStatus = previousStatus === 'accepted' || previousStatus === 'paid';

        if (isPositiveStatus && !wasPositiveStatus) {
            const fullQuote = await getQuoteById(id);
            if(fullQuote) {
                if (fullQuote.orderId) {
                    const upRes = await updateOrderFromQuote(fullQuote);
                    if (!upRes.success) return upRes;
                    
                    await updateOrderStatus(fullQuote.orderId, 'validated');
                    if (status === 'paid') await updateOrderPaymentStatus(fullQuote.orderId, 'paid');
                } else {
                    const orderResult = await addOrder(fullQuote);
                    if (!orderResult.success) return orderResult;
                    
                    if (orderResult.id) {
                        // Link quote to new order
                        await updateDoc(quoteRef, { orderId: orderResult.id });
                        if (quoteData.customerId) {
                            await updateDoc(doc(db, 'clients', quoteData.customerId, 'quotes', id), { orderId: orderResult.id });
                        }
                        
                        if (status === 'paid') {
                            await updateOrderPaymentStatus(orderResult.id, 'paid');
                        }
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
        console.error("updateQuoteStatus error:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
