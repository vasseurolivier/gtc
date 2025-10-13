
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, serverTimestamp, query, orderBy, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

const factoryPiItemSchema = z.object({
  photo: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPriceCny: z.coerce.number().nonnegative('Price must be non-negative.'),
});

const factoryPiSchema = z.object({
  piNumber: z.string().min(1, 'PI Number is required.'),
  date: z.date(),
  items: z.array(factoryPiItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
});

export type FactoryPiItem = z.infer<typeof factoryPiItemSchema>;

export interface FactoryPi {
    id: string;
    piNumber: string;
    date: string;
    items: FactoryPiItem[];
    notes?: string;
    createdAt: string;
}

export async function addFactoryPi(values: z.infer<typeof factoryPiSchema>) {
    try {
        const validatedData = factoryPiSchema.parse(values);
        const docRef = await addDoc(collection(db, 'factoryPis'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Factory PI saved successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding factory PI:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateFactoryPi(id: string, values: z.infer<typeof factoryPiSchema>) {
    try {
        const validatedData = factoryPiSchema.parse(values);
        const piRef = doc(db, 'factoryPis', id);
        await updateDoc(piRef, validatedData);
        return { success: true, message: 'Factory PI updated successfully!' };
    } catch (error: any) {
        console.error('Error updating factory PI:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getFactoryPis(): Promise<FactoryPi[]> {
  try {
    const q = query(collection(db, "factoryPis"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const pis: FactoryPi[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        pis.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as FactoryPi);
    });

    return pis;
  } catch (error) {
    console.error("Error fetching factory PIs:", error);
    return [];
  }
}

export async function getFactoryPiById(id: string): Promise<FactoryPi | null> {
    try {
        const piRef = doc(db, 'factoryPis', id);
        const piSnap = await getDoc(piRef);

        if (!piSnap.exists()) {
            return null;
        }

        const data = piSnap.data();

        return {
            id: piSnap.id,
            ...data,
            date: data.date?.toDate().toISOString() || new Date().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as FactoryPi;

    } catch (error) {
        console.error("Error fetching factory PI details:", error);
        return null;
    }
}

export async function deleteFactoryPi(id: string) {
    try {
        await deleteDoc(doc(db, 'factoryPis', id));
        return { success: true, message: 'Factory PI deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting factory PI:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

    