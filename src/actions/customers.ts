
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, getDoc, where } from 'firebase/firestore';
import { z } from 'zod';
import type { Order } from './orders';

const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(["lead", "active", "inactive", "prospect"]).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    country?: string;
    status?: "lead" | "active" | "inactive" | "prospect";
    source?: string;
    notes?: string;
    createdAt: string; // Changed to string for serializability
    orders?: Order[];
    totalRevenue?: number;
}

export async function addCustomer(values: CustomerFormValues) {
    try {
        const validatedData = customerSchema.parse(values);
        const docRef = await addDoc(collection(db, 'customers'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Customer added successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding customer:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          country: data.country || '',
          status: data.status || 'lead',
          source: data.source || '',
          notes: data.notes || '',
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Customer);
    });

    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    try {
        const customerRef = doc(db, 'customers', id);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
            return null;
        }

        const customerData = customerSnap.data();

        const ordersQuery = query(collection(db, "orders"), where("customerId", "==", id), where("status", "!=", "cancelled"));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const orders: Order[] = [];
        let totalRevenue = 0;
        ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            const order = { 
                ...orderData, 
                id: doc.id, 
                orderDate: orderData.orderDate?.toDate().toISOString() || new Date().toISOString(),
                createdAt: orderData.createdAt?.toDate().toISOString() || new Date().toISOString()
            } as Order
            orders.push(order);
            totalRevenue += orderData.totalAmount || 0;
        });

        return {
            id: customerSnap.id,
            ...customerData,
            createdAt: customerData.createdAt?.toDate().toISOString() || new Date().toISOString(),
            orders,
            totalRevenue,
        } as Customer;

    } catch (error) {
        console.error("Error fetching customer details:", error);
        return null;
    }
}

export async function deleteCustomer(id: string) {
    try {
        await deleteDoc(doc(db, 'customers', id));
        return { success: true, message: 'Customer deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting customer:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
