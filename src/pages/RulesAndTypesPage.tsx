import React, { useState, useMemo } from 'react';
import typesData from '../data/types_info.json';
import rulesData from '../data/rules.json';
import { CardTypeInfo, FormatRule, TrainerTypeRule, SpecialConditionRule } from '../types';
import { 
  BookOpen, Sparkles, Layers, CheckCircle2, ChevronRight,
  Shield, AlertTriangle, Search, X, RefreshCw, Tag, ChevronDown, Calendar
} from 'lucide-react';
import { PokemonTypeIcon } from '../components/PokemonTypeIcon';
import { useLanguage } from '../context/LanguageContext';
import { useCollection } from '../context/CollectionContext';
import { soundEffects } from '../services/audio';

export const RulesAndTypesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'types' | 'formats' | 'trainers' | 'conditions' | 'sets'>('types');
  const [selectedType, setSelectedType] = useState<CardTypeInfo>(typesData[0]);
  const [setSearchQuery, setSetSearchQuery] = useState('');
  const [selectedMarkFilter, setSelectedMarkFilter] = useState('ALL');
  const { t, language } = useLanguage();
  const { allSetsList, isSyncingSets, syncSetsMetadata } = useCollection();

  const handleSelectTab = (tab: 'types' | 'formats' | 'trainers' | 'conditions' | 'sets') => {
    soundEffects.playClick();
    setActiveTab(tab);
  };

  const handleSelectType = (typeInfo: CardTypeInfo) => {
    soundEffects.playClick();
    setSelectedType(typeInfo);
  };

  const filteredSets = useMemo(() => {
    return allSetsList.filter(s => {
      // Mark filter
      if (selectedMarkFilter !== 'ALL') {
        if (selectedMarkFilter === 'NONE') {
          if (s.mark) return false;
        } else if (s.mark !== selectedMarkFilter) {
          return false;
        }
      }

      // Search query
      if (setSearchQuery.trim()) {
        const q = setSearchQuery.toLowerCase().trim();
        const matchNamePt = (s.namePt || '').toLowerCase().includes(q);
        const matchNameEn = (s.nameEn || '').toLowerCase().includes(q);
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchYear = String(s.year || '').includes(q);
        const matchMark = (s.mark || '').toLowerCase() === q;
        if (!matchNamePt && !matchNameEn && !matchCode && !matchYear && !matchMark) {
          return false;
        }
      }

      return true;
    });
  }, [allSetsList, selectedMarkFilter, setSearchQuery]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yellow-300" />
          <span>{t('rules.title')}</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          {t('rules.subtitle')}
        </p>
      </div>

      {/* Navigation Pill Switcher */}
      <div className="flex bg-pokedex-card/90 p-1.5 rounded-2xl border border-slate-800 space-x-1 text-xs font-mono overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSelectTab('types')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'types'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('rules.tabTypes')}
        </button>
        <button
          onClick={() => handleSelectTab('formats')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'formats'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('rules.tabFormats')}
        </button>
        <button
          onClick={() => handleSelectTab('trainers')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'trainers'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('rules.tabTrainers')}
        </button>
        <button
          onClick={() => handleSelectTab('conditions')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'conditions'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('rules.tabConditions')}
        </button>
        <button
          onClick={() => handleSelectTab('sets')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'sets'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('rules.tabSets')}
        </button>
      </div>

      {/* TAB 1: 11 Elemental Types Matrix */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          {/* Horizontal Type Badges Selector */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
            {typesData.map((typeItem) => {
              const isSelected = selectedType.id === typeItem.id;
              return (
                <button
                  key={typeItem.id}
                  onClick={() => handleSelectType(typeItem)}
                  className={`p-2 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center space-y-1.5 ${
                    isSelected
                      ? 'shadow-lg scale-105 border-white bg-pokedex-card/90'
                      : 'bg-pokedex-card/70 border-slate-800 hover:border-slate-700 hover:bg-pokedex-card'
                  }`}
                  style={{
                    borderColor: isSelected ? typeItem.color : undefined,
                    boxShadow: isSelected ? `0 0 15px ${typeItem.color}60` : undefined,
                  }}
                >
                  <PokemonTypeIcon type={typeItem.id} size="md" />
                  <span 
                    className="text-[11px] font-mono font-bold tracking-tight"
                    style={{ color: isSelected ? typeItem.color : '#E2E8F0' }}
                  >
                    {t(`filters.types.${typeItem.id}`) !== `filters.types.${typeItem.id}` ? t(`filters.types.${typeItem.id}`) : typeItem.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Type Detailed Focus Card */}
          <div className="bg-pokedex-card/95 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div 
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: selectedType.color }}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div className="flex items-center space-x-3.5">
                <PokemonTypeIcon type={selectedType.id} size="xl" className="shadow-lg" />
                <div>
                  <h3 className="text-2xl font-black font-display text-white">
                    {t(`filters.types.${selectedType.id}`) !== `filters.types.${selectedType.id}` ? t(`filters.types.${selectedType.id}`) : selectedType.name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {language === 'pt' ? 'Tipo Elemental e Energia Oficial do Pokémon TCG' : 'Official Pokémon TCG Energy & Elemental Type'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="bg-pokedex-darker px-3 py-2 rounded-2xl border border-slate-800 flex items-center space-x-2">
                  <span className="text-slate-400">{t('rules.weakness')}:</span>
                  <div className="flex items-center space-x-1">
                    <PokemonTypeIcon type={selectedType.weakness.split(' ')[0]} size="xs" />
                    <span className="text-red-400 font-bold">{selectedType.weakness}</span>
                  </div>
                </div>
                <div className="bg-pokedex-darker px-3 py-2 rounded-2xl border border-slate-800 flex items-center space-x-2">
                  <span className="text-slate-400">{t('rules.resistance')}:</span>
                  <div className="flex items-center space-x-1">
                    {selectedType.resistance !== 'None' && selectedType.resistance !== '-' ? (
                      <PokemonTypeIcon type={selectedType.resistance.split(' ')[0]} size="xs" />
                    ) : null}
                    <span className="text-emerald-400 font-bold">{selectedType.resistance}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed bg-pokedex-darker p-4 rounded-2xl border border-slate-800">
              {selectedType.description}
            </p>

            {/* Strengths and Characteristics */}
            <div className="mt-5 space-y-2">
              <span className="text-xs font-mono font-bold text-yellow-300 uppercase tracking-wider block">
                {t('rules.archetypeStrengths')}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {selectedType.strengths.map((str, idx) => (
                  <div key={idx} className="bg-pokedex-darker p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notable Cards */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>{t('rules.iconicCards')}:</span>
              <span className="text-yellow-300 font-bold">{selectedType.sample_card}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Formats & Deck Building Rules */}
      {activeTab === 'formats' && (
        <div className="space-y-6">
          {/* Deck Building Core Rules */}
          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-yellow-300" />
              <span>{t('rules.coreRules')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rulesData.deck_building_rules.map((rule, idx) => (
                <div key={idx} className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-yellow-300 font-mono block">{rule.title}</span>
                  <p className="text-slate-300 leading-relaxed font-sans">{rule.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formats Comparison Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              {t('rules.competitiveFormats')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rulesData.formats.map((fmt: FormatRule) => (
                <div key={fmt.id} className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 flex flex-col justify-between shadow-md space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pokedex-red/20 text-pokedex-lightred border border-pokedex-red/40 uppercase">
                        {fmt.tag}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{fmt.status_badge}</span>
                    </div>
                    <h4 className="text-lg font-bold font-display text-white">{fmt.name}</h4>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{fmt.description}</p>
                  </div>

                  <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('rules.deckSize')}:</span>
                      <span className="text-yellow-300 font-bold">{fmt.deck_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('rules.prizeCards')}:</span>
                      <span className="text-emerald-400 font-bold">{fmt.prizes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Trainer Card Types */}
      {activeTab === 'trainers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rulesData.trainer_types.map((trainer: TrainerTypeRule, idx) => (
              <div key={idx} className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-md">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-teal-400"></span>
                  <h4 className="text-base font-bold font-display text-white">{trainer.type}</h4>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans bg-pokedex-darker p-3 rounded-2xl border border-slate-800">
                  {trainer.rule}
                </p>
                <div className="text-xs font-mono text-slate-400">
                  <span className="text-teal-300 font-bold">{t('rules.examples')}: </span>
                  <span>{trainer.examples}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Special Conditions */}
      {activeTab === 'conditions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rulesData.special_conditions.map((cond: SpecialConditionRule, idx) => (
              <div key={idx} className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold font-display text-yellow-300">{cond.name}</h4>
                  <span className="text-[10px] font-mono bg-red-950/80 text-red-300 px-2 py-0.5 rounded-full border border-red-800/60">
                    {t('rules.statusEffect')}
                  </span>
                </div>
                <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">{t('rules.effect')}:</span>
                    <p className="text-slate-200 font-sans">{cond.effect}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">{t('rules.howToCure')}:</span>
                    <p className="text-emerald-300 font-sans">{cond.cure}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TCG Expansions & Regulation Marks */}
      {activeTab === 'sets' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 md:p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-yellow-300" />
                  <span>{t('rules.setsTitle')}</span>
                  <span className="text-xs font-mono font-bold bg-yellow-950/60 text-yellow-300 border border-yellow-800/60 px-2 py-0.5 rounded-full">
                    {filteredSets.length} / {allSetsList.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  {t('rules.setsSubtitle')}
                </p>
              </div>

              {/* Sync Button */}
              <button
                onClick={() => syncSetsMetadata()}
                disabled={isSyncingSets}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pokedex-red/90 hover:bg-pokedex-red text-white font-bold text-xs font-mono rounded-xl border border-red-500/40 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
                title={t('rules.syncSetsListBtn')}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingSets ? 'animate-spin' : ''}`} />
                <span>{isSyncingSets ? t('profile.syncingSets') : t('rules.syncSetsListBtn')}</span>
              </button>
            </div>

            {/* Filter Bar: Search + Regulation Mark Selector */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={setSearchQuery}
                  onChange={(e) => setSetSearchQuery(e.target.value)}
                  placeholder={t('rules.searchSetsPlaceholder')}
                  className="w-full bg-pokedex-darker/90 text-white text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-yellow-400/60 transition-colors font-sans"
                />
                {setSearchQuery && (
                  <button
                    onClick={() => setSetSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Regulation Mark Filter Dropdown */}
              <div className="relative min-w-[200px]">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedMarkFilter}
                  onChange={(e) => setSelectedMarkFilter(e.target.value)}
                  className="w-full bg-pokedex-darker/90 text-white text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-yellow-400/60 appearance-none font-mono cursor-pointer"
                >
                  <option value="ALL">{t('rules.allEras')}</option>
                  <option value="J">Marca [J] (2025/2026 - Standard)</option>
                  <option value="I">Marca [I] (2025 - Standard)</option>
                  <option value="H">Marca [H] (2024 - Standard)</option>
                  <option value="G">Marca [G] (2023 - Standard)</option>
                  <option value="F">Marca [F] (2022 - Expandido)</option>
                  <option value="E">Marca [E] (2021 - Expandido)</option>
                  <option value="D">Marca [D] (2020 - Expandido)</option>
                  <option value="NONE">{t('rules.classicFilter')}</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sets Grid */}
          {filteredSets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSets.map((setItem) => {
                const isStandard = ['G', 'H', 'I', 'J'].includes(setItem.mark || '');
                const isExpanded = ['D', 'E', 'F'].includes(setItem.mark || '');
                const logoSrc = setItem.logoUrl
                  ? (setItem.logoUrl.endsWith('.webp') || setItem.logoUrl.endsWith('.png') ? setItem.logoUrl : `${setItem.logoUrl}.webp`)
                  : undefined;
                const symbolSrc = setItem.symbolUrl
                  ? (setItem.symbolUrl.endsWith('.webp') || setItem.symbolUrl.endsWith('.png') ? setItem.symbolUrl : `${setItem.symbolUrl}.webp`)
                  : undefined;

                return (
                  <div
                    key={`${setItem.code}-${setItem.id}`}
                    className="bg-pokedex-card/90 rounded-2xl border border-slate-800 hover:border-slate-700/80 p-4 transition-all duration-200 shadow-md flex flex-col justify-between space-y-3 group"
                  >
                    {/* Top Row: Year, Regulation Mark Badge, Code & Legality */}
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        {/* Year + Mark */}
                        <div className="flex items-center gap-1.5">
                          {setItem.year > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300 bg-slate-800/90 border border-slate-700/70 px-2 py-0.5 rounded-md">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {setItem.year}
                            </span>
                          )}

                          {setItem.mark ? (
                            <span
                              className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md border ${
                                isStandard
                                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-sm'
                                  : 'bg-amber-950/80 text-amber-400 border-amber-700/60'
                              }`}
                              title={t('rules.regulationMark')}
                            >
                              [{setItem.mark}]
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded">
                              Classic
                            </span>
                          )}
                        </div>

                        {/* Format Legality Pill */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isStandard
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70'
                              : isExpanded
                              ? 'bg-blue-950/70 text-blue-300 border-blue-800/70'
                              : 'bg-slate-800/70 text-slate-400 border-slate-700/70'
                          }`}
                        >
                          {isStandard
                            ? t('rules.formatStandard')
                            : isExpanded
                            ? t('rules.formatExpanded')
                            : t('rules.formatVintage')}
                        </span>
                      </div>

                      {/* Official Code & Name Heading */}
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-mono font-black text-yellow-400 bg-yellow-950/50 border border-yellow-800/50 px-2 py-0.5 rounded">
                              {setItem.code}
                            </span>
                            <h4 className="text-sm font-bold font-display text-white truncate" title={setItem.namePt || setItem.nameEn}>
                              {setItem.namePt || setItem.nameEn}
                            </h4>
                          </div>

                          {setItem.nameEn && setItem.nameEn !== setItem.namePt && (
                            <p className="text-[11px] text-slate-400 italic truncate mt-0.5" title={setItem.nameEn}>
                              {setItem.nameEn}
                            </p>
                          )}
                        </div>

                        {/* Set Symbol if available */}
                        {symbolSrc && (
                          <img
                            src={symbolSrc}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Middle: Logo preview if available */}
                    {logoSrc && (
                      <div className="h-10 flex items-center justify-center bg-pokedex-darker/60 rounded-xl p-1 border border-slate-800/50">
                        <img
                          src={logoSrc}
                          alt={setItem.namePt}
                          className="max-h-8 max-w-full object-contain filter drop-shadow opacity-85 group-hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement?.classList.add('hidden');
                          }}
                        />
                      </div>
                    )}

                    {/* Bottom Row: Full Formatted String & Card Count */}
                    <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="truncate text-slate-300 font-semibold text-[10px]" title={`${setItem.year ? `${setItem.year} - ` : ''}${setItem.mark ? `[${setItem.mark}] - ` : ''}${setItem.code} - ${setItem.namePt}`}>
                        {setItem.year ? `${setItem.year} · ` : ''}{setItem.mark ? `[${setItem.mark}] · ` : ''}{setItem.code}
                      </span>
                      {setItem.totalCards ? (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {t('rules.totalCardsInSet', { count: setItem.totalCards })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-display font-medium text-sm">
                {t('rules.noSetsFound')}
              </p>
              {(setSearchQuery || selectedMarkFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSetSearchQuery('');
                    setSelectedMarkFilter('ALL');
                  }}
                  className="text-xs font-mono text-yellow-400 hover:text-yellow-300 underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
