import React from 'react';
import { ShieldAlert, X, LogOut, Terminal, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../services/audio';

export const UnauthorizedModal: React.FC = () => {
  const { user, unauthorizedModalOpen, setUnauthorizedModalOpen, logout, allowedEmails } = useAuth();

  if (!unauthorizedModalOpen) return null;

  const handleClose = () => {
    soundEffects.playClick();
    setUnauthorizedModalOpen(false);
  };

  const handleLogout = async () => {
    soundEffects.playClick();
    setUnauthorizedModalOpen(false);
    await logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-pokedex-screen border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6">
        {/* Header Alert */}
        <div className="flex items-center space-x-3 mb-4 text-amber-400">
          <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40">
            <ShieldAlert className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Acesso Restrito: E-mail Não Autorizado</h3>
            <p className="text-xs text-amber-300 font-mono">Verificação de Segurança Firebase Auth</p>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-4 text-xs text-slate-300 font-sans leading-relaxed">
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 font-mono">
            <div className="text-slate-400">E-mail conectado via Gmail:</div>
            <div className="text-amber-300 font-bold text-sm mt-0.5 break-all">
              {user?.email || 'Nenhum e-mail detectado'}
            </div>
          </div>

          <p>
            O seu e-mail foi autenticado com sucesso via Google OAuth, porém <strong>não consta na lista de permissões</strong> definida na variável de ambiente <code className="bg-slate-800 text-yellow-300 px-1 py-0.5 rounded font-mono">VITE_ALLOWED_EMAILS</code> do projeto.
          </p>

          {/* Instructions to authorize */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2 font-mono text-[11px]">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold">
              <Terminal className="w-4 h-4" />
              <span>Como liberar este e-mail no projeto:</span>
            </div>
            <p className="text-slate-400">
              Adicione o seu e-mail no arquivo <span className="text-white font-bold">.env</span> na raiz:
            </p>
            <div className="bg-black/60 p-2 rounded-lg text-yellow-300 overflow-x-auto">
              VITE_ALLOWED_EMAILS={allowedEmails.length ? allowedEmails.join(',') + ',' : ''}{user?.email || 'seu-email@gmail.com'}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Enquanto não estiver na lista autorizada, você pode visualizar todo o catálogo e guias em modo de <strong>Leitura (Convidado)</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Continuar como Visitante</span>
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Desconectar Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
