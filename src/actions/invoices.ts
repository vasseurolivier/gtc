
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, where } from 'firebase/firestore';
import { z } from 'zod';
import { getOrderById, type Order, type OrderItem } from './orders';
import type { Quote } from './quotes';

const invoiceItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().positive("Qty must be > 0."),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative."),
  purchasePrice: z.coerce.number().nonnegative("Cost price cannot be negative.").optional().default(0),
  total: z.number(),
});

const invoiceStatusSchema = z.enum(["unpaid", "paid", "overdue", "cancelled", "partially_paid"]);

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  issueDate: z.any(),
  dueDate: z.any(),
  items: z.array(invoiceItemSchema).min(1, "Please add at least one item."),
  totalAmount: z.coerce.number(),
  amountPaid: z.coerce.number().nonnegative("Amount paid cannot be negative.").optional().default(0),
  status: invoiceStatusSchema,
  supplierCostTotal: z.coerce.number().nonnegative("Supplier cost cannot be negative.").optional().default(0),
  supplierCostPaid: z.coerce.number().nonnegative("Supplier amount paid cannot be negative.").optional().default(0),
  transportCost: z.coerce.number().optional(),
  transportCostPaid: z.coerce.number().nonnegative("Transport cost paid cannot be negative.").optional().default(0),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId?: string;
    orderNumber?: string;
    customerId: string;
    customerName: string;
    items: InvoiceItem[];
    totalAmount: number;
    amountPaid?: number;
    amountPaidCurrency?: 'CNY' | 'EUR' | 'USD';
    status: "unpaid" | "paid" | "overdue" | "cancelled" | "partially_paid";
    issueDate: string;
    dueDate: string;
    paymentDate?: string;
    createdAt: string;
    supplierCostTotal?: number;
    supplierCostPaid?: number;
    transportCost?: number;
    transportCostPaid?: number;
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

export async function addInvoiceFromOrder(order: Order) {
    try {
        const supplierCostTotal = order.items.reduce((sum, item) => sum + (item.purchasePrice || 0) * item.quantity, 0);

        const newInvoiceData = {
          invoiceNumber: `INV-${order.orderNumber.replace('O-', '')}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          issueDate: new Date(),
          dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
          items: order.items.map(item => ({
            ...item,
            purchasePrice: item.purchasePrice || 0
          })),
          totalAmount: order.totalAmount,
          status: 'unpaid' as const,
          amountPaid: 0,
          supplierCostTotal: supplierCostTotal,
          supplierCostPaid: 0,
          transportCost: order.transportCost || 0,
          transportCostPaid: 0,
        };
        
        const docRef = await addDoc(collection(db, 'invoices'), {
            ...newInvoiceData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Invoice created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding invoice:', error);
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
          issueDate: parseDate(data.issueDate),
          dueDate: parseDate(data.dueDate),
          paymentDate: data.paymentDate ? parseDate(data.paymentDate) : undefined,
          createdAt: parseDate(data.createdAt),
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

        const data = invoiceSnap.data();

        return {
            id: invoiceSnap.id,
            ...data,
            issueDate: parseDate(data.issueDate),
            dueDate: parseDate(data.dueDate),
            paymentDate: data.paymentDate ? parseDate(data.paymentDate) : undefined,
            createdAt: parseDate(data.createdAt),
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
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return { success: false, message: "Invoice not found." };
        }
        const invoiceData = invoiceSnap.data();

        const updateData: { status: string, paymentDate?: any } = { status };
        if (status === 'paid') {
            updateData.paymentDate = serverTimestamp();
        } else if (invoiceData.status === 'paid') {
            updateData.paymentDate = null;
        }

        await updateDoc(invoiceRef, updateData);
        
        return { success: true, message: 'Invoice status updated successfully!' };
    } catch (error: any) {
        console.error('Error updating invoice status:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceAmountPaid(id: string, amount: number, currency: 'CNY' | 'EUR' | 'USD', exchangeRate: number) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return { success: false, message: 'Invoice not found.' };
        }

        const invoiceData = invoiceSnap.data();
        const totalAmount = invoiceData.totalAmount;
        let newStatus: Invoice['status'] = invoiceData.status;

        const amountInCny = currency === 'CNY' ? amount : amount / exchangeRate;
        const newTotalAmountPaidInCny = (invoiceData.amountPaid || 0) + amountInCny;

        const updateData: any = {
            amountPaid: newTotalAmountPaidInCny,
        };

        if (newTotalAmountPaidInCny >= totalAmount) {
            newStatus = 'paid';
            updateData.paymentDate = serverTimestamp();
        } else if (newTotalAmountPaidInCny > 0) {
            newStatus = 'partially_paid';
            updateData.paymentDate = null;
        } else {
             newStatus = 'unpaid';
             updateData.paymentDate = null;
        }

        updateData.status = newStatus;
        await updateDoc(invoiceRef, updateData);

        return { success: true, message: `Paiement enregistré.`, newStatus: newStatus, newAmountPaid: newTotalAmountPaidInCny };
    } catch (error: any) {
        console.error('Error updating amount paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceSupplierCostPaid(id: string, amount: number) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);
        if (!invoiceSnap.exists()) return { success: false, message: 'Invoice not found.' };
        
        const invoiceData = invoiceSnap.data();
        const newSupplierCostPaid = (invoiceData.supplierCostPaid || 0) + amount;
        await updateDoc(invoiceRef, { supplierCostPaid: newSupplierCostPaid });
        return { success: true, message: `Paiement fournisseur enregistré.`, newSupplierCostPaid: newSupplierCostPaid };
    } catch (error: any) {
        console.error('Error updating supplier cost paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceSupplierCostTotal(id: string, cost: number) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        await updateDoc(invoiceRef, { supplierCostTotal: cost });
        return { success: true, message: 'Coût usine mis à jour.' };
    } catch (error: any) {
        console.error('Error updating supplier total cost:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceTransportCostPaid(id: string, amount: number) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);
        if (!invoiceSnap.exists()) return { success: false, message: 'Invoice not found.' };
        
        const invoiceData = invoiceSnap.data();
        const newTransportCostPaid = (invoiceData.transportCostPaid || 0) + amount;
        await updateDoc(invoiceRef, { transportCostPaid: newTransportCostPaid });
        return { success: true, message: `Paiement transporteur enregistré.`, newTransportCostPaid: newTransportCostPaid };
    } catch (error: any) {
        console.error('Error updating transport cost paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
