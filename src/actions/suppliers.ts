
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy, getDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2, { message: "Supplier name must be at least 2 characters." }),
  contactName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email." }).or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).or(z.literal("")).optional(),
  mainProducts: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    mainProducts?: string;
    notes?: string;
    createdAt: string;
}

export async function addSupplier(values: SupplierFormValues) {
    try {
        const validatedData = supplierSchema.parse(values);
        const docRef = await addDoc(collection(db, 'suppliers'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Supplier added successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding supplier:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateSupplier(id: string, values: SupplierFormValues) {
    try {
        const validatedData = supplierSchema.parse(values);
        const supplierRef = doc(db, 'suppliers', id);
        await updateDoc(supplierRef, validatedData);
        return { success: true, message: 'Supplier updated successfully!' };
    } catch (error: any) {
        console.error('Error updating supplier:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const suppliersQuery = query(collection(db, "suppliers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(suppliersQuery);
    
    const suppliers: Supplier[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        suppliers.push({
          id: doc.id,
          name: data.name || '',
          contactName: data.contactName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          website: data.website || '',
          mainProducts: data.mainProducts || '',
          notes: data.notes || '',
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Supplier);
    });

    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
    try {
        const supplierRef = doc(db, 'suppliers', id);
        const supplierSnap = await getDoc(supplierRef);

        if (!supplierSnap.exists()) {
            return null;
        }

        const data = supplierSnap.data();

        const supplier = {
            id: supplierSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Supplier;

        return supplier;

    } catch (error) {
        console.error("Error fetching supplier details:", error);
        return null;
    }
}

export async function deleteSupplier(id: string) {
    try {
        await deleteDoc(doc(db, 'suppliers', id));
        return { success: true, message: 'Supplier deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting supplier:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
