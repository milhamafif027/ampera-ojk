// Import fungsi yang dibutuhkan dari SDK Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Web App Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyA4CQ237K29-n8Tt1TeEEfu_B65p7cX-JE",
  authDomain: "lms-project-c2934.firebaseapp.com",
  projectId: "lms-project-c2934",
  storageBucket: "lms-project-c2934.firebasestorage.app",
  messagingSenderId: "625876504830",
  appId: "1:625876504830:web:65e8b4da1b312a6c7755af",
  measurementId: "G-CHBK2LFRCZ"
};

// Inisialisasi Firebase (Mencegah Next.js melakukan inisialisasi ganda)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Auth & Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Ekspor variabel agar bisa digunakan di halaman lain
export { app, auth, db };