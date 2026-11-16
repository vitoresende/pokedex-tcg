import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Search, X, ShieldCheck, HelpCircle, Layers, 
  ArrowUpDown, Filter, ChevronDown, CheckCircle2, Award, 
  CircleDollarSign, Star, BarChart2 
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

export interface GenerationStats {
  gen: number;
  region: string;
  range: string;
  totalCount: number;
  ownedCount: number;
  missingCount: number;
  completionPercent: string;
  totalCardsCount: number;
  totalDeckValue: number;
  deckSelectedCount: number;
  deckSelectedPokemonsCount: number;
  deckValuedPokemonsCount: number;
}

interface NationalDexPageProps {
  onNavigateToDeck: (deckId: string) => void;
}

export const NationalDexPage: React.FC<NationalDexPageProps> = ({ onNavigateToDeck }) => {
  const { cards, selectedCard, setSelectedCard } = useCollection();
  const { t, language } = useLanguage();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'missing' | 'deck'>('all');
  const [selectedGen, setSelectedGen] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number-asc' | 'number-desc' | 'name-asc' | 'owned-first'>('number-asc');

  // Pagination / Batch Rendering for high performance
  const [visibleCount, setVisibleCount] = useState<number>(72);

  // Modals
  const [selectedPokemon, setSelectedPokemon] = useState<NationalPokemon | null>(null);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [addCardInitialName, setAddCardInitialName] = useState<string>('');
  const [showGenOverviewModal, setShowGenOverviewModal] = useState(false);

  // Precomputed index map of pokemonId -> Card[]
  const pokemonCardsMap = useMemo(() => {
    return buildPokemonCardsMap(cards);
  }, [cards]);

  // Overall and Per-Generation Statistics including Main Cards Value
  const { nationalStats, generationStatsMap } = useMemo(() => {
    let owned = 0;
    let totalCardsCount = 0;
    let deckValueSum = 0;
    let selectedCount = 0;
    let selectedPokemonsCount = 0;
    let valuedCount = 0;
    const countedMainCardIds = new Set<string>();

    const genMap = new Map<number, GenerationStats>();
    for (const g of GENERATIONS) {
      genMap.set(g.gen, {
        gen: g.gen,
        region: g.region,
        range: g.range,
        totalCount: 0,
        ownedCount: 0,
        missingCount: 0,
        completionPercent: '0.0',
        totalCardsCount: 0,
        totalDeckValue: 0,
        deckSelectedCount: 0,
        deckSelectedPokemonsCount: 0,
        deckValuedPokemonsCount: 0,
      });
    }

    const genCountedMainCardIds = new Map<number, Set<string>>();
    for (const g of GENERATIONS) {
      genCountedMainCardIds.set(g.gen, new Set<string>());
    }

    for (const p of POKEMON_LIST) {
      const gStats = genMap.get(p.generation);
      if (gStats) {
        gStats.totalCount++;
      }

      const pCards = pokemonCardsMap.get(p.id) || [];
      const hasAnyOwned = pCards.some((c) => (c.quantity || 0) > 0);
      const cardsQuantitySum = pCards.reduce((sum, c) => sum + (c.quantity || 0), 0);

      if (hasAnyOwned) {
        owned++;
        totalCardsCount += cardsQuantitySum;
        if (gStats) {
          gStats.ownedCount++;
          gStats.totalCardsCount += cardsQuantitySum;
        }
      }

      // Check all main cards for this pokemon (supports multiple main cards per Pokémon)
      const mainCards = pCards.filter((c) => c.is_deck_card);
      if (mainCards.length > 0) {
        selectedPokemonsCount++;
        if (gStats) {
          gStats.deckSelectedPokemonsCount++;
        }

        for (const mc of mainCards) {
          if (!countedMainCardIds.has(mc.id)) {
            countedMainCardIds.add(mc.id);
            selectedCount++;
            const priceNum = mc.price !== undefined && mc.price !== null ? Number(mc.price) : 0;
            if (!isNaN(priceNum) && priceNum > 0) {
              deckValueSum += priceNum;
              valuedCount++;
            }
          }

          if (gStats) {
            const genCardSet = genCountedMainCardIds.get(p.generation);
            if (genCardSet && !genCardSet.has(mc.id)) {
              genCardSet.add(mc.id);
              gStats.deckSelectedCount++;
              const priceNum = mc.price !== undefined && mc.price !== null ? Number(mc.price) : 0;
              if (!isNaN(priceNum) && priceNum > 0) {
                gStats.totalDeckValue += priceNum;
                gStats.deckValuedPokemonsCount++;
              }
            }
          }
        }
      }
    }

    for (const g of GENERATIONS) {
      const gStats = genMap.get(g.gen);
      if (gStats) {
        gStats.missingCount = Math.max(0, gStats.totalCount - gStats.ownedCount);
        gStats.completionPercent = gStats.totalCount > 0
          ? ((gStats.ownedCount / gStats.totalCount) * 100).toFixed(1)
          : '0.0';
      }
    }

    const missing = Math.max(0, 1025 - owned);
    const percent = ((owned / 1025) * 100).toFixed(1);

    const national: GenerationStats = {
      gen: 0,
      region: 'Nacional',
      range: '#0001 - #1025',
      totalCount: 1025,
      ownedCount: owned,
      missingCount: missing,
      completionPercent: percent,
      totalCardsCount,
      totalDeckValue: deckValueSum,
      deckSelectedCount: selectedCount,
      deckSelectedPokemonsCount: selectedPokemonsCount,
      deckValuedPokemonsCount: valuedCount,
    };

    return {
      nationalStats: national,
      generationStatsMap: genMap,
    };
  }, [pokemonCardsMap]);

  // Context-aware active statistics (switches between National and active Generation)
  const activeStats = useMemo<GenerationStats>(() => {
    if (selectedGen !== 'all') {
      const gStats = generationStatsMap.get(selectedGen);
      if (gStats) return gStats;
    }
    return nationalStats;
  }, [selectedGen, nationalStats, generationStatsMap]);

  const activeGenMeta = useMemo(() => {
    if (selectedGen === 'all') return null;
    return GENERATIONS.find((g) => g.gen === selectedGen) || null;
  }, [selectedGen]);

  // Filtered and Sorted Pokémon List
  const filteredPokemon = useMemo(() => {
    const query = normalizePokemonName(searchQuery);

    return POKEMON_LIST.filter((p) => {
      // 1. Ownership Filter
      const pCards = pokemonCardsMap.get(p.id) || [];
      const isOwned = pCards.some((c) => (c.quantity || 0) > 0);

      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'missing' && isOwned) return false;
      if (ownershipFilter === 'deck' && !pCards.some((c) => c.is_deck_card)) return false;

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

        {/* Action Button: Generations Overview Modal */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setShowGenOverviewModal(true);
          }}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <BarChart2 className="w-4 h-4 text-pokedex-blue" />
          <span>{t('nationalDex.viewGenOverview')}</span>
        </button>
      </div>

      {/* Active Generation Indicator Banner (when filtered by Gen) */}
      {selectedGen !== 'all' && activeGenMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-pokedex-blue font-bold">
              {t('nationalDex.filteringByGen', { gen: selectedGen, region: activeStats.region })}
            </span>
            <span className="text-slate-400">({activeStats.range})</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {t('nationalDex.nationalTotalSummary', {
                owned: nationalStats.ownedCount,
                percent: nationalStats.completionPercent,
              })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSelectedGen('all');
            }}
            className="text-pokedex-blue hover:text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('nationalDex.clearGenFilter')}</span>
          </button>
        </div>
      )}

      {/* KPI Status Matrix (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Pokemons Captured / Owned */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
              {t('nationalDex.obtained')}
            </span>
            <span className="text-lg font-black font-display text-emerald-400 truncate block">
              {activeStats.ownedCount}{' '}
              <small className="text-xs font-normal text-slate-400">/ {activeStats.totalCount}</small>
            </span>
            <span className="text-[9px] font-mono text-slate-500 block truncate">
              {selectedGen === 'all' ? '1025 Pokémon' : `Gen ${selectedGen} • ${activeStats.region}`}
            </span>
          </div>
        </div>

        {/* Missing Pokémon */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md min-w-0">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
              {t('nationalDex.missing')}
            </span>
            <span className="text-lg font-black font-display text-slate-300 truncate block">
              {activeStats.missingCount}{' '}
              <small className="text-xs font-normal text-slate-500">{t('nationalDex.remaining')}</small>
            </span>
            <span className="text-[9px] font-mono text-slate-500 block truncate">
              {selectedGen === 'all' ? 'Para completar a Dex' : `Faltam na Gen ${selectedGen}`}
            </span>
          </div>
        </div>

        {/* Total Pokémon Cards in Collection */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-slate-800 flex items-center space-x-3 shadow-md min-w-0">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-pokedex-blue border border-blue-500/30 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
              {t('nationalDex.totalCardsInCollection')}
            </span>
            <span className="text-lg font-black font-display text-white truncate block">
              {activeStats.totalCardsCount}{' '}
              <small className="text-xs font-normal text-slate-400">{t('common.cards')}</small>
            </span>
            <span className="text-[9px] font-mono text-slate-500 block truncate">
              {selectedGen === 'all' ? 'No acervo geral' : `Cartas da Gen ${selectedGen}`}
            </span>
          </div>
        </div>

        {/* Total Deck Value KPI */}
        <div className="bg-pokedex-card/90 rounded-2xl p-3 border border-yellow-500/30 flex items-center space-x-3 shadow-md bg-gradient-to-br from-yellow-950/20 via-pokedex-card to-pokedex-card min-w-0">
          <div className="p-2.5 rounded-xl bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 shadow-inner shrink-0">
            <CircleDollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
              {t('nationalDex.deckValue')}
            </span>
            <span
              className="text-base sm:text-lg font-black font-display text-yellow-300 truncate block leading-tight tracking-tight whitespace-nowrap"
              title={`${language === 'pt' ? 'R$' : '$'} ${activeStats.totalDeckValue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            >
              {language === 'pt' ? 'R$' : '$'} {activeStats.totalDeckValue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block truncate">
              {t('nationalDex.deckValuedPokemons', { count: activeStats.deckValuedPokemonsCount })} ({activeStats.deckSelectedCount})
            </span>
          </div>
        </div>
      </div>

      {/* Completion Progress Gauge (Full Width) */}
      <div className="w-full bg-pokedex-card/90 rounded-2xl p-3.5 border border-slate-800 shadow-md space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 uppercase tracking-wider font-bold">
              {selectedGen === 'all'
                ? t('nationalDex.completion')
                : t('nationalDex.genProgress', { gen: selectedGen, region: activeStats.region })}
            </span>
            <span className="text-[10px] text-slate-400">
              ({activeStats.ownedCount} de {activeStats.totalCount} Pokémon)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {selectedGen !== 'all' && (
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                Nacional: {nationalStats.ownedCount}/1025 ({nationalStats.completionPercent}%)
              </span>
            )}
            <span className="text-yellow-300 font-bold text-xs sm:text-sm">{activeStats.completionPercent}%</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-2.5 sm:h-3 rounded-full overflow-hidden border border-slate-700">
          <div
            className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            style={{ width: `${activeStats.completionPercent}%` }}
          />
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
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Ownership Segment Tabs (reflects active generation when filtered) */}
          <div className="grid grid-cols-2 sm:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0 flex-wrap gap-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('all');
              }}
              className={`min-w-0 overflow-hidden px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                ownershipFilter === 'all'
                  ? 'bg-pokedex-blue text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate">
                {selectedGen === 'all'
                  ? t('nationalDex.filterAll')
                  : `${t('nationalDex.filterAllGen')} (${activeStats.totalCount})`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('owned');
              }}
              className={`min-w-0 overflow-hidden px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                ownershipFilter === 'owned'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('nationalDex.filterOwned', { count: activeStats.ownedCount })}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('deck');
              }}
              className={`min-w-0 overflow-hidden px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                ownershipFilter === 'deck'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-yellow-400/80 hover:text-yellow-300'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="truncate">{t('nationalDex.filterDeck', { count: activeStats.deckSelectedPokemonsCount })}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter('missing');
              }}
              className={`min-w-0 overflow-hidden px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                ownershipFilter === 'missing'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-red-400/80 hover:text-red-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('nationalDex.filterMissing', { count: activeStats.missingCount })}</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Generation, Type, and Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Generation Select with Embedded Counts and Overview Button */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Gen:</span>
            <select
              value={selectedGen}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedGen(val);
              }}
              className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                {t('nationalDex.allGenerationsWithCount', { owned: nationalStats.ownedCount })}
              </option>
              {GENERATIONS.map((g) => {
                const gStats = generationStatsMap.get(g.gen);
                const gOwned = gStats ? gStats.ownedCount : 0;
                const gTotal = gStats ? gStats.totalCount : 0;
                const gMissing = gStats ? gStats.missingCount : 0;
                return (
                  <option key={g.gen} value={g.gen} className="bg-slate-900 text-white">
                    Gen {g.gen} ({g.region}) — {gOwned}/{gTotal} ({t('nationalDex.missingCountShort', { count: gMissing })})
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowGenOverviewModal(true);
              }}
              title={t('nationalDex.viewGenOverview')}
              className="p-1 text-slate-400 hover:text-pokedex-blue transition-colors shrink-0 cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
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

      {/* Active Generation Stats Dedicated Banner (Prominent generation breakdown) */}
      {selectedGen !== 'all' && activeGenMeta && (
        <div className="bg-gradient-to-br from-slate-900/95 via-pokedex-card/95 to-slate-900/95 border border-pokedex-blue/40 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          {/* Header Row: Gen Badge, Region, Range & Clear Button */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-lg bg-pokedex-blue/20 text-pokedex-blue border border-pokedex-blue/40 text-[11px] font-mono font-black shrink-0">
                Gen {selectedGen}
              </span>
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-xs sm:text-sm font-bold font-display text-white truncate">
                  {activeStats.region}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400 shrink-0">
                  {activeStats.range}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setSelectedGen('all');
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{t('nationalDex.clearGenFilter')}</span>
            </button>
          </div>

          {/* 3 Metric Cards: Clean vertical stacked layout that never overflows */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* 1. Obtained */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter(ownershipFilter === 'owned' ? 'all' : 'owned');
              }}
              className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col items-center justify-center text-center cursor-pointer min-w-0 overflow-hidden ${
                ownershipFilter === 'owned'
                  ? 'bg-emerald-950/80 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                  : 'bg-slate-950/70 border-emerald-500/20 hover:border-emerald-500/50'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate w-full">
                {t('nationalDex.obtainedShort')}
              </span>
              <div className="flex items-baseline justify-center gap-0.5 mt-0.5 min-w-0">
                <span className="text-base sm:text-xl font-black font-display text-emerald-400 leading-none">
                  {activeStats.ownedCount}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-normal">
                  /{activeStats.totalCount}
                </span>
              </div>
            </button>

            {/* 2. Missing */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setOwnershipFilter(ownershipFilter === 'missing' ? 'all' : 'missing');
              }}
              className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col items-center justify-center text-center cursor-pointer min-w-0 overflow-hidden ${
                ownershipFilter === 'missing'
                  ? 'bg-red-950/80 border-red-500 shadow-md ring-1 ring-red-400/50'
                  : 'bg-slate-950/70 border-red-500/20 hover:border-red-500/50'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate w-full">
                {t('nationalDex.missing')}
              </span>
              <div className="flex items-baseline justify-center gap-0.5 mt-0.5 min-w-0">
                <span className="text-base sm:text-xl font-black font-display text-red-400 leading-none">
                  {activeStats.missingCount}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-500 font-normal">
                  {t('nationalDex.remaining')}
                </span>
              </div>
            </button>

            {/* 3. Progress */}
            <div className="bg-slate-950/70 rounded-xl p-2 sm:p-2.5 border border-yellow-500/20 flex flex-col items-center justify-center text-center min-w-0 overflow-hidden">
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate w-full">
                {t('nationalDex.progressShort')}
              </span>
              <div className="flex items-baseline justify-center mt-0.5 min-w-0">
                <span className="text-base sm:text-xl font-black font-display text-yellow-300 leading-none">
                  {activeStats.completionPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                style={{ width: `${activeStats.completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>
          {t('nationalDex.showingCount', {
            count: Math.min(visibleCount, filteredPokemon.length),
            total: filteredPokemon.length,
          })}
        </span>
        <div className="flex items-center gap-2">
          {selectedGen !== 'all' && activeGenMeta && (
            <span className="text-pokedex-blue font-bold">
              Gen {selectedGen} ({activeGenMeta.region})
            </span>
          )}
          {ownershipFilter !== 'all' && (
            <span className="text-yellow-300/80">
              • Filtro: {ownershipFilter === 'owned' ? 'Obtidos' : ownershipFilter === 'missing' ? 'Faltando' : 'Principais'}
            </span>
          )}
        </div>
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
            const mainCards = pCards.filter((c) => c.is_deck_card);
            const hasMainCards = mainCards.length > 0;
            const mainCardsTotalValue = mainCards.reduce(
              (sum, c) => sum + (c.price !== undefined && c.price !== null && !isNaN(Number(c.price)) ? Number(c.price) : 0),
              0
            );
            const hasAnyMainPrice = mainCards.some((c) => c.price !== undefined && c.price !== null && Number(c.price) > 0);

            return (
              <div
                key={pokemon.id}
                onClick={() => handleSelectPokemon(pokemon)}
                className={`group relative min-w-0 overflow-hidden bg-pokedex-card/80 hover:bg-pokedex-card rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between select-none ${
                  hasMainCards
                    ? 'border-amber-400/80 hover:border-yellow-300 bg-gradient-to-b from-amber-950/30 via-pokedex-card to-pokedex-card hover:scale-[1.02] ring-1 ring-amber-400/40'
                    : isOwned
                    ? 'border-emerald-600/50 hover:border-emerald-400/80 bg-gradient-to-b from-emerald-950/20 via-pokedex-card to-pokedex-card hover:scale-[1.02]'
                    : 'border-slate-800 hover:border-slate-600 opacity-75 hover:opacity-100 grayscale-[40%] hover:grayscale-0'
                }`}
              >
                {/* Header: National Number & Owned Indicator */}
                <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                  <span className="font-mono font-bold text-[10px] sm:text-[11px] text-yellow-300 bg-black/40 px-1.5 sm:px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                    #{pokemon.number}
                  </span>

                  {hasMainCards ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-amber-300 bg-amber-950/90 border border-yellow-400/60 px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm animate-in fade-in min-w-0 overflow-hidden">
                      <Star className="w-2.5 h-2.5 fill-current text-yellow-400 shrink-0" />
                      <span className="truncate">
                        {mainCards.length > 1
                          ? (language === 'pt' ? `Principais (${mainCards.length})` : `Main (${mainCards.length})`)
                          : (language === 'pt' ? 'Principal' : 'Main')}
                      </span>
                    </span>
                  ) : isOwned ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded-full shadow-sm min-w-0 overflow-hidden">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{pCards.length} {pCards.length === 1 ? 'carta' : 'cartas'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-mono font-bold text-slate-400 bg-slate-900/80 border border-slate-700 px-1.5 py-0.5 rounded-full min-w-0 overflow-hidden">
                      <span className="truncate">Faltando</span>
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
                <div className="space-y-1.5 mt-1 text-center min-w-0">
                  <h4 className="font-display font-black text-xs sm:text-sm text-white truncate drop-shadow-sm group-hover:text-yellow-300 transition-colors">
                    {pokemon.name}
                  </h4>

                  <div className="flex flex-wrap items-center justify-center gap-1 min-w-0">
                    {pokemon.types.map((type) => (
                      <span
                        key={type}
                        title={type}
                        className="inline-flex items-center text-[9px] font-mono font-bold uppercase text-slate-300 bg-slate-800/90 border border-slate-700 px-1.5 py-0.5 rounded-md max-w-full overflow-hidden"
                      >
                        <PokemonTypeIcon type={type} size="xs" className="sm:mr-0.5 shrink-0" />
                        <span className="hidden sm:inline truncate">{type}</span>
                      </span>
                    ))}
                  </div>

                  {/* If marked as principal, display main card(s) details and total price tag */}
                  {hasMainCards && (
                    <div className="pt-1 mt-1 border-t border-amber-500/30">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono bg-yellow-400/15 px-2 py-1 rounded-lg border border-yellow-400/30 min-w-0">
                        <span className="text-yellow-300/90 font-bold truncate min-w-0">
                          {mainCards.length === 1
                            ? `${mainCards[0].set_code} #${mainCards[0].card_number}`
                            : (language === 'pt' ? `${mainCards.length} principais` : `${mainCards.length} main`)}
                        </span>
                        <span className="text-yellow-300 font-black shrink-0">
                          {hasAnyMainPrice
                            ? `${language === 'pt' ? 'R$' : '$'} ${mainCardsTotalValue.toFixed(2)}`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quantity Owned Footer Pill (if not marked as main, show copies count) */}
                  {isOwned && !hasMainCards && (
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

      {/* Generations Overview Modal */}
      {showGenOverviewModal && (
        <div
          onClick={() => {
            soundEffects.playClick();
            setShowGenOverviewModal(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 pb-24 sm:pb-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-pokedex-card border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-pokedex-blue/20 text-pokedex-blue border border-blue-500/30">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black font-display text-base sm:text-lg text-white">
                    {t('nationalDex.genOverviewTitle')}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                    {t('nationalDex.genOverviewSubtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowGenOverviewModal(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Gen List (min-h-0 flex-1 guarantees complete scroll reaching the end) */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-5 pb-8 space-y-2.5 custom-scrollbar">
              {/* National Dex Summary Row */}
              <div
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedGen('all');
                  setShowGenOverviewModal(false);
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                  selectedGen === 'all'
                    ? 'bg-blue-950/40 border-pokedex-blue shadow-lg ring-1 ring-pokedex-blue/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black font-display text-white text-sm">
                      {t('nationalDex.allGenerations')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      (#0001 - #1025)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">
                      {nationalStats.ownedCount} {t('nationalDex.statusOwned').toLowerCase()}
                    </span>
                    <span className="text-red-400 font-bold">
                      {nationalStats.missingCount} {t('nationalDex.missing').toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="w-28 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-yellow-300 h-full rounded-full"
                      style={{ width: `${nationalStats.completionPercent}%` }}
                    />
                  </div>
                  <span className="text-yellow-300 font-mono font-bold text-xs min-w-[45px] text-right">
                    {nationalStats.completionPercent}%
                  </span>
                </div>
              </div>

              {/* Individual Generation Rows */}
              {GENERATIONS.map((g) => {
                const gStats = generationStatsMap.get(g.gen);
                const gOwned = gStats ? gStats.ownedCount : 0;
                const gTotal = gStats ? gStats.totalCount : 0;
                const gMissing = gStats ? gStats.missingCount : 0;
                const gPercent = gStats ? gStats.completionPercent : '0.0';
                const isCurrent = selectedGen === g.gen;

                return (
                  <div
                    key={g.gen}
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedGen(g.gen);
                      setShowGenOverviewModal(false);
                    }}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                      isCurrent
                        ? 'bg-blue-950/40 border-pokedex-blue shadow-lg ring-1 ring-pokedex-blue/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-pokedex-blue/20 text-pokedex-blue border border-pokedex-blue/30 text-[10px] font-mono font-bold shrink-0">
                          Gen {g.gen}
                        </span>
                        <span className="font-black font-display text-white text-sm">
                          {g.region}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({g.range})
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">
                          {gOwned}/{gTotal} {t('nationalDex.statusOwned').toLowerCase()}
                        </span>
                        <span className="text-red-400 font-bold">
                          {gMissing} {t('nationalDex.missing').toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="w-28 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-yellow-300 h-full rounded-full"
                          style={{ width: `${gPercent}%` }}
                        />
                      </div>
                      <span className="text-yellow-300 font-mono font-bold text-xs min-w-[45px] text-right">
                        {gPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowGenOverviewModal(false);
                }}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold transition-all border border-slate-700 cursor-pointer text-center"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
