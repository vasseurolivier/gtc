
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export async function submitContactForm(values: z.infer<typeof formSchema>) {
  try {
    const validatedData = formSchema.parse(values);
    await addDoc(collection(db, 'contactSubmissions'), {
      ...validatedData,
      createdAt: serverTimestamp(),
      read: false,
    });
    return { success: true, message: 'Message sent successfully!' };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Validation failed.', errors: error.errors };
    }
    // Firebase permission errors often have a 'code' property.
    if (error.code === 'permission-denied') {
        return { success: false, message: 'Firestore permission-denied. Check your security rules.' };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
