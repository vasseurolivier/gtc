
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { Quote } from './quotes';

const orderStatusSchema = z.enum(["processing", "shipped", "delivered", "cancelled"]);

const orderItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description cannot be empty."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative."),
  purchasePrice: z.coerce.number().nonnegative("Purchase price cannot be negative.").optional().default(0),
  total: z.coerce.number().nonnegative("Total cannot be negative."),
});

const orderSchema = z.object({
  orderNumber: z.string(),
  quoteId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  items: z.array(orderItemSchema),
  totalAmount: z.coerce.number(),
  status: orderStatusSchema,
  shippingAddress: z.string().optional(),
  orderDate: z.date(),
  transportCost: z.coerce.number().optional(),
  commissionRate: z.coerce.number().optional(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export interface Order {
    id: string;
    orderNumber: string;
    quoteId: string;
    customerId: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    status: "processing" | "shipped" | "delivered" | "cancelled";
    shippingAddress?: string;
    orderDate: string;
    createdAt: string;
    transportCost?: number;
    commissionRate?: number;
}

export async function addOrder(quote: Quote) {
    try {
        const newOrderData = {
          orderNumber: `O-${quote.quoteNumber.replace('PI-', '')}`,
          quoteId: quote.id,
          customerId: quote.customerId,
          customerName: quote.customerName,
          items: quote.items,
          totalAmount: quote.totalAmount,
          status: "processing" as const,
          shippingAddress: quote.shippingAddress || "",
          orderDate: new Date(),
          createdAt: serverTimestamp(),
          transportCost: quote.transportCost || 0,
          commissionRate: quote.commissionRate || 0,
        };

        const docRef = await addDoc(collection(db, 'orders'), newOrderData);
        return { success: true, message: 'Order created successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding order:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred while creating the order.' };
    }
}

export async function updateOrderFromQuote(quote: Quote) {
    try {
        const ordersQuery = query(collection(db, "orders"), where("quoteId", "==", quote.id));
        const ordersSnapshot = await getDocs(ordersQuery);

        if (ordersSnapshot.empty) {
            // This can happen if a draft quote is updated before being accepted. Not an error.
            return { success: true, message: "No matching order found to update." };
        }

        const orderDoc = ordersSnapshot.docs[0];
        const orderRef = doc(db, 'orders', orderDoc.id);

        const updatedOrderData = {
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items,
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
          orderDate: data.orderDate?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Order);
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Return an empty array in case of error to prevent crashing the UI
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
            orderDate: data.orderDate?.toDate().toISOString() || new Date().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
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
