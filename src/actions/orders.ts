'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { Quote } from './quotes';

const orderStatusSchema = z.enum(["processing", "validated", "shipped", "delivered", "cancelled"]);

const orderItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description cannot be empty."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative."),
  purchasePrice: z.coerce.number().nonnegative("Purchase price cannot be negative.").optional().default(0),
  total: z.coerce.number().nonnegative("Total cannot be negative."),
  photo: z.string().optional(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

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
    transportCost?: number;
    commissionRate?: number;
    isPaid?: boolean;
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
            purchasePrice: item.purchasePrice || 0,
            total: item.total,
            photo: (item as any).photo || ''
          })),
          totalAmount: quote.totalAmount,
          status: "processing" as const,
          shippingAddress: quote.shippingAddress || "",
          orderDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          transportCost: quote.transportCost || 0,
          commissionRate: quote.commissionRate || 0,
          isPaid: false,
        };

        const docRef = await addDoc(collection(db, 'orders'), newOrderData);
        return { success: true, message: 'Order created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding order:', error);
        return { success: false, message: 'An unexpected error occurred while creating the order.' };
    }
}

export async function updateOrderFromQuote(quote: Quote) {
    try {
        const ordersQuery = query(collection(db, "orders"), where("quoteId", "==", quote.id));
        const ordersSnapshot = await getDocs(ordersQuery);

        if (ordersSnapshot.empty) {
            return { success: true, message: "No matching order found to update." };
        }

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
                purchasePrice: item.purchasePrice || 0,
                total: item.total,
                photo: (item as any).photo || ''
            })),
            totalAmount: quote.totalAmount,
            shippingAddress: quote.shippingAddress || "",
            transportCost: quote.transportCost || 0,
            commissionRate: quote.commissionRate || 0,
        };

        await updateDoc(orderRef, updatedOrderData);
        
        return { success: true, message: 'Order updated successfully from proforma!', orderId: orderDoc.id };

    } catch (error: any) {
        console.error('Error updating order from quote:', error);
        return { success: false, message: 'An unexpected error occurred while updating the order.' };
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
          isPaid: data.isPaid || false,
        } as Order);
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
    try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return null;
        }

        const data = orderSnap.data();

        return {
            id: orderSnap.id,
            ...data,
            orderDate: parseDate(data.orderDate),
            createdAt: parseDate(data.createdAt),
            isPaid: data.isPaid || false,
        } as Order;

    } catch (error) {
        console.error("Error fetching order details:", error);
        return null;
    }
}

export async function deleteOrder(id: string) {
    try {
        await deleteDoc(doc(db, 'orders', id));
        return { success: true, message: 'Order deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting order:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const orderRef = doc(db, 'orders', id);
        await updateDoc(orderRef, { status: status });
        return { success: true, message: 'Order status updated successfully!' };
    } catch (error: any) {
        console.error('Error updating order status:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderPaymentStatus(id: string, isPaid: boolean) {
    try {
        const orderRef = doc(db, 'orders', id);
        await updateDoc(orderRef, { isPaid });
        return { success: true, message: 'Payment status updated successfully!' };
    } catch (error: any) {
        console.error('Error updating payment status:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateOrderTransportCost(id: string, cost: number) {
    try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return { success: false, message: "Order not found." };
        
        const data = orderSnap.data();
        const itemsTotal = (data.items || []).reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
        const commissionRate = Number(data.commissionRate) || 0;
        const commissionAmount = itemsTotal * (commissionRate / 100);
        const newTotal = itemsTotal + commissionAmount + cost;

        await updateDoc(orderRef, { 
            transportCost: cost,
            totalAmount: newTotal
        });
        return { success: true, message: 'Transport cost updated.', newTotal };
    } catch (error: any) {
        console.error('Error updating transport cost:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}