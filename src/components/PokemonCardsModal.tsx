import React, { useEffect } from 'react';
import { X, Sparkles, Layers, Plus, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';
import { Card, NationalPokemon } from '../types';
import { CardItem } from './CardItem';
import { PokemonTypeIcon } from './PokemonTypeIcon';
import { useLanguage } from '../context/LanguageContext';
import { useCollection } from '../context/CollectionContext';
import { soundEffects } from '../services/audio';

interface PokemonCardsModalProps {
  pokemon: NationalPokemon | null;
  ownedCards: Card[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
  onAddCardForPokemon?: (pokemonName: string) => void;
}

const REGION_MAP: Record<number, string> = {
  1: 'Kanto',
  2: 'Johto',
  3: 'Hoenn',
  4: 'Sinnoh',
  5: 'Unova',
  6: 'Kalos',
  7: 'Alola',
  8: 'Galar',
  9: 'Paldea',
};

const TYPE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  grass: { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-600/40' },
  poison: { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-600/40' },
  fire: { bg: 'bg-red-900/40', text: 'text-red-300', border: 'border-red-600/40' },
  water: { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-600/40' },
  electric: { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-600/40' },
  lightning: { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-600/40' },
  bug: { bg: 'bg-lime-900/40', text: 'text-lime-300', border: 'border-lime-600/40' },
  normal: { bg: 'bg-stone-800/60', text: 'text-stone-300', border: 'border-stone-600/40' },
  ground: { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-600/40' },
  fairy: { bg: 'bg-pink-900/40', text: 'text-pink-300', border: 'border-pink-600/40' },
  fighting: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-600/40' },
  psychic: { bg: 'bg-fuchsia-900/40', text: 'text-fuchsia-300', border: 'border-fuchsia-600/40' },
  rock: { bg: 'bg-stone-900/60', text: 'text-stone-400', border: 'border-stone-700/40' },
  ghost: { bg: 'bg-indigo-900/50', text: 'text-indigo-300', border: 'border-indigo-600/40' },
  ice: { bg: 'bg-cyan-900/40', text: 'text-cyan-300', border: 'border-cyan-600/40' },
  dragon: { bg: 'bg-violet-900/50', text: 'text-violet-300', border: 'border-violet-600/40' },
  dark: { bg: 'bg-zinc-900/80', text: 'text-zinc-300', border: 'border-zinc-700/50' },
  darkness: { bg: 'bg-zinc-900/80', text: 'text-zinc-300', border: 'border-zinc-700/50' },
  steel: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-600/40' },
  metal: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-600/40' },
  flying: { bg: 'bg-sky-900/40', text: 'text-sky-300', border: 'border-sky-600/40' },
};

export const PokemonCardsModal: React.FC<PokemonCardsModalProps> = ({
  pokemon,
  ownedCards,
  isOpen,
  onClose,
  onSelectCard,
  onAddCardForPokemon,
}) => {
  const { t } = useLanguage();
  const { isReadOnly } = useCollection();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pokemon) return null;

  const totalCopies = ownedCards.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalFoils = ownedCards.filter((c) => c.is_foil).length;
  const isOwned = ownedCards.length > 0 && totalCopies > 0;
  const regionName = REGION_MAP[pokemon.generation] || `Gen ${pokemon.generation}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 pb-20 sm:pb-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-pokedex-screen border-2 sm:border-4 border-pokedex-border rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-700 via-pokedex-red to-red-900 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b-2 border-red-950/60 shadow-md">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-black text-xs sm:text-sm bg-black/40 px-2.5 py-1 rounded-lg border border-white/20 text-yellow-300">
              #{pokemon.number}
            </span>
            <h2 className="font-display font-black text-lg sm:text-2xl uppercase tracking-wider text-white drop-shadow">
              {pokemon.name}
            </h2>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            aria-label={t('common.close')}
            className="p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-black/50 text-slate-200 hover:text-white transition-all active:scale-90 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Top Info Banner: Artwork & Dex Metadata */}
          <div className="bg-pokedex-darker/90 rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row items-center gap-5 shadow-lg">
            {/* Pokemon Artwork */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700 p-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                {/* Glow ring */}
                <div className="absolute inset-0 bg-radial-gradient from-yellow-400/10 via-transparent to-transparent pointer-events-none" />
                <img
                  src={pokemon.artwork_url}
                  alt={pokemon.name}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to sprite if artwork fails
                    (e.target as HTMLImageElement).src = pokemon.sprite_url;
                  }}
                  className={`w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105 ${
                    !isOwned ? 'grayscale-[35%] opacity-80' : ''
                  }`}
                />
              </div>

              {/* Owned Pokeball Badge */}
              {isOwned ? (
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-md flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-200" />
                  <span>{t('nationalDex.statusOwned')}</span>
                </div>
              ) : (
                <div className="absolute -bottom-2 -right-2 bg-slate-700 text-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-md flex items-center space-x-1">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <span>{t('nationalDex.statusMissing')}</span>
                </div>
              )}
            </div>

            {/* Pokemon Metadata */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-mono font-bold bg-slate-800 text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-700">
                  Gen {pokemon.generation} • {regionName}
                </span>

                {/* Types */}
                <div className="flex items-center gap-1.5">
                  {pokemon.types.map((type) => {
                    const colorScheme = TYPE_COLOR_MAP[type.toLowerCase()] || {
                      bg: 'bg-slate-800',
                      text: 'text-slate-200',
                      border: 'border-slate-700',
                    };
                    return (
                      <span
                        key={type}
                        className={`inline-flex items-center space-x-1 text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-lg border ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border}`}
                      >
                        <PokemonTypeIcon type={type} size="xs" />
                        <span>{type}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Summary Statement */}
              {isOwned ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs font-mono space-y-1">
                  <p className="text-emerald-300 font-semibold flex items-center justify-center md:justify-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>
                      {t('nationalDex.modalOwnedSummary', {
                        cardCount: ownedCards.length,
                        cardLabel: ownedCards.length === 1 ? t('common.cards').replace(/s$/, '') : t('common.cards'),
                        copyCount: totalCopies,
                        copyLabel: totalCopies === 1 ? t('nationalDex.copiesCount', { count: 1 }).replace('1 ', '') : t('nationalDex.copiesCount', { count: totalCopies }).replace(`${totalCopies} `, ''),
                      })}
                    </span>
                  </p>
                  {totalFoils > 0 && (
                    <p className="text-yellow-300/80 text-[11px]">
                      ✨ {totalFoils} {totalFoils === 1 ? 'carta brilhante (foil/holo)' : 'cartas brilhantes (foil/holo)'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs font-mono space-y-2">
                  <p className="text-slate-400">
                    {t('nationalDex.modalEmptyDesc', { name: pokemon.name })}
                  </p>
                  {!isReadOnly && onAddCardForPokemon && (
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        onClose();
                        onAddCardForPokemon(pokemon.name);
                      }}
                      className="bg-pokedex-blue hover:bg-blue-600 text-white font-mono font-bold text-xs py-1.5 px-3 rounded-lg shadow transition-all active:scale-95 flex items-center space-x-1.5 mx-auto md:mx-0 border border-blue-400/30"
                    >
                      <Plus className="w-3.5 h-3.5 text-yellow-300" />
                      <span>{t('nationalDex.addCardForThis', { name: pokemon.name })}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Owned Cards Grid */}
          {ownedCards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-display font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pokedex-blue" />
                  <span>{t('nationalDex.modalTitle', { name: pokemon.name })} ({ownedCards.length})</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {t('nationalDex.viewCardDetails')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ownedCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onSelect={(c) => {
                      soundEffects.playClick();
                      onSelectCard(c);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
