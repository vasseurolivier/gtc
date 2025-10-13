
import 'dotenv/config';
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
    const serviceAccount = {
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    } as admin.ServiceAccount;

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "studio-4928604682-ea1ec.appspot.com"
    });
}

export const getAdminApp = () => {
    if (!admin.apps.length) {
        throw new Error("Firebase Admin SDK not initialized");
    }
    return admin.apps[0]!;
};
