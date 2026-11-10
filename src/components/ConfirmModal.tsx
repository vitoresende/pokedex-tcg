import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    onCancel();
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    onConfirm();
  };

  return (
    <div
      onClick={handleCancel}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
      >
        {/* Top Pokédex Bezel */}
        <div className="bg-pokedex-red px-5 py-3 border-b-2 border-pokedex-darkred flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse shrink-0"></div>
            <span className="font-mono text-xs font-bold text-white tracking-widest uppercase truncate">
              {title}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label={t('common.close')}
            className="w-7 h-7 rounded-full bg-pokedex-darkred hover:bg-black/40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-white font-sans leading-snug break-words">
                {message}
              </h3>
              {description && (
                <p className="text-xs text-slate-400 font-mono leading-relaxed break-words">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 font-mono">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              {cancelLabel || t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-400/40 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-900/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>{confirmLabel || t('common.remove')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
