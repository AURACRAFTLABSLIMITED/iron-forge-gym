/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/config/firebase.js
 * Purpose: Initializes Firebase App, Authentication, Cloud Firestore, and Firebase Storage.
 *          Supports both Vite environment variables (.env) for external white-label deployments
 *          and firebase-applet-config.json for AI Studio provisioned environments.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import appletConfig from '../../firebase-applet-config.json';

// Prefer explicit VITE_FIREBASE_* environment variables when provided, falling back
// to the provisioned firebase-applet-config.json so the app works immediately out of the box.
// If you change/remove this fallback logic, external .env deployments or AI Studio previews may fail to connect.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;

// Prevent duplicate Firebase initialization during module reloads
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// CRITICAL: Pass firestoreDatabaseId when configured so Enterprise/named Firestore databases connect properly.
// If you remove firestoreDatabaseId here, queries will target the wrong database and return empty or permission errors.
export const db =
  firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);

export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

/**
 * Verifies live Firestore connectivity on application boot.
 * Logs a clear diagnostic if the client cannot reach Firestore.
 */
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'site'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firebase connection failed: please check your Firebase configuration.');
    }
  }
}

export default app;
