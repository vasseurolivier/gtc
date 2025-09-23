'use server';

import { db } from '@/lib/firebase/server';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';

const quoteItemSchema = z.object({
  description: z.string().min(1, "Description cannot be empty."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative."),
  total: z.coerce.number().nonnegative("Total cannot be negative."),
});

const quoteSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required."),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  issueDate: z.date(),
  validUntil: z.date(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required."),
  subTotal: z.coerce.number(),
  transportCost: z.coerce.number().nonnegative("Transport cost cannot be negative.").optional().default(0),
  commissionRate: z.coerce.number().min(0, "Commission can't be negative.").max(100, "Commission can't be over 100%.").optional().default(0),
  totalAmount: z.coerce.number().positive({ message: "Total amount must be a positive number." }),
  status: z.enum(["draft", "sent", "accepted", "rejected"]),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
});

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    items: QuoteItem[];
    subTotal: number;
    transportCost?: number;
    commissionRate?: number;
    totalAmount: number;
    status: "draft" | "sent" | "accepted" | "rejected";
    shippingAddress?: string;
    notes?: string;
    issueDate: any;
    validUntil: any;
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
          quoteNumber: data.quoteNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          items: data.items,
          subTotal: data.subTotal,
          transportCost: data.transportCost,
          commissionRate: data.commissionRate,
          totalAmount: data.totalAmount,
          status: data.status,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          issueDate: data.issueDate ? data.issueDate.toDate() : new Date(),
          validUntil: data.validUntil ? data.validUntil.toDate() : new Date(),
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
