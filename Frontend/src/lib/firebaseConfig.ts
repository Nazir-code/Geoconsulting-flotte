// lib/firebaseConfig.ts
// Configuration Firebase pour React Web avec persistance de session
// Credentials du projet geoconsulting-fleet

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork } from 'firebase/firestore';

interface FirebaseEnvironmentConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Configuration Firebase sécurisée via variables d'environnement
const firebaseConfig: FirebaseEnvironmentConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Déterminer l'environnement
const environment = import.meta.env.MODE || 'development';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuration de l'authentification avec persistance
auth.useDeviceLanguage();

// Configurer la persistance de session par défaut
// IMPORTANT: browserSessionPersistence = session effacée à fermeture du navigateur (sécurisé)
// Cela implique:
// - localStorage et sessionStorage sont nettoyés à la fermeture complète du navigateur
// - L'utilisateur doit se reconnecter après un redémarrage du navigateur
// - Meilleure sécurité pour une application professionnelle
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error('Erreur configuration persistance Firebase Auth:', error);
});

// Configuration Firestore pour offline
const setupFirestore = () => {
  try {
    // Activer le réseau Firestore
    enableNetwork(db);
    
    // Configuration pour le développement local (optionnel)
    if (environment === 'development' && import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.error('Erreur configuration Firestore:', error);
  }
};

// Initialiser Firestore
setupFirestore();

// Exporter la configuration pour les tests
export { firebaseConfig, environment };

export default app;
