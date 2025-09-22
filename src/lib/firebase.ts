// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-4928604682-ea1ec",
  "appId": "1:913801169761:web:0a43c3c13f0549b99c9320",
  "apiKey": "AIzaSyDbIhhHeFmrFsHAL6U-ht1AgTQjvGG3otw",
  "authDomain": "studio-4928604682-ea1ec.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "913801169761"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
