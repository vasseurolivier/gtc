'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export async function uploadFile(fileDataUrl: string, fileName: string): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const storageRef = ref(storage, `company-assets/${Date.now()}-${fileName}`);
    
    // The data URL needs to be split to get the Base64 part
    const base64Data = fileDataUrl.split(',')[1];

    const snapshot = await uploadString(storageRef, base64Data, 'base64', {
        contentType: fileDataUrl.substring(fileDataUrl.indexOf(':') + 1, fileDataUrl.indexOf(';')),
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error('File upload failed:', error);
     // Check for potential CORS issues which are common with direct browser uploads
    if (error.code === 'storage/unauthorized') {
        return { success: false, message: 'File upload failed. This might be a CORS configuration issue on your Firebase Storage bucket. Please check your Firebase console.' };
    }
    return { success: false, message: error.message || 'An unexpected error occurred during upload.' };
  }
}
