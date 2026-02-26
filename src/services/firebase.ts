// Firebase configuration for SmartVictus
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSyAscppFUIGDn7sRMBiXO0pONimNGx1exts",
  authDomain: "smartvictus-bc4ad.firebaseapp.com",
  projectId: "smartvictus-bc4ad",
  storageBucket: "smartvictus-bc4ad.firebasestorage.app",
  messagingSenderId: "667338663293",
  appId: "1:667338663293:web:1fcb303e423d0eea551814"
};

// Initialize App (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
