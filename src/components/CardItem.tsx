import React from 'react';
import { Card } from '../types';
import { HoloCard } from './HoloCard';
import { Heart, Plus, Minus, Layers } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { soundEffects } from '../services/audio';

interface CardItemProps {
  card: Card;
  onSelect: (card: Card) => void;
}

export const CardItem: React.FC<CardItemProps> = ({ card, onSelect }) => {
  const { favorites, toggleFavorite, updateCardQuantity } = useCollection();
  const isFavorite = favorites.includes(card.id);

  const handleCardClick = () => {
    soundEffects.playClick();
    onSelect(card);
  };

  const handleQuantityDelta = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    updateCardQuantity(card.id, delta);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(card.id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative bg-pokedex-card/80 hover:bg-pokedex-card rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer shadow-md hover:shadow-pokedex-glow/20 flex flex-col justify-between ${
        card.quantity > 0 
          ? 'border-slate-700/80 hover:border-pokedex-blue/60' 
          : 'border-dashed border-red-500/30 opacity-75 grayscale-[40%]'
      }`}
    >
      {/* Card Visual / 3D Art */}
      <div className="aspect-[2.5/3.5] w-full relative mb-2">
        <HoloCard card={card} className="w-full h-full" />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-2 left-2 z-30 p-1.5 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
            isFavorite 
              ? 'bg-red-500/90 text-white shadow-md' 
              : 'bg-black/60 text-slate-300 hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quantity Badge */}
        <div className={`absolute bottom-2 right-2 z-30 px-2 py-0.5 rounded-full text-xs font-mono font-black backdrop-blur-md border shadow-md flex items-center gap-1 ${
          card.quantity > 0 
            ? 'bg-slate-900/90 text-yellow-300 border-yellow-400/40' 
            : 'bg-red-950/90 text-red-300 border-red-500/40'
        }`}>
          <span>x{card.quantity}</span>
        </div>

        {/* Deck Badges */}
        {card.decks && card.decks.length > 0 && (
          <div className="absolute bottom-2 left-2 z-30 flex items-center space-x-1">
            <span className="bg-purple-900/90 border border-purple-400/40 text-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow">
              <Layers className="w-2.5 h-2.5" />
              <span>D{card.decks.map(d => d.replace('deck-', '')).join(',')}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Information */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-bold text-xs text-white truncate group-hover:text-pokedex-cyan transition-colors" title={card.name_en || card.name_pt}>
            {card.name_en || card.name_pt}
          </h3>
          <span 
            className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0"
            style={{ 
              backgroundColor: `${card.color_bg}22`,
              color: card.color_bg,
              borderColor: `${card.color_bg}55`
            }}
          >
            {card.color_name}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="truncate max-w-[90px]">{card.set_en || card.set_pt}</span>
          <span className="bg-slate-800 px-1 rounded text-slate-300">#{card.card_number}</span>
        </div>

        {/* Quick Quantity Modifier */}
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            {card.rarity_name}
          </span>
          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => handleQuantityDelta(e, -1)}
              disabled={card.quantity <= 0}
              aria-label="Decrease quantity"
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 flex items-center justify-center text-xs active:scale-95 transition-all"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center font-mono font-bold text-xs text-yellow-300">
              {card.quantity}
            </span>
            <button
              onClick={(e) => handleQuantityDelta(e, 1)}
              aria-label="Increase quantity"
              className="w-6 h-6 rounded bg-pokedex-blue/80 hover:bg-pokedex-blue text-white flex items-center justify-center text-xs active:scale-95 transition-all shadow"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
