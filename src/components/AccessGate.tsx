import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Lock, LogIn, LogOut, RefreshCw 
} from 'lucide-react';

export const AccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAllowed, loginWithGoogle, logout } = useAuth();

  // 1. Loading State: Pokédex Boot Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-pokedex-darker flex flex-col items-center justify-center p-4 text-white font-mono">
        <div className="relative w-20 h-20 rounded-full bg-white p-1.5 shadow-[0_0_30px_rgba(41,182,246,0.6)] flex items-center justify-center animate-pulse mb-6">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-300 via-pokedex-blue to-blue-700 flex items-center justify-center border-2 border-white">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <h2 className="font-display font-black text-xl uppercase tracking-widest">
          Booting Pokédex OS...
        </h2>
        <p className="text-xs text-slate-400 mt-2">Verifying trainer credentials</p>
      </div>
    );
  }

  // 2. Authorized State: Grant Full Access to Application
  if (user && isAllowed) {
    return <>{children}</>;
  }

  // 3. Unauthorized State (Logged in, but email NOT in whitelist)
  if (user && !isAllowed) {
    return (
      <div className="min-h-screen bg-pokedex-darker flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Bezel Warning Header */}
          <div className="bg-gradient-to-r from-red-700 via-pokedex-darkred to-red-900 px-6 py-4 flex items-center justify-between border-b-2 border-red-950">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-black/40 border border-red-400/40 text-yellow-300 shadow-md">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="font-display font-black text-base uppercase tracking-wider text-white">
                  Access Denied
                </h2>
                <span className="font-mono text-[10px] text-yellow-300/90 font-bold">
                  Unauthorized Account
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 space-y-5 font-mono text-xs">
            <div className="bg-red-950/60 border border-red-700/60 rounded-2xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center space-x-2 text-red-300 font-bold">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Account Not Authorized</span>
              </div>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                You are signed in as <strong className="text-yellow-300 break-all">{user.email}</strong>, but this email address is not authorized to access this Pokédex.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={loginWithGoogle}
                className="flex-1 bg-pokedex-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Another Account</span>
              </button>

              <button
                onClick={logout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 border border-slate-700"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Not Logged In State: Pokédex Login Access Gate
  return (
    <div className="min-h-screen bg-pokedex-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Pokédex Bezel */}
        <div className="bg-pokedex-red px-6 py-4 border-b-2 border-pokedex-darkred flex items-center justify-between shadow-md">
          {/* Main Sensor */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white p-1 shadow-inner flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-300 via-pokedex-blue to-blue-700 flex items-center justify-center relative overflow-hidden border border-white">
                <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-white/70 blur-[0.5px]"></div>
                <div className="w-2 h-2 rounded-full bg-white/40 animate-ping"></div>
              </div>
            </div>

            {/* Status LEDs */}
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-950 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-950 shadow-[0_0_6px_rgba(250,204,21,0.8)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-950 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></div>
            </div>
          </div>

          <span className="font-mono text-xs font-bold text-yellow-300 tracking-wider uppercase">
            Sign In
          </span>
        </div>

        {/* Login Body */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          <div className="space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-pokedex-red/20 border border-pokedex-red/40 text-yellow-300 mb-1">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-display font-black text-2xl uppercase tracking-wider text-white">
              Pokédex TCG Master
            </h2>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Sign in with your authorized Google account to access your Pokémon collection and decks.
            </p>
          </div>

          {/* Sign In Action */}
          <button
            onClick={loginWithGoogle}
            className="w-full bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3 text-xs font-mono uppercase tracking-wider border border-white/20"
          >
            <LogIn className="w-4 h-4 text-yellow-300" />
            <span>Sign In with Google (Gmail)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
