import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

// Configuration read from environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForPokedexDev123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pokedex-tcg-master.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pokedex-tcg-master',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pokedex-tcg-master.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

// Safe initialization
let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore;
let storage: FirebaseStorage;
let isFirebaseConfigured = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseConfigured = true;
} catch (err) {
  console.warn('Firebase running in local/offline mode:', err);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Returns allowed email addresses defined in .env
 */
export function getAllowedEmails(): string[] {
  const envEmails = import.meta.env.VITE_ALLOWED_EMAILS || '';
  return envEmails
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks if a given email is whitelisted in .env
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return true; // Open access if no whitelist specified
  return allowed.includes(email.toLowerCase().trim());
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; isAllowed: boolean }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Check your credentials.');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const allowed = isEmailAllowed(user.email);
  return { user, isAllowed: allowed };
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
}

/**
 * Sync user collection, custom cards, and decks to Cloud Firestore
 */
export async function syncUserCollectionToFirestore(
  userId: string, 
  data: {
    quantities: Record<string, number>;
    notes: Record<string, string>;
    favorites: string[];
    decks?: any[];
    cards?: any[];
  }
) {
  if (!db || !userId) return false;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error syncing to Firestore:', error);
    throw error;
  }
}

/**
 * Load user collection and custom decks from Cloud Firestore
 */
export async function loadUserCollectionFromFirestore(userId: string) {
  if (!db || !userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading from Firestore:', error);
    return null;
  }
}

/**
 * Uploads a card image file (Blob/File) directly to Firebase Storage and returns the download URL
 */
export async function uploadCardImageToStorage(fileOrBlob: Blob | File, filename: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  const storageRef = ref(storage, `cards/${cleanFilename}`);
  
  const snapshot = await uploadBytes(storageRef, fileOrBlob, {
    contentType: fileOrBlob.type || 'image/png',
    cacheControl: 'public, max-age=31536000'
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

/**
 * Downloads an image from an external URL and uploads it to Firebase Storage
 */
export async function downloadAndUploadImageToStorage(externalUrl: string, filename: string): Promise<string> {
  try {
    const response = await fetch(externalUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const blob = await response.blob();
    return await uploadCardImageToStorage(blob, filename);
  } catch (err) {
    console.warn(`Could not upload external image to storage, keeping original URL:`, err);
    return externalUrl;
  }
}

export { auth, db, storage, isFirebaseConfigured, onAuthStateChanged };
