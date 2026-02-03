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

/**
 * Uploads an image to Firebase Storage via Server Action.
 * This bypasses client-side CORS and Security Rules issues.
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log(`[Upload] Received upload request for folder: ${folder}`);

    if (!file) {
        console.error("[Upload] No file provided in FormData");
        return { success: false, message: 'No file provided.' };
    }
    
    console.log(`[Upload] File details: name=${file.name}, type=${file.type}, size=${file.size}`);

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
        // Use the provided folder or fallback to a default
        const storagePath = `${folder}/${Date.now()}-${validatedData.fileName}`;
        const storageRef = ref(storage, storagePath);
        
        console.log(`[Upload] Attempting to upload to: ${storagePath}`);
        
        const snapshot = await uploadBytes(storageRef, validatedData.fileBuffer, { contentType: validatedData.fileType });
        console.log("[Upload] UploadBytes successful");
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`[Upload] Successfully uploaded. URL: ${downloadURL}`);

        return { success: true, message: 'Image uploaded successfully!', url: downloadURL };
    } catch (error: any) {
        console.error('[Upload] Failed:', error);
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Validation failed.' };
        }
        return { success: false, message: error.message || 'An unexpected error occurred during upload.' };
    }
}