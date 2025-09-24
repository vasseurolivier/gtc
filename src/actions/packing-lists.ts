
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
});

const packingListSchema = z.object({
  listId: z.string().min(1, 'Packing List ID is required.'),
  date: z.date(),
  items: z.array(packingListItemSchema).min(1, 'At least one item is required.'),
});

export type PackingListItem = z.infer<typeof packingListItemSchema>;

export interface PackingList {
    id: string;
    listId: string;
    date: string;
    items: PackingListItem[];
    createdAt: string;
}

export async function addPackingList(values: z.infer<typeof packingListSchema>) {
    try {
        const validatedData = packingListSchema.parse(values);
        const docRef = await addDoc(collection(db, 'packingLists'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Packing List saved successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding packing list:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updatePackingList(id: string, values: z.infer<typeof packingListSchema>) {
    try {
        const validatedData = packingListSchema.parse(values);
        const listRef = doc(db, 'packingLists', id);
        await updateDoc(listRef, validatedData);
        return { success: true, message: 'Packing List updated successfully!' };
    } catch (error: any) {
        console.error('Error updating packing list:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
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
          date: data.date?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
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

        const listData = listSnap.data();

        return {
            id: listSnap.id,
            ...listData,
            date: listData.date?.toDate().toISOString() || new Date().toISOString(),
            createdAt: listData.createdAt?.toDate().toISOString() || new Date().toISOString(),
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
