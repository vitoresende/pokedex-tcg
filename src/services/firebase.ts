import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

// Configuration read from environment variables (.env)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, string>);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForPokedexDev123',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'pokedex-tcg-master.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'pokedex-tcg-master',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'pokedex-tcg-master.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
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
  const envEmails = env.VITE_ALLOWED_EMAILS || '';
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
 * Generates a high-entropy secret token for read-only collection sharing
 */
export function generateSecureShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = new Uint8Array(24);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 24; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let token = 'pkx_';
  for (let i = 0; i < randomBytes.length; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
}

/**
 * Sync user collection, custom cards, and decks to Cloud Firestore
 * Also updates the public read-only snapshot if a shareToken is active.
 */
export async function syncUserCollectionToFirestore(
  userId: string, 
  data: {
    quantities: Record<string, number>;
    notes: Record<string, string>;
    favorites: string[];
    decks?: any[];
    cards?: any[];
    shareToken?: string | null;
    ownerName?: string;
  }
) {
  if (!db || !userId) return false;
  try {
    const timestamp = new Date().toISOString();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      lastUpdated: timestamp
    }, { merge: true });

    if (data.shareToken) {
      const sharedRef = doc(db, 'shared_collections', data.shareToken);
      await setDoc(sharedRef, {
        ownerUid: userId,
        ownerName: data.ownerName || 'Treinador Pokémon',
        quantities: data.quantities,
        notes: data.notes,
        favorites: data.favorites,
        decks: data.decks || [],
        cards: data.cards || [],
        lastUpdated: timestamp
      }, { merge: true });
    }
    return true;
  } catch (error) {
    console.error('Error syncing to Firestore:', error);
    throw error;
  }
}

/**
 * Creates or rotates a share link token and publishes the read-only collection snapshot
 */
export async function publishSharedCollectionToFirestore(
  userId: string,
  ownerName: string,
  newToken: string,
  previousToken: string | null,
  data: {
    quantities: Record<string, number>;
    notes: Record<string, string>;
    favorites: string[];
    decks: any[];
    cards: any[];
  }
): Promise<boolean> {
  if (!db || !userId || !newToken) return false;
  try {
    if (previousToken && previousToken !== newToken) {
      try {
        await deleteDoc(doc(db, 'shared_collections', previousToken));
      } catch (e) {
        console.warn('Could not delete previous share token doc:', e);
      }
    }

    const timestamp = new Date().toISOString();
    const sharedRef = doc(db, 'shared_collections', newToken);
    await setDoc(sharedRef, {
      ownerUid: userId,
      ownerName: ownerName || 'Treinador Pokémon',
      quantities: data.quantities,
      notes: data.notes,
      favorites: data.favorites,
      decks: data.decks,
      cards: data.cards,
      lastUpdated: timestamp
    });

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      shareToken: newToken,
      lastUpdated: timestamp
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error publishing shared collection:', error);
    throw error;
  }
}

/**
 * Revokes an active share token and removes the shared collection snapshot from Firestore
 */
export async function revokeSharedCollectionFromFirestore(
  userId: string,
  shareToken: string
): Promise<boolean> {
  if (!db || !userId || !shareToken) return false;
  try {
    await deleteDoc(doc(db, 'shared_collections', shareToken));
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      shareToken: null,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error revoking shared collection:', error);
    throw error;
  }
}

/**
 * Loads a shared collection snapshot by its secret token (Read-Only Visitor Mode)
 */
export async function loadSharedCollectionFromFirestore(shareToken: string) {
  if (!db || !shareToken) return null;
  try {
    const sharedRef = doc(db, 'shared_collections', shareToken);
    const snap = await getDoc(sharedRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading shared collection from Firestore:', error);
    return null;
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

/**
 * Syncs global sets metadata to Cloud Firestore under settings/sets_metadata
 */
export async function syncSetsMetadataToFirestore(data: any): Promise<boolean> {
  if (!db) return false;
  try {
    const settingsRef = doc(db, 'settings', 'sets_metadata');
    await setDoc(settingsRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error syncing sets metadata to Firestore:', error);
    return false;
  }
}

/**
 * Loads global sets metadata from Cloud Firestore under settings/sets_metadata
 */
export async function loadSetsMetadataFromFirestore(): Promise<any | null> {
  if (!db) return null;
  try {
    const settingsRef = doc(db, 'settings', 'sets_metadata');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('Could not load sets metadata from Firestore (offline or uninitialized):', error);
    return null;
  }
}

/**
 * Syncs global rarities metadata to Cloud Firestore under settings/rarities_metadata
 */
export async function syncRaritiesMetadataToFirestore(data: any): Promise<boolean> {
  if (!db) return false;
  try {
    const settingsRef = doc(db, 'settings', 'rarities_metadata');
    await setDoc(settingsRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error syncing rarities metadata to Firestore:', error);
    return false;
  }
}

/**
 * Loads global rarities metadata from Cloud Firestore under settings/rarities_metadata
 */
export async function loadRaritiesMetadataFromFirestore(): Promise<any | null> {
  if (!db) return null;
  try {
    const settingsRef = doc(db, 'settings', 'rarities_metadata');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('Could not load rarities metadata from Firestore (offline or uninitialized):', error);
    return null;
  }
}

export { auth, db, storage, isFirebaseConfigured, onAuthStateChanged };
