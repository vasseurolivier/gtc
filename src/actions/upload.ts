
'use server';

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app as firebaseApp } from '@/lib/firebase';
import { z } from 'zod';

const imageSchema = z.object({
  fileBuffer: z.any(),
  fileName: z.string(),
  fileType: z.string().startsWith('image/', { message: "File must be an image."}),
});

interface UploadResult {
    success: boolean;
    message: string;
    url?: string;
}

export async function uploadImage(formData: FormData): Promise<UploadResult> {
    const file = formData.get('file') as File | null;
    
    if (!file) {
        return { success: false, message: 'No file provided.' };
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { success: false, message: 'File is too large. Maximum size is 10MB.'};
    }

    try {
        const fileBuffer = await file.arrayBuffer();
        const validatedData = imageSchema.parse({
            fileBuffer,
            fileName: file.name,
            fileType: file.type,
        });

        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `products/${Date.now()}-${validatedData.fileName}`);
        
        const snapshot = await uploadBytes(storageRef, validatedData.fileBuffer, { contentType: validatedData.fileType });
        const downloadURL = await getDownloadURL(snapshot.ref);

        return { success: true, message: 'Image uploaded successfully!', url: downloadURL };
    } catch (error: any) {
        console.error('Upload failed:', error);
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.', errors: error.errors };
        }
        return { success: false, message: error.message || 'An unexpected error occurred during upload.' };
    }
}
