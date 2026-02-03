'use server';

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app as firebaseApp } from '@/lib/firebase';
import { z } from 'zod';

const fileSchema = z.object({
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
 * Télécharge un fichier (image ou PDF) vers Firebase Storage via une Server Action.
 */
export async function uploadFile(formData: FormData): Promise<UploadResult> {
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log(`[Upload] Début de la procédure pour le dossier: ${folder}`);

    if (!file) {
        console.error('[Upload] Erreur: Aucun fichier trouvé dans FormData');
        return { success: false, message: 'Aucun fichier fourni.' };
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.error(`[Upload] Erreur: Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        return { success: false, message: 'Le fichier est trop volumineux (max 10MB).'};
    }

    try {
        // Validation des métadonnées
        const validatedData = fileSchema.parse({
            fileName: file.name,
            fileType: file.type,
        });

        console.log(`[Upload] Fichier validé: ${validatedData.fileName} (${file.type})`);

        // Conversion en ArrayBuffer puis Uint8Array pour une compatibilité maximale
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);

        const storage = getStorage(firebaseApp);
        const storagePath = `${folder}/${Date.now()}-${validatedData.fileName}`;
        const storageRef = ref(storage, storagePath);
        
        console.log(`[Upload] Envoi vers Storage: ${storagePath}...`);

        const snapshot = await uploadBytes(storageRef, fileData, { 
            contentType: validatedData.fileType 
        });
        
        console.log('[Upload] Upload réussi, récupération de l\'URL...');
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log(`[Upload] URL générée: ${downloadURL}`);
        return { success: true, message: 'Téléchargement réussi !', url: downloadURL };

    } catch (error: any) {
        console.error('[Upload] Echec critique:', error);
        
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Type de fichier non autorisé ou données invalides.' };
        }
        
        // Erreurs spécifiques Firebase Storage
        if (error.code === 'storage/unauthorized') {
            return { success: false, message: 'Permissions Firebase Storage insuffisantes. Vérifiez vos règles de sécurité.' };
        }

        return { success: false, message: `Erreur serveur: ${error.message || 'Inconnue'}` };
    }
}

/**
 * Alias pour la compatibilité avec les anciens composants
 */
export async function uploadImage(formData: FormData) {
    return uploadFile(formData);
}
