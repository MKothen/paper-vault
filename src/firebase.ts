

// @ts-nocheck
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyA_R00b-7CWm3g_1xk8dBUHG8UyULUJgEs",
  authDomain: "paper-vault-d4ba1.firebaseapp.com",
  projectId: "paper-vault-d4ba1",
  storageBucket: "paper-vault-d4ba1.firebasestorage.app",
  messagingSenderId: "137615673960",
  appId: "1:137615673960:web:cfc32ce078d9ba3933c9dd"
};

// ------------------------------

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);