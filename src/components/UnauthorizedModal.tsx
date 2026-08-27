import React from 'react';
import { ShieldAlert, X, Mail, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedModal: React.FC = () => {
  const { user, unauthorizedModalOpen, setUnauthorizedModalOpen, allowedEmails, logout } = useAuth();

  if (!unauthorizedModalOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Warning Bezel */}
        <div className="bg-gradient-to-r from-red-700 to-pokedex-darkred px-6 py-4 flex items-center justify-between border-b-2 border-red-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-black/30 border border-white/20">
              <ShieldAlert className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                Access Restricted
              </h3>
              <span className="font-mono text-[10px] text-yellow-300/80">Security Protocol Whitelist</span>
            </div>
          </div>

          <button
            onClick={() => setUnauthorizedModalOpen(false)}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-mono text-xs">
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-red-300 font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Email Not Authorized</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              The Google account <strong className="text-yellow-300">{user.email}</strong> is authenticated, but is not present in the allowed whitelist defined in the <code className="bg-slate-900 px-1 py-0.5 rounded text-white">VITE_ALLOWED_EMAILS</code> environment variable.
            </p>
          </div>

          {/* Allowed Emails Explanation */}
          <div className="space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">How to Grant Access:</span>
            <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-2 text-[11px] font-sans">
              <p className="text-slate-300">
                To allow modifications, syncing, and elevated permissions for this email, add it to your <code>.env</code> file:
              </p>
              <div className="bg-black/60 p-2.5 rounded-xl border border-slate-750 font-mono text-[10px] text-cyan-300 overflow-x-auto">
                VITE_ALLOWED_EMAILS={user.email || 'your-email@gmail.com'},other@gmail.com
              </div>
            </div>
          </div>

          {/* Whitelisted emails preview */}
          {allowedEmails.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-slate-400 text-[10px] uppercase block">Currently Authorized Emails:</span>
              <div className="bg-pokedex-darker p-2.5 rounded-xl border border-slate-800 max-h-24 overflow-y-auto space-y-1">
                {allowedEmails.map((email, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[11px] text-yellow-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setUnauthorizedModalOpen(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 text-xs transition-colors"
            >
              Continue in Read-Only
            </button>
            <button
              onClick={() => {
                logout();
                setUnauthorizedModalOpen(false);
              }}
              className="bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
