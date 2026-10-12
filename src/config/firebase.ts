import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCNT317RYdI6JWWo8QqzHBQu80cGqUng3Q",
  authDomain: "drive-nexa.firebaseapp.com",
  databaseURL: "https://drive-nexa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "drive-nexa",
  storageBucket: "drive-nexa.firebasestorage.app",
  messagingSenderId: "770147575051",
  appId: "1:770147575051:web:9093cde4330c5d86912e0e",
  measurementId: "G-11RCZ78EB7"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
// Set persistent session
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence initialization notice:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database (ideal for ESP32 low-latency commands and telemetry)
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);
