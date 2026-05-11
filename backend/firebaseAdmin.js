// Firebase Admin Initialization
// Configure and initialize Firebase Admin SDK for Firestore

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_FIREBASE_PROJECT_ID = 'geoconsulting-fleet';

// Initialize Firebase Admin SDK
// Two methods are supported:
// 1. Using GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to serviceAccountKey.json
// 2. Using individual environment variables (recommended for production/CI)

function initializeFirebaseAdmin() {
  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT ||
      DEFAULT_FIREBASE_PROJECT_ID;

    // Method 1: Using service account key file (development)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔥 Initializing Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS');
      admin.initializeApp({ projectId });
    } 
    // Method 2: Using individual credentials (production)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔥 Initializing Firebase Admin with individual credentials');
      
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } 
    // Method 3: Using default application credentials (Google Cloud)
    else {
      console.log('🔥 Initializing Firebase Admin with default credentials');
      admin.initializeApp({
        projectId,
      });
    }

    if (!process.env.FIREBASE_PROJECT_ID && !process.env.GCLOUD_PROJECT) {
      console.warn(`⚠️ FIREBASE_PROJECT_ID not set, using fallback projectId="${projectId}"`);
    }

    console.log('✅ Firebase Admin SDK initialized successfully!');
    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
}

// Initialize and export
const firebaseAdmin = initializeFirebaseAdmin();
export default firebaseAdmin;
