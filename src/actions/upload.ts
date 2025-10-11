'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFile(
  formData: FormData
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, message: 'No file provided.' };
    }

    const fileBuffer = await file.arrayBuffer();
    const storageRef = ref(storage, `company-assets/${Date.now()}-${file.name}`);
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type,
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error('File upload failed:', error);
    if (error.code === 'storage/unauthorized') {
        return { success: false, message: 'File upload failed. This is likely a CORS configuration issue on your Firebase Storage bucket. Please check your Firebase console settings to allow uploads from this domain.' };
    }
    return { success: false, message: error.message || 'An unexpected error occurred during upload.' };
  }
}
