
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, getDoc, where } from 'firebase/firestore';

export interface RegisteredClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    clientNumber?: string;
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
