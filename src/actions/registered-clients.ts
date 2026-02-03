
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';

export interface RegisteredClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    clientNumber?: string;
    createdAt: string;
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
