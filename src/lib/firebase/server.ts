// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Your web app's Firebase configuration
// This is not used by the server, but useful for reference.
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
  : '{}';

let app;
try {
    const serviceAccount = JSON.parse(serviceAccountString);
    // Initialize Firebase Admin SDK
    app = getApps().length 
      ? getApp() 
      : initializeApp({
          credential: cert(serviceAccount)
      });
} catch(e) {
    console.error("Firebase Admin SDK initialization failed", e);
    // Fallback to a non-admin app instance if admin fails, though this will have limited permissions
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}


const db = getFirestore(app);

export { app, db };
