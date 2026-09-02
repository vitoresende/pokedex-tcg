import React from 'react';
import { Search, X, Sparkles, Layers, CheckCircle2, CircleDashed } from 'lucide-react';
import { PokemonTypeIcon } from './PokemonTypeIcon';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';

const TYPE_PILLS = [
  { id: 'ALL', color: '#64748B' },
  { id: 'grass', color: '#78C850' },
  { id: 'fire', color: '#F08030' },
  { id: 'water', color: '#6890F0' },
  { id: 'lightning', color: '#F8D030' },
  { id: 'psychic', color: '#F85888' },
  { id: 'fighting', color: '#C03028' },
  { id: 'darkness', color: '#705848' },
  { id: 'metal', color: '#B8B8D0' },
  { id: 'fairy', color: '#EE99AC' },
  { id: 'dragon', color: '#7038F8' },
  { id: 'colorless', color: '#A8A878' },
  { id: 'trainer', color: '#14B8A6' },
  { id: 'energy', color: '#F59E0B' },
];

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, cards } = useCollection();
  const { t, language } = useLanguage();

  // Extract unique sets and rarities
  const uniqueSets = Array.from(new Set(cards.map(c => c.set_code).filter(Boolean))).sort();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleClearSearch = () => {
    soundEffects.playClick();
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  };

  const handleColorSelect = (colorId: string) => {
    soundEffects.playClick();
    setFilters(prev => ({ 
      ...prev, 
      selectedColor: colorId,
      selectedCategory: (colorId === 'trainer' || colorId === 'energy') ? 'ALL' : prev.selectedCategory
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    soundEffects.playClick();
    const newCategory = e.target.value;
    setFilters(prev => ({ 
      ...prev, 
      selectedCategory: newCategory,
      selectedColor: (prev.selectedColor === 'trainer' || prev.selectedColor === 'energy') ? 'ALL' : prev.selectedColor
    }));
  };

  const toggleBooleanFilter = (key: 'onlyFoil' | 'onlyOwned' | 'onlyMissing' | 'onlyDeckCards') => {
    soundEffects.playClick();
    setFilters(prev => {
      const next = !prev[key];
      // Mutual exclusion for owned vs missing
      if (key === 'onlyOwned' && next) return { ...prev, onlyOwned: true, onlyMissing: false };
      if (key === 'onlyMissing' && next) return { ...prev, onlyMissing: true, onlyOwned: false };
      return { ...prev, [key]: next };
    });
  };

  const hasActiveFilters = 
    filters.searchQuery !== '' ||
    filters.selectedColor !== 'ALL' ||
    filters.selectedSet !== 'ALL' ||
    filters.selectedRarity !== 'ALL' ||
    filters.selectedCategory !== 'ALL' ||
    filters.onlyFoil ||
    filters.onlyOwned ||
    filters.onlyMissing ||
    filters.onlyDeckCards;

  return (
    <div className="bg-pokedex-card/95 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-4 space-y-3 shadow-lg">
      {/* Search Input and Sort bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder={t('filters.searchPlaceholder')}
            className="w-full bg-pokedex-darker border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pokedex-blue transition-colors font-sans"
          />
          {filters.searchQuery && (
            <button
              onClick={handleClearSearch}
              aria-label={t('filters.clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Set, Category and Sort dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <select
            value={filters.selectedCategory}
            onChange={handleCategoryChange}
            aria-label={t('filters.allCategories')}
            className="bg-pokedex-darker border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-pokedex-blue"
          >
            <option value="ALL">{t('filters.allCategories')}</option>
            <option value="Pokémon">{t('filters.pokemonOnly')}</option>
            <option value="Trainer">{t('filters.trainersOnly')}</option>
            <option value="Energy">{t('filters.energiesOnly')}</option>
          </select>

          <select
            value={filters.selectedSet}
            onChange={(e) => {
              soundEffects.playClick();
              setFilters(prev => ({ ...prev, selectedSet: e.target.value }));
            }}
            aria-label={t('filters.allSets')}
            className="bg-pokedex-darker border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-pokedex-blue"
          >
            <option value="ALL">{t('filters.allSets')}</option>
            {uniqueSets.map(setCode => {
              const sample = cards.find(c => c.set_code === setCode);
              const setName = language === 'pt' ? (sample?.set_pt || sample?.set_en || setCode) : (sample?.set_en || sample?.set_pt || setCode);
              return (
                <option key={setCode} value={setCode}>
                  {setCode} - {setName}
                </option>
              );
            })}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => {
              soundEffects.playClick();
              setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
            }}
            aria-label={t('filters.sortBy')}
            className="bg-pokedex-darker border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-pokedex-blue"
          >
            <option value="number">{t('filters.sortCardNum')}</option>
            <option value="name">{t('filters.sortName')}</option>
            <option value="quantity">{t('filters.sortQuantity')}</option>
            <option value="rarity">{t('filters.sortRarity')}</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title={t('filters.resetFilters')}
              className="px-3 py-2 rounded-xl bg-pokedex-red/20 border border-pokedex-red/50 text-pokedex-lightred text-xs font-bold hover:bg-pokedex-red hover:text-white transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('filters.resetFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Type & Energy Chips (Scrollable) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        {TYPE_PILLS.map((pill) => {
          const isSelected = filters.selectedColor === pill.id;
          const label = t(`filters.types.${pill.id}`);
          return (
            <button
              key={pill.id}
              onClick={() => handleColorSelect(pill.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center space-x-1.5 border ${
                isSelected
                  ? 'text-white font-bold shadow-md scale-105'
                  : 'bg-pokedex-darker text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              style={{
                backgroundColor: isSelected ? pill.color : undefined,
                borderColor: isSelected ? '#FFFFFF88' : undefined,
              }}
            >
              {pill.id !== 'ALL' && pill.id !== 'trainer' && pill.id !== 'energy' ? (
                <PokemonTypeIcon type={pill.id} size="xs" />
              ) : (
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: pill.color }}
                ></span>
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Boolean Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs font-mono">
        <button
          onClick={() => toggleBooleanFilter('onlyFoil')}
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
            filters.onlyFoil
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/60 font-bold'
              : 'bg-pokedex-darker text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('filters.foilOnly')}</span>
        </button>

        <button
          onClick={() => toggleBooleanFilter('onlyDeckCards')}
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
            filters.onlyDeckCards
              ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 font-bold'
              : 'bg-pokedex-darker text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('filters.mappedInDecks')}</span>
        </button>

        <button
          onClick={() => toggleBooleanFilter('onlyOwned')}
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
            filters.onlyOwned
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 font-bold'
              : 'bg-pokedex-darker text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('filters.ownedOnly')}</span>
        </button>

        <button
          onClick={() => toggleBooleanFilter('onlyMissing')}
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
            filters.onlyMissing
              ? 'bg-red-500/20 text-red-300 border-red-400/60 font-bold'
              : 'bg-pokedex-darker text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <CircleDashed className="w-3.5 h-3.5" />
          <span>{t('filters.missingOnly')}</span>
        </button>
      </div>
    </div>
  );
};
