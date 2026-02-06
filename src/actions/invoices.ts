'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, where, setDoc } from 'firebase/firestore';
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
        const invoiceId = `INV-DOC-${Date.now()}`;

        // Si la commande est déjà notée comme payée, on génère une facture acquittée
        const isPaid = order.paymentStatus === 'paid';

        const newInvoiceData = {
          id: invoiceId,
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
          status: isPaid ? 'paid' : 'unpaid',
          amountPaid: isPaid ? order.totalAmount : 0,
          paymentDate: isPaid ? new Date().toISOString() : null,
          supplierCostTotal: supplierCostTotal,
          supplierCostPaid: 0,
          transportCost: order.transportCost || 0,
          transportCostPaid: 0,
          exchangeRate: currentRate,
          shippingAddress: order.shippingAddress || "",
          createdAt: serverTimestamp(),
        };
        
        // Master Copy
        await setDoc(doc(db, 'invoices', invoiceId), newInvoiceData);
        // Client Copy
        await setDoc(doc(db, 'clients', order.customerId, 'invoices', invoiceId), newInvoiceData);

        return { success: true, message: 'Invoice created successfully!', id: invoiceId };
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
          exchangeRate: data.exchangeRate || 0.13,
        } as Invoice);
    });

    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function getInvoiceById(id: string, clientId?: string): Promise<Invoice | null> {
    try {
        const invoiceRef = clientId 
            ? doc(db, 'clients', clientId, 'invoices', id)
            : doc(db, 'invoices', id);
            
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
        const invRef = doc(db, 'invoices', id);
        const invSnap = await getDoc(invRef);
        
        if (invSnap.exists()) {
            const data = invSnap.data();
            if (data.customerId) {
                await deleteDoc(doc(db, 'clients', data.customerId, 'invoices', id));
            }
        }
        
        await deleteDoc(invRef);
        return { success: true, message: 'Invoice deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateInvoiceStatus(id: string, status: string) {
    try {
        const invoiceRef = doc(db, 'invoices', id);
        const invSnap = await getDoc(invoiceRef);
        if (!invSnap.exists()) return { success: false, message: 'Not found' };
        
        const updateData: any = { status };
        if (status === 'paid') {
            updateData.paymentDate = serverTimestamp();
        }
        
        await updateDoc(invoiceRef, updateData);
        
        // Sync Client Copy
        const clientId = invSnap.data().customerId;
        if (clientId) {
            await updateDoc(doc(db, 'clients', clientId, 'invoices', id), updateData);
        }

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
        
        // Sync Client Copy
        if (invoiceData.customerId) {
            await updateDoc(doc(db, 'clients', invoiceData.customerId, 'invoices', id), updateData);
        }

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
