
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, updateDoc, getDoc, where } from 'firebase/firestore';
import { z } from 'zod';
import { addOrder, updateOrderFromQuote, Order, getOrderById } from './orders';
import { addInvoiceFromOrder, updateInvoiceFromQuote } from './invoices';

const quoteItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description cannot be empty."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative."),
  purchasePrice: z.coerce.number().nonnegative("Purchase price cannot be negative.").optional().default(0),
  total: z.coerce.number().nonnegative("Total cannot be negative."),
});

const quoteStatusSchema = z.enum(["draft", "sent", "accepted", "rejected"]);

const quoteSchema = z.object({
  quoteNumber: z.string().min(1, "Proforma number is required."),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  orderId: z.string().optional(),
  issueDate: z.any(),
  validUntil: z.any(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required."),
  subTotal: z.coerce.number(),
  transportCost: z.coerce.number().nonnegative("Transport cost cannot be negative.").optional().default(0),
  commissionRate: z.coerce.number().min(0).max(100).optional().default(0),
  totalAmount: z.coerce.number().nonnegative({ message: "Total amount cannot be negative." }),
  status: quoteStatusSchema,
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  depositRequired: z.boolean().default(true),
  depositPercentage: z.coerce.number().min(0).max(100).optional().default(30),
});

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

export async function createQuoteFromOrder(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        if (!order) return { success: false, message: "Commande introuvable." };

        const newQuoteData = {
            quoteNumber: `PI-${order.orderNumber.replace('ORD-', '').replace('O-', '')}`,
            customerId: order.customerId,
            customerName: order.customerName,
            orderId: order.id,
            issueDate: new Date(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 15)),
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
        };

        const docRef = await addDoc(collection(db, 'quotes'), {
            ...newQuoteData,
            createdAt: serverTimestamp(),
        });

        return { success: true, message: 'Proforma générée automatiquement !', id: docRef.id };
    } catch (error: any) {
        console.error('Error creating quote from order:', error);
        return { success: false, message: 'Échec de la génération automatique.' };
    }
}

export async function addQuote(values: z.infer<typeof quoteSchema>) {
    try {
        const docRef = await addDoc(collection(db, 'quotes'), {
            ...values,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Proforma Invoice added successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding quote:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateQuote(id: string, values: z.infer<typeof quoteSchema>) {
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
        console.error('Error updating quote:', error);
        return { success: false, message: 'An unexpected error occurred.' };
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
        } as Quote);
    });

    return quotes;
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
    try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnap = await getDoc(quoteRef);

        if (!quoteSnap.exists()) {
            return null;
        }

        const data = quoteSnap.data();

        return {
            id: quoteSnap.id,
            ...data,
            issueDate: parseDate(data.issueDate),
            validUntil: parseDate(data.validUntil),
            createdAt: parseDate(data.createdAt),
        } as Quote;

    } catch (error) {
        console.error("Error fetching quote details:", error);
        return null;
    }
}

export async function deleteQuote(id: string) {
    try {
        await deleteDoc(doc(db, 'quotes', id));
        return { success: true, message: 'Proforma Invoice deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting quote:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateQuoteStatus(id: string, status: z.infer<typeof quoteStatusSchema>) {
    try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnap = await getDoc(quoteRef);
        if (!quoteSnap.exists()) {
            return { success: false, message: 'Proforma not found.' };
        }
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
        console.error('Error updating proforma status:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
