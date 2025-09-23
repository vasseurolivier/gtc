
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, where } from 'firebase/firestore';
import { z } from 'zod';
import type { Quote } from './quotes';

const invoiceItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().positive("Qty must be > 0."),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative."),
  total: z.number(),
});

const invoiceStatusSchema = z.enum(["unpaid", "paid", "overdue", "cancelled", "partially_paid"]);

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  issueDate: z.date({ required_error: "Issue date is required."}),
  dueDate: z.date({ required_error: "Due date is required."}),
  items: z.array(invoiceItemSchema).min(1, "Please add at least one item."),
  totalAmount: z.coerce.number(),
  amountPaid: z.coerce.number().nonnegative("Amount paid cannot be negative.").optional().default(0),
  status: invoiceStatusSchema,
});


export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId?: string;
    orderNumber?: string;
    customerId: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    amountPaid?: number;
    status: "unpaid" | "paid" | "overdue" | "cancelled" | "partially_paid";
    issueDate: string;
    dueDate: string;
    createdAt: string;
}

export async function addInvoice(values: z.infer<typeof invoiceSchema>) {
    try {
        const validatedData = invoiceSchema.parse(values);

        const docRef = await addDoc(collection(db, 'invoices'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Invoice created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding invoice:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoice(id: string, values: z.infer<typeof invoiceSchema>) {
    try {
        const validatedData = invoiceSchema.parse(values);
        const invoiceRef = doc(db, 'invoices', id);
        await updateDoc(invoiceRef, {
            ...validatedData,
        });
        return { success: true, message: 'Invoice updated successfully!' };
    } catch (error: any) {
        console.error('Error updating invoice:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceFromQuote(quote: Quote, orderId: string) {
    try {
        const invoicesQuery = query(collection(db, "invoices"), where("orderId", "==", orderId));
        const invoicesSnapshot = await getDocs(invoicesQuery);

        if (invoicesSnapshot.empty) {
            // This can happen if the invoice was not created yet. Not an error.
            return { success: true, message: "No matching invoice found for this order." };
        }

        const invoiceDoc = invoicesSnapshot.docs[0];
        const invoiceRef = doc(db, 'invoices', invoiceDoc.id);

        const updatedInvoiceData = {
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items,
            totalAmount: quote.totalAmount,
            // We don't update status or amountPaid from here, as those are managed separately
        };
        
        await updateDoc(invoiceRef, updatedInvoiceData);

        return { success: true, message: 'Invoice updated successfully from proforma!' };

    } catch (error: any) {
        console.error('Error updating invoice from quote:', error);
        return { success: false, message: 'An unexpected error occurred while updating the invoice.' };
    }
}


export async function getInvoices(): Promise<Invoice[]> {
  try {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const invoices: Invoice[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          issueDate: data.issueDate?.toDate().toISOString() || new Date().toISOString(),
          dueDate: data.dueDate?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Invoice);
    });

    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return null;
        }

        const invoiceData = invoiceSnap.data();

        return {
            id: invoiceSnap.id,
            ...invoiceData,
            issueDate: invoiceData.issueDate?.toDate().toISOString() || new Date().toISOString(),
            dueDate: invoiceData.dueDate?.toDate().toISOString() || new Date().toISOString(),
            createdAt: invoiceData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Invoice;

    } catch (error) {
        console.error("Error fetching invoice details:", error);
        return null;
    }
}


export async function deleteInvoice(id: string) {
    try {
        await deleteDoc(doc(db, 'invoices', id));
        return { success: true, message: 'Invoice deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceStatus(id: string, status: z.infer<typeof invoiceStatusSchema>) {
    try {
        const validatedStatus = invoiceStatusSchema.parse(status);
        const invoiceRef = doc(db, 'invoices', id);
        await updateDoc(invoiceRef, { status: validatedStatus });
        return { success: true, message: 'Invoice status updated successfully!' };
    } catch (error: any) {
        console.error('Error updating invoice status:', error);
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid status value.' };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function updateInvoiceAmountPaid(id: string, amountPaid: number) {
    try {
        if (typeof amountPaid !== 'number' || amountPaid < 0) {
            return { success: false, message: 'Invalid amount paid value.' };
        }
        
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return { success: false, message: 'Invoice not found.' };
        }

        const invoiceData = invoiceSnap.data();
        const totalAmount = invoiceData.totalAmount;
        let newStatus: Invoice['status'] = invoiceData.status;

        if (amountPaid >= totalAmount) {
            newStatus = 'paid';
        } else if (amountPaid > 0) {
            newStatus = 'partially_paid';
        } else if (invoiceData.status !== 'cancelled' && invoiceData.status !== 'overdue') { // avoid overwriting these statuses
            newStatus = 'unpaid';
        }

        await updateDoc(invoiceRef, { 
            amountPaid: amountPaid,
            status: newStatus
        });
        return { success: true, message: 'Amount paid updated successfully!', newStatus: newStatus };
    } catch (error: any) {
        console.error('Error updating amount paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
