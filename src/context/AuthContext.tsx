import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  loginWithGoogle as fbLoginWithGoogle, 
  logoutUser as fbLogoutUser, 
  isEmailAllowed, 
  getAllowedEmails,
  onAuthStateChanged 
} from '../services/firebase';
import { AuthUser } from '../types';
import { soundEffects } from '../services/audio';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAllowed: boolean;
  allowedEmails: string[];
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemoUser: (asAuthorized?: boolean) => void;
  unauthorizedModalOpen: boolean;
  setUnauthorizedModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unauthorizedModalOpen, setUnauthorizedModalOpen] = useState<boolean>(false);
  const allowedEmails = getAllowedEmails();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const allowed = isEmailAllowed(fbUser.email);
        const token = await fbUser.getIdToken().catch(() => undefined);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          isAllowed: allowed,
          token
        });
        if (!allowed) {
          soundEffects.playAlert();
          setUnauthorizedModalOpen(true);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      soundEffects.playClick();
      const { user: fbUser, isAllowed: allowed } = await fbLoginWithGoogle();
      const token = await fbUser.getIdToken().catch(() => undefined);
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        isAllowed: allowed,
        token
      });
      if (allowed) {
        soundEffects.playScan();
      } else {
        soundEffects.playAlert();
        setUnauthorizedModalOpen(true);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', err);
      }
    }
  };

  const logout = async () => {
    soundEffects.playClick();
    await fbLogoutUser();
    setUser(null);
  };

  const loginAsDemoUser = (asAuthorized: boolean = true) => {
    soundEffects.playClick();
    const demoEmail = asAuthorized 
      ? (allowedEmails[0] || 'admin@pokedex.dev') 
      : 'unauthorized_trainer@pokemon.com';
    const allowed = isEmailAllowed(demoEmail);
    
    setUser({
      uid: asAuthorized ? 'demo-authorized-uid-123' : 'demo-unauthorized-uid-999',
      email: demoEmail,
      displayName: asAuthorized ? 'Authorized Trainer' : 'Guest Visitor',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      isAllowed: allowed,
      token: 'demo-jwt-bearer-token-connectrpc'
    });

    if (allowed) {
      soundEffects.playScan();
    } else {
      soundEffects.playAlert();
      setUnauthorizedModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAllowed: user ? user.isAllowed : false,
        allowedEmails,
        loginWithGoogle,
        logout,
        loginAsDemoUser,
        unauthorizedModalOpen,
        setUnauthorizedModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
