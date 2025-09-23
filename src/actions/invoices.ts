
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import type { Order } from './orders';

const invoiceStatusSchema = z.enum(["unpaid", "paid", "overdue", "cancelled"]);

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  items: z.array(z.any()), // Keep items flexible
  totalAmount: z.coerce.number(),
  status: invoiceStatusSchema,
  issueDate: z.date(),
  dueDate: z.date(),
});

export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    status: "unpaid" | "paid" | "overdue" | "cancelled";
    issueDate: string;
    dueDate: string;
    createdAt: string;
}

export async function addInvoice(order: Order) {
    try {
        const newInvoiceData = {
          invoiceNumber: `INV-${order.orderNumber.replace('O-', '')}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          items: order.items,
          totalAmount: order.totalAmount,
          status: "unpaid",
          issueDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Due in 30 days
          createdAt: serverTimestamp(),
        };

        const validatedData = invoiceSchema.partial().parse(newInvoiceData);
        
        const docRef = await addDoc(collection(db, 'invoices'), validatedData);
        return { success: true, message: 'Invoice created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding invoice:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
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
