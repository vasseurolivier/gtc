
'use server';

import { getAdminApp } from "@/lib/firebase-admin";

export async function uploadFileFromBase64(base64String: string, fileName: string, contentType: string) {
    try {
        const adminApp = getAdminApp();
        const bucket = adminApp.storage().bucket();

        const buffer = Buffer.from(base64String.split(',')[1], 'base64');
        
        const file = bucket.file(`uploads/${Date.now()}-${fileName}`);

        await file.save(buffer, {
            metadata: {
                contentType: contentType,
            },
            public: true, // Directly make the file public upon upload
        });
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        return { success: true, url: publicUrl };

    } catch (error: any) {
        console.error("Upload failed:", error);
        
        let errorMessage = 'An unexpected error occurred during upload.';
        if (error.code) {
            switch (error.code) {
                case 'storage/unauthorized':
                    errorMessage = 'Permission denied. Check server authentication with Firebase.';
                    break;
                case 'storage/object-not-found':
                     errorMessage = 'Storage bucket not found. Check your Firebase project configuration.';
                     break;
                default:
                    errorMessage = error.message;
                    break;
            }
        }
        
        return { success: false, message: errorMessage };
    }
}
