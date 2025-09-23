
'use server';

import { db } from '@/lib/firebase/server';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sku: z.string().min(1, { message: "SKU is required." }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price cannot be negative."),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative."),
  category: z.string().optional(),
});

export interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    price: number;
    stock: number;
    category?: string;
    createdAt: any;
}

export async function addProduct(values: z.infer<typeof productSchema>) {
    try {
        const validatedData = productSchema.parse(values);
        const docRef = await addDoc(collection(db, 'products'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Product added successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding product:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateProduct(id: string, values: z.infer<typeof productSchema>) {
    try {
        const validatedData = productSchema.parse(values);
        const productRef = doc(db, 'products', id);
        await updateDoc(productRef, validatedData);
        return { success: true, message: 'Product updated successfully!' };
    } catch (error: any) {
        console.error('Error updating product:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || '',
          sku: data.sku || '',
          description: data.description || '',
          price: data.price || 0,
          stock: data.stock || 0,
          category: data.category || '',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        } as Product);
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function deleteProduct(id: string) {
    try {
        await deleteDoc(doc(db, 'products', id));
        return { success: true, message: 'Product deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
