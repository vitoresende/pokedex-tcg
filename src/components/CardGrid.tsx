import React, { useState } from 'react';
import { Card } from '../types';
import { CardItem } from './CardItem';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { soundEffects } from '../services/audio';

interface CardGridProps {
  cards: Card[];
  onSelectCard: (card: Card) => void;
}

const ITEMS_PER_PAGE = 24;

export const CardGrid: React.FC<CardGridProps> = ({ cards, onSelectCard }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCards = cards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    soundEffects.playClick();
    setCurrentPage(page);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  if (cards.length === 0) {
    return (
      <div className="bg-pokedex-card/80 rounded-3xl border border-slate-800 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
          <Inbox className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-white">No Cards Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid of Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {paginatedCards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onSelect={onSelectCard}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4 pb-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
            className="p-2 rounded-xl bg-pokedex-card border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-4 py-1.5 rounded-xl bg-pokedex-darker border border-slate-800 text-xs font-mono font-bold text-yellow-300">
            Page {currentPage} of {totalPages} ({cards.length} Total)
          </span>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
            className="p-2 rounded-xl bg-pokedex-card border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
