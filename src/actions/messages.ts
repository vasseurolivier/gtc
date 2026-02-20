'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
    isAdmin: boolean;
    read: boolean;
}

/**
 * Sends a message from either a client or an admin.
 */
export async function sendChatMessage(clientId: string, data: { senderId: string, senderName: string, text: string, isAdmin: boolean }) {
    try {
        const messagesRef = collection(db, 'clients', clientId, 'messages');
        await addDoc(messagesRef, {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error sending message:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Deletes a specific message.
 */
export async function deleteChatMessage(clientId: string, messageId: string) {
    try {
        const messageRef = doc(db, 'clients', clientId, 'messages', messageId);
        await deleteDoc(messageRef);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting message:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Marks all messages in a thread as read by the specified role.
 */
export async function markMessagesAsRead(clientId: string, isAdmin: boolean) {
    try {
        const messagesRef = collection(db, 'clients', clientId, 'messages');
        // If we are admin, we mark messages sent by clients (isAdmin: false) as read
        // If we are client, we mark messages sent by admin (isAdmin: true) as read
        const q = query(messagesRef, where('isAdmin', '==', !isAdmin), where('read', '==', false));
        const snap = await getDocs(q);
        
        if (snap.empty) return { success: true };

        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            batch.update(d.ref, { read: true });
        });
        await batch.commit();
        
        return { success: true };
    } catch (error: any) {
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
