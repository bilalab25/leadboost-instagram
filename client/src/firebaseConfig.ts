// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// Tu configuración de Firebase (obtenida de la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDfch6TtQaX-OjvMfP7FZUVHgZGmeSfdBg",
  authDomain: "app.leadboostapp.ai",
  projectId: "leadboost-f0991",
  storageBucket: "leadboost-f0991.firebasestorage.app",
  messagingSenderId: "898474049332",
  appId: "1:898474049332:web:59666e3bedbe576aec2f61",
};

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
