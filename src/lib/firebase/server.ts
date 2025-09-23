// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Your web app's Firebase configuration
// This is used as a fallback if the service account key is not available.
const firebaseConfig = {
  "projectId": "studio-4928604682-ea1ec",
  "appId": "1:913801169761:web:0a43c3c13f0549b99c9320",
  "apiKey": "AIzaSyDbIhhHeFmrFsHAL6U-ht1AgTQjvGG3otw",
  "authDomain": "studio-4928604682-ea1ec.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "913801169761"
};

// IMPORTANT: The service account key is base64 encoded in an environment variable.
// This is a more secure way to handle credentials in a server environment.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
  ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8')
  : '';

let app;
let db: ReturnType<typeof getFirestore>;

if (!getApps().length) {
    if (serviceAccountString) {
        try {
            const serviceAccount = JSON.parse(serviceAccountString);
            app = initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Error parsing Firebase service account key:", e);
            // Fallback for safety, though functionality will be limited.
            app = initializeApp(firebaseConfig); 
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not set. Server-side Firebase operations will not be authenticated. Please set this environment variable.");
        // Initialize with no credentials. This will have very limited permissions.
        app = initializeApp(firebaseConfig); 
    }
} else {
    app = getApp();
}

try {
    db = getFirestore(app);
} catch (e) {
    console.error("Failed to initialize Firestore:", e);
    // Create a dummy db object to avoid further crashes if Firestore fails
    db = {} as ReturnType<typeof getFirestore>;
}


export { app, db };
