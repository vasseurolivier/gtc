'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
    isAdmin: boolean;
}

/**
 * Sends a message from either a client or an admin.
 */
export async function sendChatMessage(clientId: string, data: { senderId: string, senderName: string, text: string, isAdmin: boolean }) {
    try {
        const messagesRef = collection(db, 'clients', clientId, 'messages');
        await addDoc(messagesRef, {
            ...data,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error sending message:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Fetches all messages for a specific client conversation thread.
 */
export async function getChatMessages(clientId: string): Promise<ChatMessage[]> {
    try {
        const messagesRef = collection(db, 'clients', clientId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as ChatMessage;
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}
