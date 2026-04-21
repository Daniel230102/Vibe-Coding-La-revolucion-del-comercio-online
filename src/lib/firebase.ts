import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseAppletConfig from "../../firebase-applet-config.json";

// Usar variables de entorno (para Vercel) o el config de AI Studio
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Importante: Usar el ID de base de datos específico para Firestore Enterprise en AI Studio
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId;
export const db = getFirestore(app, databaseId);

export const COLLECTIONS = {
  USERS: "users",
  SHOPS: "shops",
  PRODUCTS: "products",
  EMPLOYEES: "employees",
  SCHEDULES: "schedules",
  CART: "carts"
};
