import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Search, X, ShieldCheck, HelpCircle, Layers, 
  ArrowUpDown, Filter, ChevronDown, CheckCircle2, Award 
} from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { NationalPokemon, Card } from '../types';
import nationalPokemonData from '../data/pokemon_national.json';
import { buildPokemonCardsMap, normalizePokemonName } from '../utils/nationalPokemonMatcher';
import { PokemonTypeIcon } from '../components/PokemonTypeIcon';
import { PokemonCardsModal } from '../components/PokemonCardsModal';
import { CardDetailModal } from '../components/CardDetailModal';
import { AddCardModal } from '../components/AddCardModal';
import { soundEffects } from '../services/audio';

const POKEMON_LIST: NationalPokemon[] = nationalPokemonData as NationalPokemon[];

const GENERATIONS = [
  { gen: 1, region: 'Kanto', range: '#0001 - #0151' },
  { gen: 2, region: 'Johto', range: '#0152 - #0251' },
  { gen: 3, region: 'Hoenn', range: '#0252 - #0386' },
  { gen: 4, region: 'Sinnoh', range: '#0387 - #0493' },
  { gen: 5, region: 'Unova', range: '#0494 - #0649' },
  { gen: 6, region: 'Kalos', range: '#0650 - #0721' },
  { gen: 7, region: 'Alola', range: '#0722 - #0809' },
  { gen: 8, region: 'Galar', range: '#0810 - #0905' },
  { gen: 9, region: 'Paldea', range: '#0906 - #1025' },
];

const ALL_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

interface NationalDexPageProps {
  onNavigateToDeck: (deckId: string) => void;
}

export const NationalDexPage: React.FC<NationalDexPageProps> = ({ onNavigateToDeck }) => {
  const { cards, selectedCard, setSelectedCard } = useCollection();
  const { t } = useLanguage();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [selectedGen, setSelectedGen] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number-asc' | 'number-desc' | 'name-asc' | 'owned-first'>('number-asc');

  // Pagination / Batch Rendering for high performance
  const [visibleCount, setVisibleCount] = useState<number>(72);

  // Modals
  const [selectedPokemon, setSelectedPokemon] = useState<NationalPokemon | null>(null);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [addCardInitialName, setAddCardInitialName] = useState<string>('');

  // Precomputed index map of pokemonId -> Card[]
  const pokemonCardsMap = useMemo(() => {
    return buildPokemonCardsMap(cards);
  }, [cards]);

  // Overall Statistics
  const { ownedCount, missingCount, completionPercent, totalOwnedCardsCount } = useMemo(() => {
    let owned = 0;
    let totalCardsCount = 0;

    for (const p of POKEMON_LIST) {
      const pCards = pokemonCardsMap.get(p.id) || [];
      const hasAnyOwned = pCards.some((c) => (c.quantity || 0) > 0);
      if (hasAnyOwned) {
        owned++;
        totalCardsCount += pCards.reduce((sum, c) => sum + (c.quantity || 0), 0);
      }
    }

    const missing = 1025 - owned;
    const percent = ((owned / 1025) * 100).toFixed(1);

    return {
      ownedCount: owned,
      missingCount: missing,
      completionPercent: percent,
      totalOwnedCardsCount: totalCardsCount,
    };
  }, [pokemonCardsMap]);

  // Filtered and Sorted Pokémon List
  const filteredPokemon = useMemo(() => {
    const query = normalizePokemonName(searchQuery);

    return POKEMON_LIST.filter((p) => {
      // 1. Ownership Filter
      const pCards = pokemonCardsMap.get(p.id) || [];
      const isOwned = pCards.some((c) => (c.quantity || 0) > 0);

      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'missing' && isOwned) return false;

      // 2. Generation Filter
      if (selectedGen !== 'all' && p.generation !== selectedGen) return false;

      // 3. Type Filter
      if (selectedType !== 'all' && !p.types.includes(selectedType.toLowerCase())) return false;

      // 4. Search Filter (by name or number e.g. "0025" or "25")
      if (query) {
        const matchesName = normalizePokemonName(p.name).includes(query);
        const matchesNumber = p.number.includes(query) || String(p.id) === query.replace(/^0+/, '');
        if (!matchesName && !matchesNumber) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'number-asc') {
        return a.id - b.id;
      }
      if (sortBy === 'number-desc') {
        return b.id - a.id;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'owned-first') {
        const aCards = pokemonCardsMap.get(a.id) || [];
        const bCards = pokemonCardsMap.get(b.id) || [];
        const aOwned = aCards.some((c) => (c.quantity || 0) > 0);
        const bOwned = bCards.some((c) => (c.quantity || 0) > 0);

        if (aOwned && !bOwned) return -1;
        if (!aOwned && bOwned) return 1;
        return a.id - b.id;
      }
      return a.id - b.id;
    });
  }, [searchQuery, ownershipFilter, selectedGen, selectedType, sortBy, pokemonCardsMap]);

  const displayedPokemon = useMemo(() => {
    return filteredPokemon.slice(0, visibleCount);
  }, [filteredPokemon, visibleCount]);

  const handleSelectPokemon = (pokemon: NationalPokemon) => {
    soundEffects.playClick();
    setSelectedPokemon(pokemon);
  };

  const handleOpenAddCardForPokemon = (pokemonName: string) => {
    setAddCardInitialName(pokemonName);
    setAddCardModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white flex items-center gap-2">
            <span className="p-1 rounded-xl bg-pokedex-red text-white shadow-md inline-flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h7" />
                <path d="M15 12h7" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </span>
            <span>{t('nationalDex.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {t('nationalDex.subtitle')}
          </p>
        </div>
      </div>

      {/* KPI Status Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Pokemons Captured / Owned */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              {t('nationalDex.obtained')}
            </span>
            <span className="text-lg font-black font-display text-emerald-400">
              {ownedCount}{' '}
              <small className="text-xs font-normal text-slate-400">/ 1025</small>
            </span>
          </div>
        </div>

        {/* Missing Pokémon */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              {t('nationalDex.missing')}
            </span>
            <span className="text-lg font-black font-display text-slate-300">
              {missingCount}{' '}
              <small className="text-xs font-normal text-slate-500">restantes</small>
            </span>
          </div>
        </div>

        {/* Total Pokémon Cards in Collection */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-pokedex-blue border border-blue-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              {t('nationalDex.totalCardsInCollection')}
            </span>
            <span className="text-lg font-black font-display text-white">
              {totalOwnedCardsCount}{' '}
              <small className="text-xs font-normal text-slate-400">{t('common.cards')}</small>
            </span>
          </div>
        </div>

        {/* Completion Progress Gauge */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider">
              {t('nationalDex.completion')}
            </span>
            <span className="text-yellow-300 font-bold">{completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-1.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-mono mt-1 text-right">
            {ownedCount} de 1025 Pokémon
          </span>
        </div>
      </div>

      {/* Filter and Control Matrix */}
      <div className="bg-pokedex-card/90 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-3">
        {/* Search Input & Quick Ownership Tabs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nationalDex.searchPlaceholder')}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-pokedex-blue transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Ownership Segment Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                ownershipFilter === 'all'
                  ? 'bg-pokedex-blue text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('nationalDex.filterAll')}
            </button>
            <button
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('owned');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                ownershipFilter === 'owned'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('nationalDex.filterOwned', { count: ownedCount })}</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('missing');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                ownershipFilter === 'missing'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-red-400/80 hover:text-red-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('nationalDex.filterMissing', { count: missingCount })}</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Generation, Type, and Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Generation Select */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-2 shrink-0">Gen:</span>
            <select
              value={selectedGen}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedGen(val);
              }}
              className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                {t('nationalDex.allGenerations')}
              </option>
              {GENERATIONS.map((g) => (
                <option key={g.gen} value={g.gen} className="bg-slate-900 text-white">
                  Gen {g.gen} ({g.region} • {g.range})
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-2 shrink-0">Tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer capitalize"
            >
              <option value="all" className="bg-slate-900 text-white">
                {t('nationalDex.allTypes')}
              </option>
              {ALL_TYPES.map((type) => (
                <option key={type} value={type} className="bg-slate-900 text-white capitalize">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown (Default: Number Ascending) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="number-asc" className="bg-slate-900 text-white">
                {t('nationalDex.sortNumberAsc')}
              </option>
              <option value="number-desc" className="bg-slate-900 text-white">
                {t('nationalDex.sortNumberDesc')}
              </option>
              <option value="name-asc" className="bg-slate-900 text-white">
                {t('nationalDex.sortNameAsc')}
              </option>
              <option value="owned-first" className="bg-slate-900 text-white">
                {t('nationalDex.sortOwnedFirst')}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>
          {t('nationalDex.showingCount', {
            count: Math.min(visibleCount, filteredPokemon.length),
            total: filteredPokemon.length,
          })}
        </span>
        {ownershipFilter !== 'all' && (
          <span className="text-yellow-300/80">
            Filtro ativo: {ownershipFilter === 'owned' ? 'Obtidos' : 'Faltando'}
          </span>
        )}
      </div>

      {/* Grid of National Pokémon */}
      {filteredPokemon.length === 0 ? (
        <div className="bg-pokedex-card/60 rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-display font-black text-lg text-white">
            Nenhum Pokémon encontrado
          </h3>
          <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
            Tente ajustar os filtros de busca, geração ou tipo para encontrar o que procura.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayedPokemon.map((pokemon) => {
            const pCards = pokemonCardsMap.get(pokemon.id) || [];
            const totalCopies = pCards.reduce((acc, c) => acc + (c.quantity || 0), 0);
            const isOwned = pCards.length > 0 && totalCopies > 0;

            return (
              <div
                key={pokemon.id}
                onClick={() => handleSelectPokemon(pokemon)}
                className={`group relative bg-pokedex-card/80 hover:bg-pokedex-card rounded-2xl p-3 border transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between select-none ${
                  isOwned
                    ? 'border-emerald-600/50 hover:border-emerald-400/80 bg-gradient-to-b from-emerald-950/20 via-pokedex-card to-pokedex-card hover:scale-[1.02]'
                    : 'border-slate-800 hover:border-slate-600 opacity-75 hover:opacity-100 grayscale-[40%] hover:grayscale-0'
                }`}
              >
                {/* Header: National Number & Owned Indicator */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-mono font-bold text-[11px] text-yellow-300 bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                    #{pokemon.number}
                  </span>

                  {isOwned ? (
                    <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded-full shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{pCards.length} {pCards.length === 1 ? 'carta' : 'cartas'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-mono font-bold text-slate-400 bg-slate-900/80 border border-slate-700 px-1.5 py-0.5 rounded-full">
                      Faltando
                    </span>
                  )}
                </div>

                {/* Pokemon Artwork */}
                <div className="aspect-square w-full relative flex items-center justify-center p-2 my-1 overflow-hidden rounded-xl bg-slate-950/40 border border-slate-800/60 group-hover:border-slate-700/80 transition-colors">
                  <img
                    src={pokemon.artwork_url}
                    alt={pokemon.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = pokemon.sprite_url;
                    }}
                    className={`w-full h-full object-contain drop-shadow transition-transform duration-300 group-hover:scale-110 ${
                      !isOwned ? 'opacity-70' : ''
                    }`}
                  />
                </div>

                {/* Footer: Name & Type Icons */}
                <div className="space-y-1.5 mt-1 text-center">
                  <h4 className="font-display font-black text-xs sm:text-sm text-white truncate drop-shadow-sm group-hover:text-yellow-300 transition-colors">
                    {pokemon.name}
                  </h4>

                  <div className="flex items-center justify-center gap-1">
                    {pokemon.types.map((type) => (
                      <span
                        key={type}
                        title={type}
                        className="inline-flex items-center text-[9px] font-mono font-bold uppercase text-slate-300 bg-slate-800/90 border border-slate-700 px-1.5 py-0.5 rounded-md"
                      >
                        <PokemonTypeIcon type={type} size="xs" className="mr-0.5" />
                        <span className="hidden sm:inline">{type}</span>
                      </span>
                    ))}
                  </div>

                  {/* Quantity Owned Footer Pill */}
                  {isOwned && (
                    <div className="pt-0.5">
                      <span className="text-[10px] font-mono text-emerald-400/90 font-medium">
                        {totalCopies} {totalCopies === 1 ? 'cópia obtida' : 'cópias obtidas'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < filteredPokemon.length && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => {
              soundEffects.playClick();
              setVisibleCount((prev) => Math.min(prev + 72, filteredPokemon.length));
            }}
            className="w-full sm:w-auto bg-pokedex-blue hover:bg-blue-600 text-white font-mono font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 border border-blue-400/30 flex items-center justify-center space-x-2"
          >
            <span>{t('nationalDex.loadMore')} (+72)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setVisibleCount(filteredPokemon.length);
            }}
            className="text-xs font-mono text-slate-400 hover:text-white underline decoration-slate-600"
          >
            Ver todos ({filteredPokemon.length})
          </button>
        </div>
      )}

      {/* Pokemon Owned Cards Modal */}
      <PokemonCardsModal
        pokemon={selectedPokemon}
        ownedCards={selectedPokemon ? pokemonCardsMap.get(selectedPokemon.id) || [] : []}
        isOpen={Boolean(selectedPokemon)}
        onClose={() => setSelectedPokemon(null)}
        onSelectCard={(card: Card) => setSelectedCard(card)}
        onAddCardForPokemon={handleOpenAddCardForPokemon}
      />

      {/* Card Details Modal (when user clicks a specific card in the Pokemon modal) */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onNavigateToDeck={onNavigateToDeck}
      />

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
        initialName={addCardInitialName}
      />
    </div>
  );
};
