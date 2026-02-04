
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
  issueDate: z.date(),
  validUntil: z.date(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required."),
  subTotal: z.coerce.number(),
  transportCost: z.coerce.number().nonnegative("Transport cost cannot be negative.").optional().default(0),
  commissionRate: z.coerce.number().min(0).max(100).optional().default(0),
  totalAmount: z.coerce.number().positive({ message: "Total amount must be a positive number." }),
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

/**
 * Génère automatiquement une Proforma à partir d'une commande existante.
 * Utilisé pour automatiser le flux Admin.
 */
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
                unitPrice: item.unitPrice,
                purchasePrice: (item as any).purchasePrice || 0,
                total: item.total,
            })),
            subTotal: order.totalAmount,
            transportCost: order.transportCost || 0,
            commissionRate: order.commissionRate || 0,
            totalAmount: order.totalAmount,
            status: "draft" as const,
            shippingAddress: order.shippingAddress || "",
            notes: "Généré automatiquement depuis la commande " + order.orderNumber,
            depositRequired: true,
            depositPercentage: 30,
        };

        // Validation via le schéma existant
        const validatedData = quoteSchema.parse(newQuoteData);

        const docRef = await addDoc(collection(db, 'quotes'), {
            ...validatedData,
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
        const validatedData = quoteSchema.parse(values);
        const docRef = await addDoc(collection(db, 'quotes'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Proforma Invoice added successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding quote:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateQuote(id: string, values: z.infer<typeof quoteSchema>) {
    try {
        const validatedData = quoteSchema.parse(values);
        const quoteRef = doc(db, 'quotes', id);
        
        await updateDoc(quoteRef, validatedData);

        // After updating the quote, find and update the related order and invoice
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
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
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
          issueDate: data.issueDate?.toDate().toISOString() || new Date().toISOString(),
          validUntil: data.validUntil?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
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
            issueDate: data.issueDate?.toDate().toISOString() || new Date().toISOString(),
            validUntil: data.validUntil?.toDate().toISOString() || new Date().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
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
        const validatedStatus = quoteStatusSchema.parse(status);
        const quoteRef = doc(db, 'quotes', id);
        
        const quoteSnap = await getDoc(quoteRef);
        if (!quoteSnap.exists()) {
            return { success: false, message: 'Proforma not found.' };
        }
        const quoteData = quoteSnap.data();
        const previousStatus = quoteData.status;

        await updateDoc(quoteRef, { status: validatedStatus });
        
        // If status changes to 'accepted' from another status, create order and invoice
        if (validatedStatus === 'accepted' && previousStatus !== 'accepted') {
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
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid status value.' };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
