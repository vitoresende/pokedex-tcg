import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../context/CollectionContext';
import { 
  User, ShieldCheck, ShieldAlert, LogIn, LogOut, Cloud, 
  CheckCircle2, AlertTriangle, Sparkles, UploadCloud 
} from 'lucide-react';
import { soundEffects } from '../services/audio';

export const AuthProfilePage: React.FC = () => {
  const { user, isAllowed, allowedEmails, loginWithGoogle, logout } = useAuth();
  const { syncToCloud, syncing, stats } = useCollection();
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<boolean>(false);

  const handleSync = async () => {
    const success = await syncToCloud();
    if (success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
          <User className="w-5 h-5 text-yellow-300" />
          <span>User Authentication & Cloud Storage</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Google OAuth 2.0 (Gmail), security whitelist enforcement, and Cloud Firestore sync
        </p>
      </div>

      {/* User Status Card */}
      <div className="bg-pokedex-card/95 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {user?.photoURL && !photoError ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setPhotoError(true)}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pokedex-blue to-blue-700 border-2 border-white/60 text-white flex items-center justify-center font-display font-black text-xl shadow-md">
                {user ? (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase() : 'P'}
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold font-sans text-white">
                  {user ? (user.displayName || 'Authenticated User') : 'Guest Mode (Anonymous)'}
                </h3>
                {user && (
                  isAllowed ? (
                    <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3" /> Whitelisted
                    </span>
                  ) : (
                    <span className="bg-amber-950 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-800 flex items-center gap-1 font-bold">
                      <ShieldAlert className="w-3 h-3" /> Restricted
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user ? user.email : 'Sign in with your Google account to sync collection to Firestore'}
              </p>
            </div>
          </div>

          {/* Login / Logout Action */}
          <div>
            {user ? (
              <button
                onClick={logout}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="w-full sm:w-auto bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 border border-white/20"
              >
                <LogIn className="w-4 h-4 text-yellow-300" />
                <span>Sign In with Google (Gmail)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Whitelist Configuration Display */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-3 font-mono text-xs shadow-md">
        <div className="flex items-center space-x-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Authorized Whitelisted Emails (VITE_ALLOWED_EMAILS)</span>
        </div>
        <p className="text-slate-400 font-sans text-[11px]">
          Only authenticated users whose email address appears in this list are authorized to sync and persist changes to the cloud database.
        </p>
        <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
          {allowedEmails.length > 0 ? (
            allowedEmails.map((email, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-yellow-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{email}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-400 italic">No emails configured (open development mode).</div>
          )}
        </div>
      </div>

      {/* Cloud Firestore Collection Sync */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-pokedex-blue" />
            <h3 className="font-bold text-sm text-white font-mono uppercase">Cloud Database Sync (Cloud Firestore)</h3>
          </div>
          {syncSuccess && (
            <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Successfully Synced!
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 font-sans">
          Sync your card collection quantities, personal strategic notes, custom decks, and favorites to Cloud Firestore.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing || !user || !isAllowed}
          className="w-full bg-pokedex-blue hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 text-xs font-mono uppercase"
        >
          <Cloud className="w-4 h-4" />
          <span>{syncing ? 'Syncing with Firestore...' : 'Sync Collection to Cloud'}</span>
        </button>

        {!isAllowed && user && (
          <div className="text-amber-400 text-[11px] font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Add your email to VITE_ALLOWED_EMAILS in .env to enable cloud synchronization.</span>
          </div>
        )}
      </div>

      {/* Firebase Storage Guide & CLI Commands */}
      <div className="bg-pokedex-darker rounded-3xl border border-slate-800 p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-cyan-300 font-bold">
          <UploadCloud className="w-4 h-4" />
          <span>Firebase Storage Image Pipeline</span>
        </div>
        <p className="text-slate-400 font-sans text-[11px]">
          Cards automatically resolve high-resolution images from official CDNs or your private <strong>Firebase Storage</strong> bucket configured in <code className="bg-slate-800 text-yellow-300 px-1 py-0.5 rounded">.env</code>.
        </p>

        <div className="bg-black/60 p-3 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
          <div className="text-slate-400"># 1. Download card images in batch to temporary storage:</div>
          <div className="text-yellow-300">npm run download:cards</div>
          
          <div className="text-slate-400 pt-1"># 2. Upload all downloaded images to Firebase Storage:</div>
          <div className="text-yellow-300">npm run upload:firebase &lt;your-bucket.appspot.com&gt;</div>

          <div className="text-slate-400 pt-1"># 3. Deploy full frontend and backend to Firebase Hosting:</div>
          <div className="text-yellow-300">firebase deploy</div>
        </div>
      </div>
    </div>
  );
};
