// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// Firebase configuration loaded from environment variables (VITE_ prefix exposes them to the client)
// Set these in your .env file - see .env.example for details
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Firebase config is missing. Set VITE_FIREBASE_* variables in your .env file. See .env.example.",
  );
}

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicializa los proveedores de autenticación social
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
export const appleProvider = new OAuthProvider("apple.com");

microsoftProvider.setCustomParameters({
  prompt: "consent",
  tenant: "common",
});

appleProvider.addScope("email");
appleProvider.addScope("name");
