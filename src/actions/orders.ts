'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { Quote } from './quotes';
import { addInvoiceFromOrder } from './invoices';

const orderStatusSchema = z.enum(["processing", "validated", "shipped", "delivered", "cancelled"]);

const orderItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description cannot be empty."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative."),
  unitPriceEur: z.coerce.number().nonnegative().optional().default(0),
  purchasePrice: z.coerce.number().nonnegative("Purchase price cannot be negative.").optional().default(0),
  total: z.coerce.number().nonnegative("Total cannot be negative."),
  photo: z.string().optional(),
  size: z.string().optional().nullable(),
  isPersonalized: b.boolean().optional(),
  weight: z.coerce.number().optional().default(0),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";

export interface Order {
    id: string;
    orderNumber: string;
    quoteId?: string;
    customerId: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    status: "processing" | "validated" | "shipped" | "delivered" | "cancelled";
    shippingAddress?: string;
    orderDate: string;
    createdAt: string;
    updatedAt?: string;
    transportCost?: number;
    commissionRate?: number;
    commissionBasis?: 'products_only' | 'total';
    paymentStatus: PaymentStatus;
    depositRequired?: boolean;
    depositPercentage?: number;
    exchangeRate: number; // Stored at creation to freeze EUR price
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

export async function addOrder(quote: Quote) {
    try {
        const newOrderData = {
          orderNumber: `O-${quote.quoteNumber.replace('PI-', '')}`,
          quoteId: quote.id,
          customerId: quote.customerId,
          customerName: quote.customerName,
          items: quote.items.map(item => ({
            description: item.description,
            sku: item.sku || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitPriceEur: item.unitPriceEur || 0,
            purchasePrice: (item as any).purchasePrice || 0,
            total: item.total,
            photo: item.photo || '',
            size: (item as any).size || null,
            isPersonalized: (item as any).isPersonalized || false,
            weight: (item as any).weight || 0
          })),
          totalAmount: quote.totalAmount,
          status: "processing" as const,
          shippingAddress: quote.shippingAddress || "",
          orderDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          transportCost: quote.transportCost || 0,
          commissionRate: quote.commissionRate || 0,
          commissionBasis: quote.commissionBasis || 'products_only',
          paymentStatus: (quote.status === 'paid' ? 'paid' : 'unpaid') as PaymentStatus,
          depositRequired: quote.depositRequired || false,
          depositPercentage: quote.depositPercentage || 30,
          exchangeRate: quote.exchangeRate || 0.13,
        };

        const docRef = await addDoc(collection(db, 'orders'), newOrderData);
        if (newOrderData.paymentStatus === 'paid') {
            const finalOrder = { ...newOrderData, id: docRef.id } as unknown as Order;
            await addInvoiceFromOrder(finalOrder);
        }
        
        // Link quote to new order
        await updateDoc(doc(db, 'quotes', quote.id), { orderId: docRef.id });
        const clientQuoteRef = doc(db, 'clients', quote.customerId, 'quotes', quote.id);
        const clientQuoteSnap = await getDoc(clientQuoteRef);
        if (clientQuoteSnap.exists()) {
            await updateDoc(clientQuoteRef, { orderId: docRef.id });
        }

        return { success: true, message: 'Order created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error("Error creating order:", error);
        return { success: false, message: 'An unexpected error occurred while creating the order.' };
    }
}

export async function updateOrder(id: string, values: Partial<Order>) {
    try {
        const orderRef = doc(db, 'orders', id);
        await updateDoc(orderRef, { ...values, updatedAt: serverTimestamp() });
        return { success: true, message: 'Order updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderFinancials(id: string, financials: { 
    transportCost?: number, 
    transportCurrency?: 'CNY' | 'EUR',
    commissionRate?: number, 
    commissionBasis?: 'products_only' | 'total' 
}) {
    try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return { success: false, message: "Order not found." };
        
        const data = orderSnap.data();
        const effectiveRate = data.exchangeRate || 0.13;
        const itemsTotal = (data.items || []).reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
        
        let costCny = data.transportCost || 0;
        if (financials.transportCost !== undefined) {
            if (financials.transportCurrency === 'EUR') {
                costCny = financials.transportCost / effectiveRate;
            } else {
                costCny = financials.transportCost;
            }
        }

        const rate = financials.commissionRate !== undefined ? financials.commissionRate : (data.commissionRate || 0);
        const basis = financials.commissionBasis !== undefined ? financials.commissionBasis : (data.commissionBasis || 'products_only');

        let newTotal = 0;
        if (basis === 'total') {
            newTotal = (itemsTotal + costCny) * (1 + rate / 100);
        } else {
            const commissionAmount = itemsTotal * (rate / 100);
            newTotal = itemsTotal + commissionAmount + costCny;
        }

        const updatePayload = { 
            transportCost: costCny,
            commissionRate: rate,
            commissionBasis: basis,
            totalAmount: newTotal,
            updatedAt: serverTimestamp()
        };

        await updateDoc(orderRef, updatePayload);

        const invoiceQuery = query(collection(db, 'invoices'), where('orderId', '==', id));
        const invoiceSnap = await getDocs(invoiceQuery);
        if (!invoiceSnap.empty) {
            const finalOrder = { ...data, ...updatePayload, id } as unknown as Order;
            await addInvoiceFromOrder(finalOrder, invoiceSnap.docs[0].id);
        }

        return { success: true, message: 'Finance updated.', newTotal };
    } catch (error: any) {
        console.error("updateOrderFinancials error:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderTransportCost(id: string, cost: number, currency: 'CNY' | 'EUR' = 'CNY') {
    return updateOrderFinancials(id, { transportCost: cost, transportCurrency: currency });
}

export async function updateOrderFromQuote(quote: Quote) {
    try {
        const ordersQuery = query(collection(db, "orders"), where("quoteId", "==", quote.id));
        const ordersSnapshot = await getDocs(ordersQuery);
        if (ordersSnapshot.empty) return { success: true, message: "No matching order." };

        const orderDoc = ordersSnapshot.docs[0];
        const orderRef = doc(db, 'orders', orderDoc.id);

        const updatedOrderData = {
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items.map(item => ({
                description: item.description,
                sku: item.sku || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitPriceEur: item.unitPriceEur || 0,
                purchasePrice: (item as any).purchasePrice || 0,
                total: item.total,
                photo: (item as any).photo || '',
                size: (item as any).size || null,
                isPersonalized: (item as any).isPersonalized || false,
                weight: (item as any).weight || 0
            })),
            totalAmount: quote.totalAmount,
            shippingAddress: quote.shippingAddress || "",
            transportCost: quote.transportCost || 0,
            commissionRate: quote.commissionRate || 0,
            commissionBasis: quote.commissionBasis || 'products_only',
            depositRequired: quote.depositRequired || false,
            depositPercentage: quote.depositPercentage || 30,
            exchangeRate: quote.exchangeRate || 0.13,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(orderRef, updatedOrderData);
        
        const finalOrder = { 
            ...updatedOrderData, 
            id: orderDoc.id, 
            orderNumber: orderDoc.data().orderNumber, 
            paymentStatus: orderDoc.data().paymentStatus,
            orderDate: orderDoc.data().orderDate
        } as unknown as Order;
        
        const invoiceQuery = query(collection(db, 'invoices'), where('orderId', '==', orderDoc.id));
        const invoiceSnap = await getDocs(invoiceQuery);
        if (!invoiceSnap.empty) {
            await addInvoiceFromOrder(finalOrder, invoiceSnap.docs[0].id);
        }
        
        return { success: true, message: 'Order updated!', orderId: orderDoc.id };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          orderDate: parseDate(data.orderDate),
          createdAt: parseDate(data.createdAt),
          updatedAt: data.updatedAt ? parseDate(data.updatedAt) : undefined,
          paymentStatus: data.paymentStatus || (data.isPaid ? 'paid' : 'unpaid'),
          exchangeRate: data.exchangeRate || 0.13,
        } as Order);
    });
    return orders;
  } catch (error) {
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
    try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return null;
        const data = orderSnap.data();
        return {
            id: orderSnap.id,
            ...data,
            orderDate: parseDate(data.orderDate),
            createdAt: parseDate(data.createdAt),
            updatedAt: data.updatedAt ? parseDate(data.updatedAt) : undefined,
            paymentStatus: data.paymentStatus || (data.isPaid ? 'paid' : 'unpaid'),
            exchangeRate: data.exchangeRate || 0.13,
        } as Order;
    } catch (error) {
        return null;
    }
}

export async function deleteOrder(id: string) {
    try {
        await deleteDoc(doc(db, 'orders', id));
        return { success: true, message: 'Order deleted successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const orderRef = doc(db, 'orders', id);
        await updateDoc(orderRef, { status: status, updatedAt: serverTimestamp() });
        return { success: true, message: 'Order status updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus) {
    try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return { success: false, message: "Order not found" };
        
        const currentData = orderSnap.data();
        const updatePayload: any = { paymentStatus, updatedAt: serverTimestamp() };
        if (paymentStatus === 'paid' && currentData.status === 'processing') {
            updatePayload.status = 'validated';
        }
        await updateDoc(orderRef, updatePayload);

        if (paymentStatus === 'paid') {
            const orderData = { ...currentData, ...updatePayload, id: orderSnap.id } as unknown as Order;
            const invoiceQuery = query(collection(db, 'invoices'), where('orderId', '==', id));
            const invoiceSnap = await getDocs(invoiceQuery);
            if (invoiceSnap.empty) {
                await addInvoiceFromOrder(orderData);
            } else {
                await addInvoiceFromOrder(orderData, invoiceSnap.docs[0].id);
            }
        }
        return { success: true, message: 'Payment status updated successfully!' };
    } catch (error: any) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
