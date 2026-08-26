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

// Configuração lida do ambiente (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForPokedexDev123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pokedex-tcg-master.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pokedex-tcg-master',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pokedex-tcg-master.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

// Inicialização segura
let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore;
let isFirebaseConfigured = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConfigured = true;
} catch (err) {
  console.warn('Firebase em modo local/offline:', err);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Obtém a lista de e-mails permitidos a partir do .env
 */
export function getAllowedEmails(): string[] {
  const envEmails = import.meta.env.VITE_ALLOWED_EMAILS || '';
  return envEmails
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifica se um determinado e-mail está na lista de permissões (.env)
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  // Se não houver e-mails configurados, permite todos em modo de desenvolvimento
  if (allowed.length === 0) return true;
  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Login com Google (Gmail)
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; isAllowed: boolean }> {
  if (!auth) {
    throw new Error('Firebase Auth não inicializado');
  }
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const allowed = isEmailAllowed(user.email);
  return { user, isAllowed: allowed };
}

/**
 * Logout do Firebase
 */
export async function logoutUser(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
}

/**
 * Salva as alterações da coleção do usuário no Firestore
 */
export async function syncUserCollectionToFirestore(
  userId: string, 
  quantities: Record<string, number>, 
  notes: Record<string, string>,
  favorites: string[]
) {
  if (!db || !userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      lastUpdated: new Date().toISOString(),
      quantities,
      notes,
      favorites
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar com Firestore:', error);
    throw error;
  }
}

/**
 * Carrega a coleção do usuário a partir do Firestore
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
    console.error('Erro ao carregar do Firestore:', error);
    return null;
  }
}

export { auth, db, isFirebaseConfigured, onAuthStateChanged };
