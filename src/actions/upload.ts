
'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Readable } from 'stream';

export async function uploadFileClientSide(
  formData: FormData
): Promise<{ success: boolean; url?: string; message?: string }> {
  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, message: 'No file provided.' };
  }

  try {
    const storageRef = ref(storage, `company-assets/${Date.now()}-${file.name}`);
    
    // Convert the file to a buffer to be uploaded by the server action
    const buffer = Buffer.from(await file.arrayBuffer());

    const snapshot = await uploadBytes(storageRef, buffer, {
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

    