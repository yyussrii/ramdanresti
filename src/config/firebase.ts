import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('MY_')
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
    console.info(
      '[Firebase] Successfully initialized with project:',
      firebaseConfig.projectId,
      'database:',
      firebaseConfig.firestoreDatabaseId || '(default)'
    );
  } catch (error) {
    console.warn('[Firebase] Initialization error, using persistent local fallback:', error);
  }
} else {
  console.info('[Firebase] Environment variables not set. Running in seamless persistent local store mode.');
}

export { app, db, auth };

