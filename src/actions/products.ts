
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, collectionGroup, where, writeBatch } from 'firebase/firestore';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  sku: z.string().min(1, { message: "Le SKU est requis." }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Le prix ne peut pas être négatif.").default(0),
  purchasePrice: z.coerce.number().nonnegative("Le prix d'achat ne peut pas être négatif.").optional().default(0),
  stock: z.coerce.number().int().nonnegative("Le stock ne peut pas être négatif.").default(0),
  category: z.string().optional(),
  weight: z.coerce.number().nonnegative("Le poids ne peut pas être négatif.").optional().default(0),
  width: z.coerce.number().nonnegative("La largeur ne peut pas être négative.").optional().default(0),
  height: z.coerce.number().nonnegative("La hauteur ne peut pas être négative.").optional().default(0),
  length: z.coerce.number().nonnegative("La longueur ne peut pas être négative.").optional().default(0),
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
        return { success: true, message: 'Produit ajouté au catalogue global !', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding product:', error);
        return { success: false, message: 'Une erreur est survenue lors de l\'ajout.' };
    }
}

/**
 * Updates a product and propagates technical changes to all client catalogues with the same SKU.
 */
export async function updateProduct(id: string, values: z.infer<typeof productSchema>) {
    try {
        const validatedData = productSchema.parse(values);
        const productRef = doc(db, 'products', id);
        
        // 1. Update Global Product
        await updateDoc(productRef, validatedData);

        // 2. PROPAGATION: Find all instances of this SKU in client subcollections
        // Note: For large scale, this should be a background cloud function.
        // For a prototype, we do it here.
        const skuQuery = query(collectionGroup(db, 'products'), where('sku', '==', validatedData.sku));
        const querySnapshot = await getDocs(skuQuery);
        
        if (!querySnapshot.empty) {
            const batch = writeBatch(db);
            querySnapshot.forEach((docSnap) => {
                // We update only technical info, preserving client-specific status or notes if any
                // Usually price is also synced if it's a "standard" product reference
                batch.update(docSnap.ref, {
                    name: validatedData.name,
                    description: validatedData.description || '',
                    price: validatedData.price,
                    imageUrl: validatedData.imageUrl || '',
                    images: validatedData.imageUrl ? [validatedData.imageUrl] : [], // Compatibility with client array images
                    weight: validatedData.weight || 0,
                    width: validatedData.width || 0,
                    height: validatedData.height || 0,
                    length: validatedData.length || 0,
                    updatedAt: serverTimestamp(),
                });
            });
            await batch.commit();
        }

        return { success: true, message: 'Produit et catalogues clients mis à jour !' };
    } catch (error: any) {
        console.error('Error updating product:', error);
        return { success: false, message: 'Une erreur est survenue lors de la mise à jour.' };
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
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
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
        if (!productSnap.exists()) return null;
        const data = productSnap.data();
        return {
            id: productSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        } as Product;
    } catch (error) {
        return null;
    }
}

export async function deleteProduct(id: string) {
    try {
        await deleteDoc(doc(db, 'products', id));
        return { success: true, message: 'Produit supprimé du catalogue global.' };
    } catch (error: any) {
        return { success: false, message: 'Erreur lors de la suppression.' };
    }
}
