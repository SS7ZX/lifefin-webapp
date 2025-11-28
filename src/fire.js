import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEBJ0tvBESS5aQOTEQI0jrfauqeTt0rts",
  authDomain: "lifefin.firebaseapp.com",
  projectId: "lifefin",
  storageBucket: "lifefin.firebasestorage.app",
  messagingSenderId: "662536262300",
  appId: "1:662536262300:web:c40307637655a9cb481359"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Export LANGSUNG (Biar gak error re-export)
export const db = getFirestore(app);