'use server';

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app as firebaseApp } from '@/lib/firebase';
import { z } from 'zod';

const fileSchema = z.object({
  fileBuffer: z.any(),
  fileName: z.string(),
  fileType: z.string().refine(
    (type) => type.startsWith('image/') || type === 'application/pdf',
    { message: "Le fichier doit être une image ou un PDF." }
  ),
});

interface UploadResult {
    success: boolean;
    message: string;
    url?: string;
}

/**
 * Télécharge un fichier (image ou PDF) vers Firebase Storage.
 */
export async function uploadFile(formData: FormData): Promise<UploadResult> {
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    
    if (!file) {
        return { success: false, message: 'Aucun fichier fourni.' };
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { success: false, message: 'Le fichier est trop volumineux (max 10MB).'};
    }

    try {
        const fileBuffer = await file.arrayBuffer();
        const validatedData = fileSchema.parse({
            fileBuffer,
            fileName: file.name,
            fileType: file.type,
        });

        const storage = getStorage(firebaseApp);
        const storagePath = `${folder}/${Date.now()}-${validatedData.fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, validatedData.fileBuffer, { 
            contentType: validatedData.fileType 
        });
        
        const downloadURL = await getDownloadURL(snapshot.ref);

        return { success: true, message: 'Téléchargement réussi !', url: downloadURL };
    } catch (error: any) {
        console.error('[Upload] Failed:', error);
         if (error instanceof z.ZodError) {
            return { success: false, message: 'Type de fichier non autorisé.' };
        }
        return { success: false, message: 'Erreur inattendue lors de l\'envoi.' };
    }
}

/**
 * Alias pour la compatibilité avec les anciens composants
 */
export async function uploadImage(formData: FormData) {
    return uploadFile(formData);
}
