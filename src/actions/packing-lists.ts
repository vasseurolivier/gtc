'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, serverTimestamp, query, orderBy, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

const packingListItemSchema = z.object({
  photo: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPriceCny: z.coerce.number().nonnegative('Price must be non-negative.'),
  remarks: z.string().optional(),
  weight: z.coerce.number().nonnegative("Weight cannot be negative.").optional().default(0),
  width: z.coerce.number().nonnegative("Width cannot be negative.").optional().default(0),
  height: z.coerce.number().nonnegative("Height cannot be negative.").optional().default(0),
  length: z.coerce.number().nonnegative("Length cannot be negative.").optional().default(0),
});

const packingListSchema = z.object({
  listId: z.string().min(1, 'Packing List ID is required.'),
  date: z.any(),
  items: z.array(packingListItemSchema).min(1, 'At least one item is required.'),
});

export type PackingListItem = z.infer<typeof packingListItemSchema>;

export interface PackingList {
    id: string;
    listId: string;
    date: string;
    items: PackingListItem[];
    createdAt: string;
    updatedAt?: string;
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

export async function addPackingList(values: z.infer<typeof packingListSchema>) {
    try {
        const docRef = await addDoc(collection(db, 'packingLists'), {
            ...values,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Packing List saved successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding packing list:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updatePackingList(id: string, values: z.infer<typeof packingListSchema>) {
    try {
        const listRef = doc(db, 'packingLists', id);
        await updateDoc(listRef, {
            ...values,
            updatedAt: serverTimestamp()
        });
        return { success: true, message: 'Packing List updated successfully!' };
    } catch (error: any) {
        console.error('Error updating packing list:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getPackingLists(): Promise<PackingList[]> {
  try {
    const q = query(collection(db, "packingLists"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const lists: PackingList[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        lists.push({
          id: doc.id,
          ...data,
          date: parseDate(data.date),
          createdAt: parseDate(data.createdAt),
          updatedAt: data.updatedAt ? parseDate(data.updatedAt) : undefined,
        } as PackingList);
    });

    return lists;
  } catch (error) {
    console.error("Error fetching packing lists:", error);
    return [];
  }
}

export async function getPackingListById(id: string): Promise<PackingList | null> {
    try {
        const listRef = doc(db, 'packingLists', id);
        const listSnap = await getDoc(listRef);

        if (!listSnap.exists()) {
            return null;
        }

        const data = listSnap.data();

        return {
            id: listSnap.id,
            ...data,
            date: parseDate(data.date),
            createdAt: parseDate(data.createdAt),
            updatedAt: data.updatedAt ? parseDate(data.updatedAt) : undefined,
        } as PackingList;

    } catch (error) {
        console.error("Error fetching packing list details:", error);
        return null;
    }
}

export async function deletePackingList(id: string) {
    try {
        await deleteDoc(doc(db, 'packingLists', id));
        return { success: true, message: 'Packing List deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting packing list:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
