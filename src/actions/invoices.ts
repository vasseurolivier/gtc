
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
    paymentDate?: string;
    createdAt: string;
    supplierCostTotal?: number;
    supplierCostPaid?: number;
    transportCost?: number;
    transportCostPaid?: number;
    exchangeRate: number; // Stored at creation to freeze EUR price
    shippingAddress?: string;
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

export async function addInvoiceFromOrder(order: Order) {
    try {
        const currentRate = await getGlobalExchangeRate();
        const supplierCostTotal = order.items.reduce((sum, item) => sum + (item.purchasePrice || 0) * item.quantity, 0);

        const newInvoiceData = {
          invoiceNumber: `INV-${order.orderNumber.replace('O-', '').replace('ORD-', '')}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          issueDate: new Date().toISOString(),
          dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
          exchangeRate: currentRate,
          shippingAddress: order.shippingAddress || "",
          createdAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(collection(db, 'invoices'), newInvoiceData);
        return { success: true, message: 'Invoice created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding invoice:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceFromQuote(quote: Quote, orderId: string) {
    try {
        const invoicesQuery = query(collection(db, "invoices"), where("orderId", "==", orderId));
        const invoicesSnapshot = await getDocs(invoicesQuery);

        if (invoicesSnapshot.empty) {
            return { success: true, message: "No matching invoice found to update." };
        }

        const invoiceDoc = invoicesSnapshot.docs[0];
        const invoiceRef = doc(db, 'invoices', invoiceDoc.id);

        const supplierCostTotal = quote.items.reduce((sum, item) => sum + (item.purchasePrice || 0) * item.quantity, 0);

        const updatedInvoiceData = {
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items.map(item => ({
                description: item.description,
                sku: item.sku || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                purchasePrice: item.purchasePrice || 0,
                total: item.total
            })),
            totalAmount: quote.totalAmount,
            supplierCostTotal: supplierCostTotal,
            transportCost: quote.transportCost || 0,
            shippingAddress: quote.shippingAddress || "",
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
          issueDate: parseDate(data.issueDate),
          dueDate: parseDate(data.dueDate),
          paymentDate: data.paymentDate ? parseDate(data.paymentDate) : undefined,
          createdAt: parseDate(data.createdAt),
          exchangeRate: data.exchangeRate || 0.13,
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
            exchangeRate: data.exchangeRate || 0.13,
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

export async function updateInvoiceStatus(id: string, status: string) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const updateData: any = { status };
        if (status === 'paid') {
            updateData.paymentDate = serverTimestamp();
        }
        await updateDoc(invoiceRef, updateData);
        return { success: true, message: 'Invoice status updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceAmountPaid(id: string, amount: number, currency: 'CNY' | 'EUR' | 'USD', exchangeRate: number) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) return { success: false, message: 'Invoice not found.' };

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
        } else {
             newStatus = 'unpaid';
        }

        updateData.status = newStatus;
        await updateDoc(invoiceRef, updateData);

        return { success: true, message: `Paiement enregistré.`, newStatus: newStatus, newAmountPaid: newTotalAmountPaidInCny };
    } catch (error: any) {
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
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceSupplierCostTotal(id: string, cost: number) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        await updateDoc(invoiceRef, { supplierCostTotal: cost });
        return { success: true, message: 'Coût usine mis à jour.' };
    } catch (error: any) {
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
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
