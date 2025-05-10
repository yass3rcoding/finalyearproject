// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBeZrYddI5oID_ILM4TOqPeGMXPj2SNyDo",
    authDomain: "trimconnect.firebaseapp.com",
    projectId: "trimconnect",
    storageBucket: "trimconnect.firebasestorage.app",
    messagingSenderId: "1089900911295",
    appId: "1:1089900911295:web:60b45b160fca9315f4c40a",
    measurementId: "G-YJTGKQ1GSN"
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);
