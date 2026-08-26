import React from 'react';
import { useCollection } from '../context/CollectionContext';
import { FilterBar } from '../components/FilterBar';
import { CardGrid } from '../components/CardGrid';
import { CardDetailModal } from '../components/CardDetailModal';
import { Sparkles, Layers, ShieldCheck, Database, Award } from 'lucide-react';
import { Card } from '../types';

interface PokedexPageProps {
  onNavigateToDeck: (deckId: string) => void;
}

export const PokedexPage: React.FC<PokedexPageProps> = ({ onNavigateToDeck }) => {
  const { filteredCards, stats, selectedCard, setSelectedCard } = useCollection();

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Pokédex Status Deck Matrix / KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Owned */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-pokedex-red/20 text-pokedex-lightred border border-pokedex-red/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Acervo Total</span>
            <span className="text-lg font-black font-display text-white">{stats.totalOwnedCards} <small className="text-xs font-normal text-slate-400">cartas</small></span>
          </div>
        </div>

        {/* Unique Cards */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-pokedex-blue border border-blue-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Únicas Registradas</span>
            <span className="text-lg font-black font-display text-white">{stats.uniqueCardsCount} <small className="text-xs font-normal text-slate-400">/ 279</small></span>
          </div>
        </div>

        {/* Holographics / Foils */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Foil / Holo</span>
            <span className="text-lg font-black font-display text-yellow-300">{stats.foilCardsCount} <small className="text-xs font-normal text-yellow-500/80">brilhantes</small></span>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider">Progresso</span>
            <span className="text-emerald-400 font-bold">{stats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-700">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-mono mt-1 text-right">{stats.totalSetsCount} Coleções</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar />

      {/* Grid of Cards */}
      <CardGrid 
        cards={filteredCards} 
        onSelectCard={(card: Card) => setSelectedCard(card)} 
      />

      {/* Card Details Modal */}
      <CardDetailModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
        onNavigateToDeck={onNavigateToDeck}
      />
    </div>
  );
};
