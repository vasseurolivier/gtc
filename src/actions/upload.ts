'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export async function uploadImage(fileDataUrl: string, fileName: string): Promise<string> {
    try {
        const storageRef = ref(storage, `products/${fileName}-${Date.now()}`);
        
        // Upload the file via data URL
        const snapshot = await uploadString(storageRef, fileDataUrl, 'data_url');
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image: ', error);
        throw new Error('Failed to upload image.');
    }
}
