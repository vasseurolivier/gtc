
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import type { Quote } from './quotes';

const orderStatusSchema = z.enum(["processing", "shipped", "delivered", "cancelled"]);

const orderSchema = z.object({
  orderNumber: z.string(),
  quoteId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  items: z.array(z.any()), // Keep items flexible for now
  totalAmount: z.coerce.number(),
  status: orderStatusSchema,
  shippingAddress: z.string().optional(),
  orderDate: z.date(),
});

export interface Order {
    id: string;
    orderNumber: string;
    quoteId: string;
    customerId: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    status: "processing" | "shipped" | "delivered" | "cancelled";
    shippingAddress?: string;
    orderDate: any;
    createdAt: any;
}

export async function addOrder(quote: Quote) {
    try {
        const newOrderData = {
          orderNumber: `O-${quote.quoteNumber}`,
          quoteId: quote.id,
          customerId: quote.customerId,
          customerName: quote.customerName,
          items: quote.items,
          totalAmount: quote.totalAmount,
          status: "processing",
          shippingAddress: quote.shippingAddress,
          orderDate: new Date(),
          createdAt: serverTimestamp(),
        };

        const validatedData = orderSchema.partial().parse(newOrderData);
        
        const docRef = await addDoc(collection(db, 'orders'), validatedData);
        return { success: true, message: 'Order created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding order:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
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
          orderNumber: data.orderNumber,
          quoteId: data.quoteId,
          customerId: data.customerId,
          customerName: data.customerName,
          items: data.items,
          totalAmount: data.totalAmount,
          status: data.status,
          shippingAddress: data.shippingAddress,
          orderDate: data.orderDate ? data.orderDate.toDate() : new Date(),
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        } as Order);
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
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

export async function updateOrderStatus(id: string, status: z.infer<typeof orderStatusSchema>) {
    try {
        const validatedStatus = orderStatusSchema.parse(status);
        const orderRef = doc(db, 'orders', id);
        await updateDoc(orderRef, { status: validatedStatus });
        return { success: true, message: 'Order status updated successfully!' };
    } catch (error: any) {
        console.error('Error updating order status:', error);
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid status value.' };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
