import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyApcx4Dec8hlgp1AB3CvS2S19REw3ddbY8",
  authDomain: "mla-kgm-registration-website.firebaseapp.com",
  projectId: "mla-kgm-registration-website",
  storageBucket: "mla-kgm-registration-website.firebasestorage.app",
  messagingSenderId: "447263738598",
  appId: "1:447263738598:web:22d8779e5d4c47b7cd8927"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { db, app, auth };
