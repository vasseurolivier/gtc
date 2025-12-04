
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, doc, serverTimestamp, query, orderBy, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

const contractItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPrice: z.coerce.number().nonnegative('Price cannot be negative.'),
  total: z.coerce.number().nonnegative(),
  photo: z.string().optional(),
});

const contractSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required.'),
  date: z.date(),
  supplierName: z.string().min(1, 'Supplier name is required.'),
  supplierAddress: z.string().min(1, 'Supplier address is required.'),
  supplierContact: z.string().optional(),
  buyerName: z.string(),
  buyerAddress: z.string(),
  items: z.array(contractItemSchema).min(1, 'At least one item is required.'),
  totalAmount: z.coerce.number(),
  depositPercentage: z.coerce.number().min(0).max(100).default(30),
  balanceTerms: z.string().default('Payable before shipping after quality control'),
  qualityControl: z.string().default('AQL 2.5/4.0'),
  shippingTerms: z.string().default('FOB Ningbo'),
  leadTime: z.string().default('30-35 days after deposit'),
  specificClauses: z.string().optional(),
});

export type SupplierContractItem = z.infer<typeof contractItemSchema>;

export interface SupplierContract {
    id: string;
    contractNumber: string;
    date: string;
    supplierName: string;
    supplierAddress: string;
    supplierContact?: string;
    buyerName: string;
    buyerAddress: string;
    items: SupplierContractItem[];
    totalAmount: number;
    depositPercentage: number;
    balanceTerms: string;
    qualityControl: string;
    shippingTerms: string;
    leadTime: string;
    specificClauses?: string;
    createdAt: string;
}

export async function addSupplierContract(values: z.infer<typeof contractSchema>) {
    try {
        const validatedData = contractSchema.parse(values);
        const docRef = await addDoc(collection(db, 'supplierContracts'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Supplier Contract saved successfully!', id: docRef.id };
    } catch (error: any) {
        console.error('Error adding supplier contract:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function updateSupplierContract(id: string, values: z.infer<typeof contractSchema>) {
    try {
        const validatedData = contractSchema.parse(values);
        const contractRef = doc(db, 'supplierContracts', id);
        await updateDoc(contractRef, validatedData);
        return { success: true, message: 'Supplier Contract updated successfully!' };
    } catch (error: any) {
        console.error('Error updating supplier contract:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function getSupplierContracts(): Promise<SupplierContract[]> {
  try {
    const q = query(collection(db, "supplierContracts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const contracts: SupplierContract[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        contracts.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as SupplierContract);
    });

    return contracts;
  } catch (error) {
    console.error("Error fetching supplier contracts:", error);
    return [];
  }
}

export async function getSupplierContractById(id: string): Promise<SupplierContract | null> {
    try {
        const contractRef = doc(db, 'supplierContracts', id);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            return null;
        }

        const data = contractSnap.data();

        return {
            id: contractSnap.id,
            ...data,
            date: data.date?.toDate().toISOString() || new Date().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as SupplierContract;

    } catch (error) {
        console.error("Error fetching supplier contract details:", error);
        return null;
    }
}

export async function deleteSupplierContract(id: string) {
    try {
        await deleteDoc(doc(db, 'supplierContracts', id));
        return { success: true, message: 'Supplier Contract deleted successfully!' };
    } catch (error: any) {
        console.error('Error deleting supplier contract:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
