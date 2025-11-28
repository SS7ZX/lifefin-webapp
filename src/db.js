// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { db } from './db';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEBJOtvbESS5aQOTEQI0jrfauqeTtORts",
  authDomain: "lifefin.firebaseapp.com",
  projectId: "lifefin",
  storageBucket: "lifefin.firebasestorage.app",
  messagingSenderId: "662536262300",
  appId: "1:662536262300:web:c40307637655a9cb481359"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);