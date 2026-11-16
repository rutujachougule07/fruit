import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC_EHn-p3-o5Gktr2KOG7SCuYr_vgX8qco",
    authDomain: "fruit-3a407.firebaseapp.com",
    projectId: "fruit-3a407",
    storageBucket: "fruit-3a407.firebasestorage.app",
    messagingSenderId: "737660920745",
    appId: "1:737660920745:web:0875495cd05c306ed91ab8",
    measurementId: "G-BJL62NZ8K9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestoreDb = getFirestore(app);
export const db = firestoreDb; // Alias for backward compatibility