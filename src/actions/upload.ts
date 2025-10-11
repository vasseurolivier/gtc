'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const storageRef = ref(storage, `company-assets/${Date.now()}-${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: contentType,
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
