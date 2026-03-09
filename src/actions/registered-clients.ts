'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, getDoc, where, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface RegisteredClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    clientNumber?: string;
    orderPrefix?: string;
    currencyPreference?: 'EUR' | 'CNY' | 'BOTH';
    commissionBasis?: 'products_only' | 'total';
    exchangeRate?: number;
    status?: 'pending' | 'validated';
    createdAt: string;
    updatedAt?: string;
    phone?: string;
    companyName?: string;
    address?: string;
    shippingRatePerKg?: number;
    shippingFixedFee?: number;
}

/**
 * Normalizes Firestore dates/timestamps into ISO strings for safe transport between server and client.
 */
const parseDate = (val: any) => {
    if (!val) return new Date().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && 'seconds' in val) {
        return new Date(val.seconds * 1000).toISOString();
    }
    return new Date().toISOString();
};

export async function getRegisteredClients(): Promise<RegisteredClient[]> {
    try {
        const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                createdAt: parseDate(data.createdAt),
                updatedAt: data.updatedAt ? parseDate(data.updatedAt) : undefined,
            } as RegisteredClient;
        });
    } catch (e) {
        console.error("Error fetching registered clients:", e);
        return [];
    }
}

export async function getRegisteredClientById(id: string): Promise<RegisteredClient | null> {
    try {
        const clientRef = doc(db, 'clients', id);
        const snap = await getDoc(clientRef);
        if (!snap.exists()) return null;
        
        const data = snap.data();
        return { 
            ...data,
            id: snap.id, 
            createdAt: parseDate(data.createdAt),
            updatedAt: data.updatedAt ? parseDate(data.updatedAt) : undefined,
        } as RegisteredClient;
    } catch (e) {
        console.error("Error fetching client by id:", e);
        return null;
    }
}

export async function updateClientCredentials(id: string, email: string, password?: string) {
    try {
        const clientRef = doc(db, 'clients', id);
        const firestoreUpdate: any = { email };
        if (password) firestoreUpdate.password = password;
        await updateDoc(clientRef, firestoreUpdate);
        return { success: true, message: 'Firestore mis à jour.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateRegisteredClientNumber(id: string, clientNumber: string) {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { clientNumber });
        return { success: true, message: 'Numéro client mis à jour.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateClientExchangeRate(id: string, rate: number) {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { exchangeRate: Number(rate) });
        return { success: true, message: 'Taux de change client mis à jour.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateClientShippingRates(id: string, rate: number, fee: number) {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { 
            shippingRatePerKg: Number(rate), 
            shippingFixedFee: Number(fee) 
        });
        return { success: true, message: 'Tarifs de transport mis à jour.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la mise à jour.' };
    }
}

export async function updateClientCommissionBasis(id: string, basis: 'products_only' | 'total') {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { commissionBasis: basis });
        return { success: true, message: 'Base de commission mise à jour.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la mise à jour.' };
    }
}

export async function updateRegisteredClientCurrencyPreference(id: string, preference: 'EUR' | 'CNY' | 'BOTH') {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { currencyPreference: preference });
        return { success: true, message: 'Préférence de devise mise à jour.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur.' };
    }
}

export async function updateRegisteredClientStatus(id: string, status: 'pending' | 'validated') {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { status });
        return { success: true, message: status === 'validated' ? 'Compte validé.' : 'Compte suspendu.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteRegisteredClient(id: string) {
    try {
        await deleteDoc(doc(db, 'clients', id));
        return { success: true, message: 'Profil supprimé.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateClientProfile(id: string, data: Partial<RegisteredClient>) {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, {
            phone: data.phone,
            companyName: data.companyName,
            address: data.address,
        });
        return { success: true, message: 'Profil mis à jour.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur.' };
    }
}

export async function addClientProduct(clientId: string, listId: string, data: any) {
    try {
        const productRef = doc(collection(db, 'clients', clientId, 'productLists', listId, 'products'));
        await setDoc(productRef, {
            ...data,
            id: productRef.id,
            clientId,
            productListId: listId,
            createdAt: serverTimestamp(),
            status: data.status || 'pending'
        });
        return { success: true, message: 'Produit ajouté au catalogue client.', id: productRef.id };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateClientProduct(clientId: string, listId: string, productId: string, data: any) {
    try {
        const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', productId);
        await updateDoc(productRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true, message: 'Produit mis à jour.' };
    } catch (e: any) {
        console.error("Update client product error:", e);
        return { success: false, message: 'Erreur lors de la mise à jour.' };
    }
}

export async function deleteClientProduct(clientId: string, listId: string, productId: string) {
    try {
        const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', productId);
        await deleteDoc(productRef);
        return { success: true, message: 'Produit supprimé.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur.' };
    }
}
