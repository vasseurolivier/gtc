
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { initialProducts } from '@/lib/initial-products';

const productSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sku: z.string().min(1, { message: "SKU is required." }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price cannot be negative.").default(0),
  purchasePrice: z.coerce.number().nonnegative("Cost price cannot be negative.").optional().default(0),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative.").default(0),
  category: z.string().optional(),
  weight: z.coerce.number().nonnegative("Weight cannot be negative.").optional().default(0),
  width: z.coerce.number().nonnegative("Width cannot be negative.").optional().default(0),
  height: z.coerce.number().nonnegative("Height cannot be negative.").optional().default(0),
  length: z.coerce.number().nonnegative("Length cannot be negative.").optional().default(0),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  imageUrl: z.string().optional(),
});

export interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    price: number;
    purchasePrice?: number;
    stock: number;
    category?: string;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
    hsCode?: string;
    countryOfOrigin?: string;
    imageUrl?: string;
    createdAt: string;
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
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(productsQuery);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || '',
          sku: data.sku || '',
          description: data.description || '',
          price: data.price || 0,
          purchasePrice: data.purchasePrice || 0,
          stock: data.stock || 0,
          category: data.category || '',
          weight: data.weight || 0,
          width: data.width || 0,
          height: data.height || 0,
          length: data.length || 0,
          hsCode: data.hsCode || '',
          countryOfOrigin: data.countryOfOrigin || '',
          imageUrl: data.imageUrl || '',
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Product);
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            return null;
        }

        const data = productSnap.data();

        return {
            id: productSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Product;

    } catch (error) {
        console.error("Error fetching product details:", error);
        return null;
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
