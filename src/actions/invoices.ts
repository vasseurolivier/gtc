
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
  issueDate: z.date({ required_error: "Issue date is required."}),
  dueDate: z.date({ required_error: "Due date is required."}),
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
          dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days later
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
        
        const validatedData = invoiceSchema.parse(newInvoiceData);

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

        const supplierCostTotal = quote.items.reduce((sum, item) => sum + (item.purchasePrice || 0) * item.quantity, 0);

        const updatedInvoiceData = {
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items.map(item => ({
                ...item,
                purchasePrice: item.purchasePrice || 0
            })),
            totalAmount: quote.totalAmount,
            supplierCostTotal: supplierCostTotal,
            transportCost: quote.transportCost || 0,
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

    for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const invoice: Invoice = {
          id: doc.id,
          ...data,
          issueDate: data.issueDate?.toDate().toISOString() || new Date().toISOString(),
          dueDate: data.dueDate?.toDate().toISOString() || new Date().toISOString(),
          paymentDate: data.paymentDate?.toDate().toISOString() || undefined,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Invoice;
        
        // No longer auto-calculating supplierCostTotal here. It's now stored on the invoice.
        invoices.push(invoice);
    }

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

        const invoice = {
            id: invoiceSnap.id,
            ...data,
            issueDate: data.issueDate?.toDate().toISOString() || new Date().toISOString(),
            dueDate: data.dueDate?.toDate().toISOString() || new Date().toISOString(),
            paymentDate: data.paymentDate?.toDate().toISOString() || undefined,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Invoice;
        
        // No longer auto-calculating supplierCostTotal here
        
        return invoice;

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
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return { success: false, message: "Invoice not found." };
        }
        const invoiceData = invoiceSnap.data();


        const updateData: { status: string, paymentDate?: Date | null } = { status: validatedStatus };
        if (validatedStatus === 'paid') {
            updateData.paymentDate = invoiceData.paymentDate ? invoiceData.paymentDate.toDate() : new Date();
        } else {
             // If status is changed from 'paid' to something else, clear the payment date
            if (invoiceData.status === 'paid') {
                updateData.paymentDate = null;
            }
        }

        await updateDoc(invoiceRef, updateData);
        
        return { success: true, message: 'Invoice status updated successfully!' };
    } catch (error: any) {
        console.error('Error updating invoice status:', error);
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid status value.' };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function updateInvoiceAmountPaid(id: string, amount: number, currency: 'CNY' | 'EUR' | 'USD', exchangeRate: number) {
    try {
        if (typeof amount !== 'number') {
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

        // Convert amount to CNY if it's in a foreign currency
        const amountInCny = currency === 'CNY' ? amount : amount / exchangeRate;
        const newTotalAmountPaidInCny = (invoiceData.amountPaid || 0) + amountInCny;

        const updateData: { amountPaid: number, status: string, paymentDate?: Date | null } = {
            amountPaid: newTotalAmountPaidInCny,
            status: newStatus
        };

        if (newTotalAmountPaidInCny >= totalAmount) {
            newStatus = 'paid';
            updateData.paymentDate = invoiceData.paymentDate ? invoiceData.paymentDate.toDate() : new Date();
        } else if (newTotalAmountPaidInCny > 0) {
            newStatus = 'partially_paid';
            updateData.paymentDate = null; // Clear payment date if not fully paid
        } else if (invoiceData.status !== 'cancelled' && invoiceData.dueDate.toDate() < new Date()) {
            newStatus = 'overdue';
            updateData.paymentDate = null;
        } else if (invoiceData.status !== 'cancelled') {
             newStatus = 'unpaid';
             updateData.paymentDate = null;
        }

        updateData.status = newStatus;

        await updateDoc(invoiceRef, updateData);

        const operation = amount >= 0 ? 'Payment' : 'Correction';
        return { success: true, message: `${operation} of ${amount} ${currency} recorded.`, newStatus: newStatus, newAmountPaid: newTotalAmountPaidInCny };
    } catch (error: any) {
        console.error('Error updating amount paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


export async function updateInvoiceSupplierCostPaid(id: string, amount: number) {
    try {
        if (typeof amount !== 'number') {
            return { success: false, message: 'Invalid amount paid value.' };
        }
        
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return { success: false, message: 'Invoice not found.' };
        }
        
        const invoiceData = invoiceSnap.data();
        const newSupplierCostPaid = (invoiceData.supplierCostPaid || 0) + amount;

        await updateDoc(invoiceRef, { supplierCostPaid: newSupplierCostPaid });

        const operation = amount >= 0 ? 'Payment' : 'Correction';
        return { success: true, message: `${operation} of ¥${amount.toFixed(2)} to supplier recorded.`, newSupplierCostPaid: newSupplierCostPaid };

    } catch (error: any) {
        console.error('Error updating supplier cost paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceSupplierCostTotal(id: string, cost: number) {
    try {
        if (typeof cost !== 'number' || cost < 0) {
            return { success: false, message: 'Invalid cost value.' };
        }
        
        const invoiceRef = doc(db, 'invoices', id);
        await updateDoc(invoiceRef, { supplierCostTotal: cost });

        return { success: true, message: 'Supplier cost updated successfully.' };

    } catch (error: any) {
        console.error('Error updating supplier total cost:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceTransportCostPaid(id: string, amount: number) {
    try {
        if (typeof amount !== 'number') {
            return { success: false, message: 'Invalid amount paid value.' };
        }
        
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            return { success: false, message: 'Invoice not found.' };
        }
        
        const invoiceData = invoiceSnap.data();
        const newTransportCostPaid = (invoiceData.transportCostPaid || 0) + amount;

        await updateDoc(invoiceRef, { transportCostPaid: newTransportCostPaid });

        const operation = amount >= 0 ? 'Payment' : 'Correction';
        return { success: true, message: `${operation} of ¥${amount.toFixed(2)} to transporter recorded.`, newTransportCostPaid: newTransportCostPaid };

    } catch (error: any) {
        console.error('Error updating transport cost paid:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
