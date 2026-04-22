import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseAppletConfig from "../../firebase-applet-config.json";

// Función para obtener la configuración de Firebase de forma segura
const getFirebaseConfig = () => {
  // Intentar cargar el archivo de configuración local (AI Studio)
  let localConfig: any = {};
  try {
    localConfig = firebaseAppletConfig;
  } catch (e) {
    console.warn("Configuración local de Firebase no disponible.");
  }

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  };

  // Validar que al menos la apiKey esté presente para no romper la app
  if (!config.apiKey) {
    console.error("Firebase API Key no encontrada. Por favor, configura las variables de entorno en Vercel.");
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Importante: Usar el ID de base de datos si existe, si no, Firestore usará '(default)' por defecto
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseAppletConfig as any).firestoreDatabaseId;

// Si el databaseId es el de AI Studio o está presente, se usa. Si no, se inicializa normal.
export const db = databaseId && databaseId !== "(default)" 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);

export const COLLECTIONS = {
  USERS: "users",
  SHOPS: "shops",
  PRODUCTS: "products",
  EMPLOYEES: "employees",
  SCHEDULES: "schedules",
  CART: "carts"
};
