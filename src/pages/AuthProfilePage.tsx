import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../context/CollectionContext';
import { 
  User, ShieldCheck, ShieldAlert, LogIn, LogOut, Cloud, 
  CheckCircle2, AlertTriangle, Sparkles, UploadCloud, RefreshCw 
} from 'lucide-react';
import { soundEffects } from '../services/audio';

export const AuthProfilePage: React.FC = () => {
  const { user, isAllowed, allowedEmails, authError, clearAuthError, loginWithGoogle, logout } = useAuth();
  const { syncToCloud, syncing, syncStatus, lastSyncedAt, stats, cards, decks, favorites } = useCollection();
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<boolean>(false);

  const handleSync = async () => {
    const success = await syncToCloud();
    if (success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }
  };

  const userInitial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const formattedLastSynced = lastSyncedAt 
    ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Pending...';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 select-none">
      {/* Header Banner */}
      <div className="bg-pokedex-card/90 rounded-3xl border-2 border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user?.photoURL && !photoError ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User Avatar'} 
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setPhotoError(true)}
                  className="w-16 h-16 rounded-full border-2 border-pokedex-blue shadow-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pokedex-blue via-blue-600 to-indigo-800 border-2 border-white/60 shadow-lg flex items-center justify-center text-white font-display font-black text-2xl">
                  {user ? userInitial : <User className="w-8 h-8 text-white/80" />}
                </div>
              )}
              {user && (
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-pokedex-card ${isAllowed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-black text-xl text-white tracking-wide uppercase">
                  {user?.displayName || (user ? 'Trainer' : 'Guest Visitor')}
                </h2>
                {isAllowed && (
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Whitelisted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.email || 'Sign in to access your personal collection & custom decks'}
              </p>
              {user?.uid && (
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                  UID: {user.uid}
                </p>
              )}
            </div>
          </div>

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

        {/* Authentication Error Banner */}
        {authError && (
          <div className="mt-4 bg-red-950/80 border-2 border-red-500/80 rounded-2xl p-4 text-left font-mono text-xs space-y-2 relative shadow-lg animate-in fade-in">
            <div className="flex items-center space-x-2 text-red-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Authentication Error</span>
            </div>
            <p className="text-slate-200 text-xs font-sans leading-relaxed">
              {authError}
            </p>
          </div>
        )}
      </div>

      {/* Real-Time Continuous Cloud Firestore Sync Card */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-pokedex-blue/20 text-pokedex-blue border border-pokedex-blue/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-mono uppercase">
                Real-Time Cloud Firestore Sync
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Continuous auto-save for cards, quantities, custom decks & notes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {syncStatus === 'syncing' ? (
              <span className="bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : syncStatus === 'synced' ? (
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Synced
              </span>
            ) : syncStatus === 'error' ? (
              <span className="bg-red-500/20 text-red-300 text-xs font-mono font-bold px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Sync Error
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 text-xs font-mono font-bold px-3 py-1 rounded-full border border-slate-700">
                Ready
              </span>
            )}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase block">Total Owned</span>
            <span className="text-yellow-300 font-bold text-lg">{stats.totalOwnedCards}</span>
          </div>
          <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase block">Custom Decks</span>
            <span className="text-cyan-300 font-bold text-lg">{decks.length}</span>
          </div>
          <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase block">Favorites</span>
            <span className="text-rose-400 font-bold text-lg">{favorites.length}</span>
          </div>
          <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase block">Last Cloud Sync</span>
            <span className="text-emerald-400 font-bold text-xs mt-1 block">{formattedLastSynced}</span>
          </div>
        </div>

        {/* Auto-Sync Explanation & Force Sync Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-slate-400 text-xs font-sans">
            Every change you make (adjusting card quantities, building decks, adding favorites) is <strong>automatically persisted in real-time</strong> to your private Cloud Firestore collection (<code className="text-yellow-300">users/{user?.uid || '{userId}'}</code>).
          </p>

          <button
            onClick={handleSync}
            disabled={syncing || !user || !isAllowed}
            className="w-full sm:w-auto shrink-0 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 text-xs font-mono uppercase border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Force Sync Now'}</span>
          </button>
        </div>

        {!isAllowed && user && (
          <div className="text-amber-400 text-[11px] font-mono flex items-center gap-1.5 bg-amber-950/40 p-3 rounded-xl border border-amber-800/40">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Your email is not in VITE_ALLOWED_EMAILS. Add it to .env to enable real-time Cloud Firestore synchronization.</span>
          </div>
        )}
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

      {/* Firebase Storage Guide & CLI Commands */}
      <div className="bg-pokedex-darker rounded-3xl border border-slate-800 p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-cyan-300 font-bold">
          <UploadCloud className="w-4 h-4" />
          <span>Firebase Storage Image Pipeline</span>
        </div>
        <p className="text-slate-400 font-sans text-[11px]">
          Cards automatically resolve high-resolution images from official CDNs or your private <strong>Firebase Storage</strong> bucket configured in <code className="bg-slate-800 text-yellow-300 px-1 py-0.5 rounded">.env</code>.
        </p>
      </div>
    </div>
  );
};
