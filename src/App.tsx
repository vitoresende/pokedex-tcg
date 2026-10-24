import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogIn, RefreshCw, Sparkles } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CollectionProvider, useCollection } from './context/CollectionContext';
import { AccessGate } from './components/AccessGate';
import { PokedexHeader } from './components/PokedexHeader';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { PokedexPage } from './pages/PokedexPage';
import { NationalDexPage } from './pages/NationalDexPage';
import { DecksPage } from './pages/DecksPage';
import { RulesAndTypesPage } from './pages/RulesAndTypesPage';
import { AuthProfilePage } from './pages/AuthProfilePage';
import { checkForAppUpdate, forceAppUpdateAndClearCache, AppVersionInfo } from './services/versionService';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('pokedex');
  const [remoteUpdate, setRemoteUpdate] = useState<AppVersionInfo | null>(null);
  const { isReadOnly, sharedCollectionError, syncing } = useCollection();
  const { exitGuestMode } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await checkForAppUpdate();
      if (mounted && res.hasUpdate && res.remoteInfo) {
        setRemoteUpdate(res.remoteInfo);
      }
    };
    check();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    const interval = setInterval(check, 60000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleNavigateToDeck = (_deckId: string) => {
    setActiveTab('decks');
  };

  if (isReadOnly && syncing) {
    return (
      <div className="min-h-screen bg-pokedex-darker flex flex-col items-center justify-center p-4 text-white font-mono">
        <div className="relative w-20 h-20 rounded-full bg-white p-1.5 shadow-[0_0_30px_rgba(41,182,246,0.6)] flex items-center justify-center animate-pulse mb-6">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-300 via-pokedex-blue to-blue-700 flex items-center justify-center border-2 border-white">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <h2 className="font-display font-black text-xl uppercase tracking-widest">
          {t('accessGate.booting')}
        </h2>
        <p className="text-xs text-slate-400 mt-2">{t('common.loading')}</p>
      </div>
    );
  }

  if (isReadOnly && sharedCollectionError) {
    return (
      <div className="min-h-screen bg-pokedex-darker flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-700 via-pokedex-darkred to-red-900 px-6 py-4 flex items-center space-x-3 border-b-2 border-red-950">
            <div className="p-2.5 rounded-xl bg-black/40 border border-red-400/40 text-yellow-300 shadow-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="font-display font-black text-base uppercase tracking-wider text-white">
              {t('accessGate.invalidShareTitle')}
            </h2>
          </div>
          <div className="p-6 space-y-5 font-mono text-xs text-center">
            <p className="text-slate-300 font-sans leading-relaxed">
              {t('accessGate.invalidShareDesc')}
            </p>
            <button
              onClick={exitGuestMode}
              className="w-full bg-pokedex-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('accessGate.goToLoginBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pokedex-darker flex flex-col">
      {/* Dynamic Update Notification Banner for PWA and Mobile */}
      {remoteUpdate && (
        <div className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 text-slate-950 px-3 sm:px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-50 border-b border-yellow-500 font-mono text-xs animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2 font-bold truncate mr-2">
            <Sparkles className="w-4 h-4 text-pokedex-red shrink-0 animate-pulse" />
            <span className="truncate">
              {t('profile.updateBannerText', { version: remoteUpdate.version })}
            </span>
          </div>
          <button
            onClick={() => forceAppUpdateAndClearCache()}
            className="bg-black hover:bg-slate-800 text-yellow-300 font-bold px-3 py-1 rounded-lg text-xs uppercase shadow transition-all active:scale-95 shrink-0"
          >
            {t('profile.updateBannerBtn')}
          </button>
        </div>
      )}

      {/* Pokédex Top Device Header */}
      <PokedexHeader onNavigateToAuth={() => setActiveTab('auth')} />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'pokedex' && <PokedexPage onNavigateToDeck={handleNavigateToDeck} />}
        {activeTab === 'nationalDex' && <NationalDexPage onNavigateToDeck={handleNavigateToDeck} />}
        {activeTab === 'decks' && <DecksPage />}
        {activeTab === 'rules' && <RulesAndTypesPage />}
        {activeTab === 'auth' && <AuthProfilePage />}
      </main>

      {/* Tactile Mobile Bottom Bar */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AccessGate>
          <CollectionProvider>
            <MainLayout />
          </CollectionProvider>
        </AccessGate>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
