'use server';

import { db } from '@/lib/firebase/server';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';

const quoteSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  items: z.string().min(10),
  totalAmount: z.number(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]),
});

export interface Quote {
    id: string;
    customerId: string;
    customerName: string;
    items: string;
    totalAmount: number;
    status: "draft" | "sent" | "accepted" | "rejected";
    createdAt: any;
}

export async function addQuote(values: z.infer<typeof quoteSchema>) {
    try {
        const validatedData = quoteSchema.parse(values);
        const docRef = await addDoc(collection(db, 'quotes'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Quote added successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding quote:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getQuotes(): Promise<Quote[]> {
  try {
    const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const quotes: Quote[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          customerId: data.customerId,
          customerName: data.customerName,
          items: data.items,
          totalAmount: data.totalAmount,
          status: data.status,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        } as Quote);
    });

    return quotes;
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

export async function deleteQuote(id: string) {
    try {
        await deleteDoc(doc(db, 'quotes', id));
        return { success: true, message: 'Quote deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting quote:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
