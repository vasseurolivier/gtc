// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-4928604682-ea1ec",
  "appId": "1:913801169761:web:0a43_c3c13f0549b99c9320",
  "apiKey": "AIzaSyDbIhhHeFmrFsHAL6U-ht1AgTQjvGG3otw",
  "authDomain": "studio-4928604682-ea1ec.firebaseapp.com",
  "storageBucket": "studio-4928604682-ea1ec.appspot.com",
  "measurementId": "",
  "messagingSenderId": "913801169761"
};

const clientApp = getApps().length ? getApp() : initializeApp(firebaseConfig, "client");
const clientStorage = getStorage(clientApp);

export { clientApp, clientStorage };
