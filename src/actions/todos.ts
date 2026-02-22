'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "completed"]).default("pending"),
  type: z.enum(["manual", "auto_order"]).default("manual"),
  orderId: z.string().optional(),
});

export type TodoFormValues = z.infer<typeof todoSchema>;

export interface Todo {
    id: string;
    title: string;
    description?: string;
    clientId?: string;
    clientName?: string;
    dueDate?: string;
    status: "pending" | "completed";
    type: "manual" | "auto_order";
    orderId?: string;
    createdAt: string;
}

export async function addTodo(values: TodoFormValues) {
    try {
        const validatedData = todoSchema.parse(values);
        const docRef = await addDoc(collection(db, 'todos'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Tâche ajoutée !', id: docRef.id };
    } catch (error: any) {
        return { success: false, message: 'Erreur lors de l\'ajout.' };
    }
}

export async function getTodos(): Promise<Todo[]> {
  try {
    const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Todo;
    });
  } catch (error) {
    return [];
  }
}

export async function updateTodoStatus(id: string, status: "pending" | "completed") {
    try {
        await updateDoc(doc(db, 'todos', id), { status, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error: any) {
        return { success: false };
    }
}

export async function deleteTodo(id: string) {
    try {
        await deleteDoc(doc(db, 'todos', id));
        return { success: true };
    } catch (error: any) {
        return { success: false };
    }
}
