import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../context/CollectionContext';
import { 
  User, ShieldCheck, ShieldAlert, LogIn, LogOut, Cloud, 
  Terminal, Database, UploadCloud, CheckCircle2, Sparkles, AlertTriangle
} from 'lucide-react';
import { soundEffects } from '../services/audio';

export const AuthProfilePage: React.FC = () => {
  const { user, isAllowed, allowedEmails, loginWithGoogle, logout, loginAsDemoUser } = useAuth();
  const { stats, syncToCloud, syncing } = useCollection();
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  const handleSync = async () => {
    soundEffects.playClick();
    const success = await syncToCloud();
    if (success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* User Status Card */}
      <div className="bg-pokedex-card/95 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Treinador'} 
                  className="w-16 h-16 rounded-3xl object-cover border-2 border-white/40 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-pokedex-red text-white flex items-center justify-center font-display font-black text-2xl border-2 border-pokedex-darkred shadow-lg">
                  {user?.email ? user.email[0].toUpperCase() : <User className="w-8 h-8" />}
                </div>
              )}
              {user && (
                <span className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-slate-900 ${
                  isAllowed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {isAllowed ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-sans text-white">
                  {user ? (user.displayName || 'Treinador Pokémon') : 'Sessão Não Iniciada'}
                </h2>
                {user && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isAllowed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isAllowed ? 'Acesso Total' : 'Modo Visitante'}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {user ? user.email : 'Conecte sua conta do Google (Gmail) para gerenciar seu acervo'}
              </p>
            </div>
          </div>

          {/* Login / Logout Button */}
          <div>
            {user ? (
              <button
                onClick={logout}
                className="bg-slate-800 hover:bg-red-600/80 text-white font-bold px-5 py-2.5 rounded-2xl border border-slate-700 text-xs flex items-center space-x-2 transition-all active:scale-95 shadow"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold px-5 py-2.5 rounded-2xl border border-white/20 text-xs flex items-center space-x-2 transition-all active:scale-95 shadow-md shadow-pokedex-red/30"
              >
                <LogIn className="w-4 h-4 text-yellow-300" />
                <span>Entrar com Gmail (Google)</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Testing Switchers (Demo Mode) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase">Simulação para testes locais:</span>
          <button
            onClick={() => loginAsDemoUser(true)}
            className="bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl text-[11px] font-bold transition-colors"
          >
            Simular Login Autorizado (Whitelist OK)
          </button>
          <button
            onClick={() => loginAsDemoUser(false)}
            className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl text-[11px] font-bold transition-colors"
          >
            Simular Login Não Autorizado (Bloqueio)
          </button>
        </div>
      </div>

      {/* Whitelist Configuration Display */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-3 font-mono text-xs shadow-md">
        <div className="flex items-center space-x-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>E-mails Autorizados no .env (VITE_ALLOWED_EMAILS)</span>
        </div>
        <p className="text-slate-400 font-sans text-[11px]">
          Apenas usuários autenticados cujos e-mails estejam definidos nesta lista terão permissão de salvar no banco de dados.
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
            <div className="text-slate-400 italic">Nenhum e-mail especificado (modo aberto para testes).</div>
          )}
        </div>
      </div>

      {/* Cloud Firestore Collection Sync */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-pokedex-blue" />
            <h3 className="font-bold text-sm text-white font-mono uppercase">Sincronização em Nuvem (Cloud Firestore)</h3>
          </div>
          {syncSuccess && (
            <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Sincronizado com Sucesso!
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 font-sans">
          Envie as alterações de quantidades, notas pessoais e favoritos da sua coleção para a sua conta no Cloud Firestore.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing || !user || !isAllowed}
          className="w-full bg-pokedex-blue hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 text-xs font-mono uppercase"
        >
          <Cloud className="w-4 h-4" />
          <span>{syncing ? 'Sincronizando com Firestore...' : 'Sincronizar Acervo na Nuvem'}</span>
        </button>

        {!isAllowed && user && (
          <div className="text-amber-400 text-[11px] font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Adicione seu e-mail em VITE_ALLOWED_EMAILS para habilitar sincronização em nuvem.</span>
          </div>
        )}
      </div>

      {/* Firebase Storage Guide & CLI commands */}
      <div className="bg-pokedex-darker rounded-3xl border border-slate-800 p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-cyan-300 font-bold">
          <UploadCloud className="w-4 h-4" />
          <span>Script de Imagens & Firebase Storage</span>
        </div>
        <p className="text-slate-400 font-sans text-[11px]">
          Todas as 279 imagens de cartas do seu acervo já estão baixadas na pasta local <code className="bg-slate-800 text-yellow-300 px-1 py-0.5 rounded">public/cards/</code>.
        </p>

        <div className="bg-black/60 p-3 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
          <div className="text-slate-400"># 1. Para rodar o download de novas cartas novamente:</div>
          <div className="text-yellow-300">npm run download:cards</div>
          
          <div className="text-slate-400 pt-1"># 2. Para fazer o upload em massa para o seu Firebase Storage:</div>
          <div className="text-yellow-300">npm run upload:firebase &lt;seu-bucket.appspot.com&gt;</div>

          <div className="text-slate-400 pt-1"># 3. Para fazer o deploy da aplicação no Firebase Hosting:</div>
          <div className="text-yellow-300">firebase deploy</div>
        </div>
      </div>
    </div>
  );
};
