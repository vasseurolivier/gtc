// This file is intended for server-side Firebase initialization.
// For client-side, please use firebase-client.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-4928604682-ea1ec",
  "appId": "1:913801169761:web:0a43c3c13f0549b99c9320",
  "apiKey": "AIzaSyDbIhhHeFmrFsHAL6U-ht1AgTQjvGG3otw",
  "authDomain": "studio-4928604682-ea1ec.firebaseapp.com",
  "storageBucket": "studio-4928604682-ea1ec.firebasestorage.app",
  "measurementId": "",
  "messagingSenderId": "913801169761"
};


// Initialize Firebase for SERVER-SIDE
let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);


export { app, db, storage };
