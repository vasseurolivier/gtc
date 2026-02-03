'use server';

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '@/lib/firebase';
import { z } from 'zod';

const fileSchema = z.object({
  fileName: z.string(),
  fileType: z.string().refine(
    (type) => type.startsWith('image/') || type === 'application/pdf' || type.startsWith('video/'),
    { message: "Le fichier doit être une image, un PDF ou une vidéo." }
  ),
});

interface UploadResult {
    success: boolean;
    message: string;
    url?: string;
}

/**
 * Télécharge un fichier vers Firebase Storage via une Server Action.
 * Utilise l'instance storage centralisée pour plus de fiabilité.
 */
export async function uploadFile(formData: FormData): Promise<UploadResult> {
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log(`[Upload] Début de la procédure pour le dossier: ${folder}`);

    if (!file) {
        console.error('[Upload] Erreur: Aucun fichier trouvé dans FormData');
        return { success: false, message: 'Aucun fichier fourni.' };
    }

    // Augmentation de la limite à 20MB pour les vidéos si nécessaire
    if (file.size > 20 * 1024 * 1024) { 
        console.error(`[Upload] Erreur: Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        return { success: false, message: 'Le fichier est trop volumineux (max 20MB).'};
    }

    try {
        // Validation des métadonnées
        const validatedData = fileSchema.parse({
            fileName: file.name,
            fileType: file.type,
        });

        console.log(`[Upload] Fichier validé: ${validatedData.fileName} (${file.type})`);

        // Conversion en Uint8Array pour le transport stable vers Storage
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);

        const storagePath = `${folder}/${Date.now()}-${validatedData.fileName}`;
        const storageRef = ref(storage, storagePath);
        
        console.log(`[Upload] Tentative d'envoi vers: ${storagePath}...`);

        const snapshot = await uploadBytes(storageRef, fileData, { 
            contentType: validatedData.fileType 
        });
        
        console.log('[Upload] Upload réussi ! Récupération de l\'URL publique...');
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log(`[Upload] Succès total. URL: ${downloadURL}`);
        return { success: true, message: 'Téléchargement réussi !', url: downloadURL };

    } catch (error: any) {
        console.error('[Upload] Echec critique lors de l\'envoi:', error);
        
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Type de fichier non autorisé ou données invalides.' };
        }
        
        // Erreurs spécifiques Firebase Storage
        if (error.code === 'storage/unauthorized') {
            return { 
                success: false, 
                message: 'ERREUR PERMISSIONS : Veuillez copier les règles de sécurité fournies par l\'assistant dans l\'onglet Storage > Rules de votre console Firebase.' 
            };
        }

        if (error.code === 'storage/retry-limit-exceeded') {
            return { success: false, message: 'Le délai d\'attente a expiré. Votre connexion est peut-être instable.' };
        }

        return { success: false, message: `Erreur Storage (${error.code || 'Inconnue'}): ${error.message || 'Consultez la console serveur'}` };
    }
}

/**
 * Alias pour la compatibilité avec les anciens composants
 */
export async function uploadImage(formData: FormData) {
    return uploadFile(formData);
}
