import React from 'react';
import { Layers, Sparkles, BookOpen, Server, User } from 'lucide-react';
import { soundEffects } from '../services/audio';

export type NavTab = 'pokedex' | 'decks' | 'rules' | 'grpc' | 'auth';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'pokedex' as NavTab, label: 'Pokédex', icon: Sparkles },
    { id: 'decks' as NavTab, label: 'Decks', icon: Layers },
    { id: 'rules' as NavTab, label: 'Rules & Types', icon: BookOpen },
    { id: 'grpc' as NavTab, label: 'gRPC Hub', icon: Server },
    { id: 'auth' as NavTab, label: 'Profile', icon: User },
  ];

  const handleSelect = (tab: NavTab) => {
    soundEffects.playClick();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-pokedex-darker/95 backdrop-blur-md border-t border-pokedex-border/60 pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-yellow-300 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Light */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-pokedex-red rounded-full shadow-[0_0_8px_rgba(220,10,45,0.9)]"></span>
              )}
              <div className={`p-1 rounded-lg ${isActive ? 'bg-pokedex-red/20 border border-pokedex-red/40' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-300' : 'text-slate-400'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
