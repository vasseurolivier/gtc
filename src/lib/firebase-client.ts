'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-4928604682-ea1ec",
  "appId": "1:913801169761:web:0a43c3c13f0549b99c9320",
  "apiKey": "AIzaSyDbIhhHeFmrFsHAL6U-ht1AgTQjvGG3otw",
  "authDomain": "studio-4928604682-ea1ec.firebaseapp.com",
  "storageBucket": "studio-4928604682-ea1ec.appspot.com",
  "measurementId": "",
  "messagingSenderId": "913801169761"
};

let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

db = getFirestore(app);

export { app, db };
