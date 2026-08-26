import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CollectionProvider } from './context/CollectionContext';
import { PokedexHeader } from './components/PokedexHeader';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { UnauthorizedModal } from './components/UnauthorizedModal';
import { PokedexPage } from './pages/PokedexPage';
import { DecksPage } from './pages/DecksPage';
import { RulesAndTypesPage } from './pages/RulesAndTypesPage';
import { GrpcLearningHub } from './pages/GrpcLearningHub';
import { AuthProfilePage } from './pages/AuthProfilePage';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('pokedex');

  const handleNavigateToDeck = (deckId: string) => {
    setActiveTab('decks');
  };

  return (
    <div className="min-h-screen bg-pokedex-darker flex flex-col">
      {/* Pokédex Top Device Header */}
      <PokedexHeader onNavigateToAuth={() => setActiveTab('auth')} />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'pokedex' && <PokedexPage onNavigateToDeck={handleNavigateToDeck} />}
        {activeTab === 'decks' && <DecksPage />}
        {activeTab === 'rules' && <RulesAndTypesPage />}
        {activeTab === 'grpc' && <GrpcLearningHub />}
        {activeTab === 'auth' && <AuthProfilePage />}
      </main>

      {/* Tactile Mobile Bottom Bar */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Security Whitelist Notification Modal */}
      <UnauthorizedModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <MainLayout />
      </CollectionProvider>
    </AuthProvider>
  );
}

export default App;
