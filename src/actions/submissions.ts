'use server';

import { db } from '@/lib/firebase/server';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';

export interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export async function getSubmissions(): Promise<Submission[]> {
  try {
    const q = query(collection(db, "contactSubmissions"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const submissions: Submission[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          subject: data.subject || '',
          message: data.message || '',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          read: data.read || false,
        } as Submission);
    });

    return submissions;
  } catch (error) {
    console.error("Error fetching submissions on server:", error);
    return [];
  }
}

export async function updateSubmissionReadStatus(id: string, read: boolean) {
  try {
    const submissionRef = doc(db, 'contactSubmissions', id);
    await updateDoc(submissionRef, { read });
    return { success: true };
  } catch (error) {
    console.error(`Error updating submission ${id}:`, error);
    return { success: false, message: 'Failed to update submission status.' };
  }
}
