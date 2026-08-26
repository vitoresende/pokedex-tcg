import React, { useState } from 'react';
import { Card } from '../types';
import { CardItem } from './CardItem';
import { ChevronLeft, ChevronRight, Sparkles, FilterX } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { soundEffects } from '../services/audio';

interface CardGridProps {
  cards: Card[];
  onSelectCard: (card: Card) => void;
}

const ITEMS_PER_PAGE = 24;

export const CardGrid: React.FC<CardGridProps> = ({ cards, onSelectCard }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { resetFilters } = useCollection();

  const totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedCards = cards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    soundEffects.playClick();
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (cards.length === 0) {
    return (
      <div className="py-16 px-4 text-center bg-pokedex-card/60 rounded-3xl border border-slate-800 my-6">
        <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <FilterX className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Nenhuma carta encontrada</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
          Nenhum registro corresponde aos filtros ou termo de busca aplicado.
        </p>
        <button
          onClick={resetFilters}
          className="bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
        >
          Limpar Filtros
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {displayedCards.map((card) => (
          <CardItem key={card.id} card={card} onSelect={onSelectCard} />
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-pokedex-card/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-xs font-mono">
          <div className="text-slate-400">
            Mostrando <span className="text-white font-bold">{startIndex + 1}</span> - <span className="text-white font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, cards.length)}</span> de <span className="text-yellow-300 font-bold">{cards.length}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-pokedex-darker text-yellow-300 font-bold rounded-lg border border-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
