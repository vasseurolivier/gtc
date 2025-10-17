
// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  "projectId": "studio-4928604682-ea1ec",
  "appId": "1:913801169761:web:0a43c3c13f0549b99c9320",
  "apiKey": "AIzaSyDbIhhHeFmrFsHAL6U-ht1AgTQjvGG3otw",
  "authDomain": "studio-4928604682-ea1ec.firebaseapp.com",
  "storageBucket": "studio-4928604682-ea1ec.appspot.com",
  "measurementId": "",
  "messagingSenderId": "913801169761"
};

let clientApp: FirebaseApp;
// This guard prevents re-initialization on hot reloads
if (!getApps().some(app => app.name === "client")) {
  clientApp = initializeApp(firebaseConfig, "client");
} else {
  clientApp = getApp("client");
}


export { clientApp };

    