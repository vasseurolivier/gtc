
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, getDoc, where, deleteDoc } from 'firebase/firestore';

export interface RegisteredClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    clientNumber?: string;
    orderPrefix?: string; // Prefix for custom order numbers
    currencyPreference?: 'EUR' | 'CNY' | 'BOTH'; // Display preference
    status?: 'pending' | 'validated';
    createdAt: string;
    phone?: string;
    companyName?: string;
    address?: string;
}

/**
 * Fetch all registered clients from the /clients collection.
 */
export async function getRegisteredClients(): Promise<RegisteredClient[]> {
    try {
        const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as RegisteredClient));
    } catch (e) {
        console.error("Error fetching registered clients:", e);
        return [];
    }
}

/**
 * Fetch a single registered client by ID.
 */
export async function getRegisteredClientById(id: string): Promise<RegisteredClient | null> {
    try {
        const clientRef = doc(db, 'clients', id);
        const snap = await getDoc(clientRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as RegisteredClient;
    } catch (e) {
        console.error("Error fetching client by id:", e);
        return null;
    }
}

/**
 * Update the client number for a registered client.
 */
export async function updateRegisteredClientNumber(id: string, clientNumber: string) {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { clientNumber });
        return { success: true, message: 'Numéro client mis à jour avec succès.' };
    } catch (e: any) {
        console.error("Error updating client number:", e);
        return { success: false, message: e.message || 'Une erreur est survenue.' };
    }
}

/**
 * Update the order prefix for a registered client.
 */
export async function updateRegisteredClientPrefix(id: string, orderPrefix: string) {
    try {
        const clientRef = doc(db, 'clients', id);
        // Ensure only 2 chars uppercase
        const cleanPrefix = orderPrefix.substring(0, 2).toUpperCase();
        await updateDoc(clientRef, { orderPrefix: cleanPrefix });
        return { success: true, message: 'Préfixe de commande mis à jour.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la mise à jour du préfixe.' };
    }
}

/**
 * Update the currency preference for a registered client.
 */
export async function updateRegisteredClientCurrencyPreference(id: string, preference: 'EUR' | 'CNY' | 'BOTH') {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { currencyPreference: preference });
        return { success: true, message: 'Préférence de devise mise à jour.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la mise à jour de la devise.' };
    }
}

/**
 * Update the validation status for a registered client.
 */
export async function updateRegisteredClientStatus(id: string, status: 'pending' | 'validated') {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, { status });
        const msg = status === 'validated' ? 'Compte validé avec succès.' : 'Compte suspendu.';
        return { success: true, message: msg };
    } catch (e: any) {
        console.error("Error updating client status:", e);
        return { success: false, message: e.message || 'Une erreur est survenue.' };
    }
}

/**
 * Delete a registered client account record.
 */
export async function deleteRegisteredClient(id: string) {
    try {
        await deleteDoc(doc(db, 'clients', id));
        return { success: true, message: 'Compte client supprimé définitivement.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la suppression du compte.' };
    }
}

/**
 * Update client profile from the client space.
 */
export async function updateClientProfile(id: string, data: Partial<RegisteredClient>) {
    try {
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, {
            phone: data.phone,
            companyName: data.companyName,
            address: data.address,
        });
        return { success: true, message: 'Profil mis à jour avec succès.' };
    } catch (e: any) {
        console.error("Error updating client profile:", e);
        return { success: false, message: 'Erreur lors de la mise à jour.' };
    }
}

/**
 * Delete a product list for a client.
 */
export async function deleteProductList(clientId: string, listId: string) {
    try {
        const listRef = doc(db, 'clients', clientId, 'productLists', listId);
        // In a real app we should also delete products inside, but for prototype we delete the doc.
        await deleteDoc(listRef);
        return { success: true, message: 'Liste supprimée avec succès.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la suppression de la liste.' };
    }
}

/**
 * Delete a specific product from a client's list.
 */
export async function deleteClientProduct(clientId: string, listId: string, productId: string) {
    try {
        const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', productId);
        await deleteDoc(productRef);
        return { success: true, message: 'Produit supprimé.' };
    } catch (e: any) {
        return { success: false, message: 'Erreur lors de la suppression du produit.' };
    }
}
