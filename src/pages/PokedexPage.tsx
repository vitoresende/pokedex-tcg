import React, { useState } from 'react';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { FilterBar } from '../components/FilterBar';
import { CardGrid } from '../components/CardGrid';
import { CardDetailModal } from '../components/CardDetailModal';
import { AddCardModal } from '../components/AddCardModal';
import { Sparkles, Database, Award, Plus } from 'lucide-react';
import { Card } from '../types';
import { soundEffects } from '../services/audio';

interface PokedexPageProps {
  onNavigateToDeck: (deckId: string) => void;
}

export const PokedexPage: React.FC<PokedexPageProps> = ({ onNavigateToDeck }) => {
  const { filteredCards, stats, selectedCard, setSelectedCard, isReadOnly } = useCollection();
  const { t } = useLanguage();
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);

  const handleOpenAddModal = () => {
    if (isReadOnly) return;
    soundEffects.playClick();
    setAddCardModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Pokédex Header Actions: Add Cards / Import CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span>{t('pokedex.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {t('pokedex.subtitle', { count: filteredCards.length })}
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={handleOpenAddModal}
            className="bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold px-4 py-2 rounded-2xl shadow-lg transition-all active:scale-95 text-xs font-mono flex items-center justify-center space-x-2 border border-white/20"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>{t('pokedex.addCardsBtn')}</span>
          </button>
        )}
      </div>

      {/* Pokédex Status Deck Matrix / KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Owned */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-2.5 sm:space-x-3 shadow-md min-w-0 overflow-hidden">
          <div className="p-2 sm:p-2.5 rounded-xl bg-pokedex-red/20 text-pokedex-lightred border border-pokedex-red/30 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">{t('pokedex.totalOwned')}</span>
            <span className="text-base sm:text-lg font-black font-display text-white truncate block">{stats.totalOwnedCards} <small className="text-xs font-normal text-slate-400">{t('common.cards')}</small></span>
          </div>
        </div>

        {/* Unique Cards */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-2.5 sm:space-x-3 shadow-md min-w-0 overflow-hidden">
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/20 text-pokedex-blue border border-blue-500/30 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">{t('pokedex.uniqueRegistered')}</span>
            <span className="text-base sm:text-lg font-black font-display text-white truncate block">{stats.uniqueCardsCount} <small className="text-xs font-normal text-slate-400">{t('common.cards')}</small></span>
          </div>
        </div>

        {/* Holographics / Foils */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-2.5 sm:space-x-3 shadow-md min-w-0 overflow-hidden">
          <div className="p-2 sm:p-2.5 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">{t('pokedex.foilHolo')}</span>
            <span className="text-base sm:text-lg font-black font-display text-yellow-300 truncate block">{stats.foilCardsCount} <small className="text-xs font-normal text-yellow-500/80">{t('common.shining')}</small></span>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex flex-col justify-between shadow-md min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono min-w-0">
            <span className="text-slate-400 uppercase tracking-wider truncate">{t('pokedex.completion')}</span>
            <span className="text-emerald-400 font-bold shrink-0">{stats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-700">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-mono mt-1 text-right truncate">{stats.totalSetsCount} {t('common.sets')}</span>
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

      {/* Add Card / Import CSV Modal */}
      <AddCardModal
        isOpen={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
      />
    </div>
  );
};
