'use server';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp, getApps, initializeApp } from 'firebase/app';

// This is a server-side action, but it orchestrates a client-side readable URL.
// We initialize a separate app instance here to be safe, but we'll use client-side SDK for the actual upload URL generation logic.
// The upload itself will happen client-side, but this action provides the signed URL.
// This is a common pattern to avoid exposing service accounts or private keys to the client.

// NOTE: The direct upload from server action was failing due to environment constraints.
// The new approach will be to do a direct client-side upload using the client-initialized firebase app.
// This server action is now a placeholder and is NOT USED. The logic is in the client component.

// The `uploadFile` function is now primarily a client-side utility.
// Keeping this file to maintain the pattern, but the implementation is on the client.

export async function uploadFileClientSide(
  file: File,
  storage: any /* FirebaseStorage */
): Promise<{ success: boolean; url?: string; message?: string }> {
   if (!file) {
      return { success: false, message: 'No file provided.' };
    }
  
  try {
    const storageRef = ref(storage, `company-assets/${Date.now()}-${file.name}`);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error('File upload failed:', error.code, error.message);
     if (error.code === 'storage/unauthorized' || error.code === 'storage/unknown') {
        return { success: false, message: 'File upload failed. This is likely a CORS configuration issue on your Firebase Storage bucket. Please check your Firebase console settings to allow uploads from this domain.' };
    }
    return { success: false, message: error.message || 'An unexpected error occurred during upload.' };
  }
}
