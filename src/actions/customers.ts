
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, getDoc, where, setDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { Order } from './orders';
import type { Invoice } from './invoices';
import { initialCustomers } from '@/lib/initial-data';

const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }).or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(["lead", "active", "inactive", "prospect"]).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export interface CustomerFinancials {
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    netProfit: number;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    company?: string;
    country?: string;
    status?: "lead" | "active" | "inactive" | "prospect";
    source?: string;
    notes?: string;
    createdAt: string;
    orders?: Order[];
    invoices?: Invoice[];
    totalRevenue?: number; // Kept for backward compatibility on customer list page
    financials?: CustomerFinancials;
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

export async function updateCustomer(id: string, values: CustomerFormValues) {
    try {
        const validatedData = customerSchema.parse(values);
        const customerRef = doc(db, 'customers', id);
        await updateDoc(customerRef, validatedData);
        return { success: true, message: 'Customer updated successfully!' };
    } catch (error: any) {
        console.error('Error updating customer:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}


async function seedInitialCustomers() {
    const customerPromises = initialCustomers.map(async (customer) => {
        const { id, ...customerData } = customer;
        const customerRef = doc(db, 'customers', id);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
            await setDoc(customerRef, {
                ...customerData,
                createdAt: serverTimestamp(),
            });
        }
    });
    await Promise.all(customerPromises);
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const customersQuery = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    let querySnapshot = await getDocs(customersQuery);
    
    const customersCount = querySnapshot.docs.length;
    const initialCustomerIds = new Set(initialCustomers.map(c => c.id));
    
    let needsSeeding = false;
    if (customersCount < initialCustomers.length) {
        const existingIds = new Set(querySnapshot.docs.map(d => d.id));
        for (const id of initialCustomerIds) {
            if (!existingIds.has(id)) {
                needsSeeding = true;
                break;
            }
        }
    }

    if (needsSeeding) {
        await seedInitialCustomers();
        querySnapshot = await getDocs(customersQuery);
    }
    
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
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

        // Fetch all orders and invoices for this customer
        const ordersQuery = query(collection(db, "orders"), where("customerId", "==", id));
        const invoicesQuery = query(collection(db, "invoices"), where("customerId", "==", id));
        
        const [ordersSnapshot, invoicesSnapshot] = await Promise.all([
            getDocs(ordersQuery),
            getDocs(invoicesQuery)
        ]);

        const orders: Order[] = ordersSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            orderDate: doc.data().orderDate?.toDate().toISOString() || new Date().toISOString(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Order)).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        const invoices: Invoice[] = invoicesSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            issueDate: doc.data().issueDate?.toDate().toISOString() || new Date().toISOString(),
            dueDate: doc.data().dueDate?.toDate().toISOString() || new Date().toISOString(),
            paymentDate: doc.data().paymentDate?.toDate().toISOString() || undefined,
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Invoice)).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
        
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const ordersById = new Map(orders.map(o => [o.id, o]));

        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

        const cogs = paidInvoices.reduce((totalCost, inv) => {
            const order = inv.orderId ? ordersById.get(inv.orderId) : undefined;
            if (!order) return totalCost;
            const orderCost = order.items.reduce((itemSum, item) => itemSum + ((item.purchasePrice || 0) * item.quantity), 0);
            return totalCost + orderCost;
        }, 0);

        const operatingExpenses = paidInvoices.reduce((totalExpense, inv) => {
            const order = inv.orderId ? ordersById.get(inv.orderId) : undefined;
            if (!order) return totalExpense;
            const subTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const commission = subTotal * ((order.commissionRate || 0) / 100);
            const transport = order.transportCost || 0;
            return totalExpense + transport + commission;
        }, 0);

        const grossProfit = totalRevenue - cogs;
        const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netProfit = grossProfit - operatingExpenses;

        const financials: CustomerFinancials = {
            totalRevenue,
            cogs,
            grossProfit,
            grossProfitMargin,
            operatingExpenses,
            netProfit,
        };

        const customer: Customer = {
            id: customerSnap.id,
            ...customerData,
            createdAt: customerData.createdAt?.toDate().toISOString() || new Date().toISOString(),
            orders,
            invoices,
            totalRevenue: totalRevenue, // For simple display on list page if needed
            financials,
        } as unknown as Customer;

        return customer;

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
