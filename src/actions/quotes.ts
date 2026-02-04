
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, updateDoc, getDoc, where } from 'firebase/firestore';
import { z } from 'zod';
import { addOrder, updateOrderFromQuote, Order, getOrderById } from './orders';
import { addInvoiceFromOrder, updateInvoiceFromQuote } from './invoices';

export interface QuoteItem {
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  purchasePrice?: number;
  total: number;
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
    totalAmount: number;
    status: "draft" | "sent" | "accepted" | "rejected";
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
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && 'seconds' in val) {
        return new Date(val.seconds * 1000).toISOString();
    }
    return new Date().toISOString();
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
 * Adds a new Proforma to the global /quotes collection.
 * It's immediately visible to both Admin (global list) and Client (filtered by ID).
 */
export async function addQuote(values: any) {
    try {
        const currentRate = await getGlobalExchangeRate();
        const docRef = await addDoc(collection(db, 'quotes'), {
            ...values,
            exchangeRate: currentRate,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Proforma Invoice added successfully!', id: docRef.id };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateQuote(id: string, values: any) {
    try {
        const quoteRef = doc(db, 'quotes', id);
        await updateDoc(quoteRef, values);

        const updatedQuote = await getQuoteById(id);
        if (updatedQuote && updatedQuote.status === 'accepted') {
            const orderUpdateResult = await updateOrderFromQuote(updatedQuote);
            if (orderUpdateResult.success && orderUpdateResult.orderId) {
                await updateInvoiceFromQuote(updatedQuote, orderUpdateResult.orderId);
            }
        }

        return { success: true, message: 'Proforma Invoice updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function createQuoteFromOrder(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        if (!order) return { success: false, message: "Commande introuvable." };
        const currentRate = await getGlobalExchangeRate();

        const newQuoteData = {
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
            })),
            subTotal: order.totalAmount || 0,
            transportCost: order.transportCost || 0,
            commissionRate: order.commissionRate || 0,
            totalAmount: order.totalAmount || 0,
            status: "draft" as const,
            shippingAddress: order.shippingAddress || "",
            notes: "Généré automatiquement depuis la commande " + order.orderNumber,
            depositRequired: true,
            depositPercentage: 30,
            exchangeRate: currentRate,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'quotes'), newQuoteData);
        return { success: true, message: 'Proforma générée automatiquement !', id: docRef.id };
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

export async function getQuoteById(id: string): Promise<Quote | null> {
    try {
        const quoteRef = doc(db, 'quotes', id);
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
        await deleteDoc(doc(db, 'quotes', id));
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
        
        if (status === 'accepted' && previousStatus !== 'accepted') {
            const fullQuote = await getQuoteById(id);
            if(fullQuote) {
                const orderResult = await addOrder(fullQuote);
                if (orderResult.success && orderResult.id) {
                     const orderDataForInvoice = await getOrderById(orderResult.id);
                     if (orderDataForInvoice) {
                        await addInvoiceFromOrder(orderDataForInvoice);
                     }
                }
            }
        }
        
        return { success: true, message: 'Proforma status updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
