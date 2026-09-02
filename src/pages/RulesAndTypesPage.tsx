import React, { useState } from 'react';
import typesData from '../data/types_info.json';
import rulesData from '../data/rules.json';
import { CardTypeInfo, FormatRule, TrainerTypeRule, SpecialConditionRule } from '../types';
import { 
  BookOpen, Sparkles, Layers, CheckCircle2, ChevronRight,
  Shield, AlertTriangle
} from 'lucide-react';
import { PokemonTypeIcon } from '../components/PokemonTypeIcon';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';

export const RulesAndTypesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'types' | 'formats' | 'trainers' | 'conditions'>('types');
  const [selectedType, setSelectedType] = useState<CardTypeInfo>(typesData[0]);
  const { t } = useLanguage();

  const handleSelectTab = (tab: 'types' | 'formats' | 'trainers' | 'conditions') => {
    soundEffects.playClick();
    setActiveTab(tab);
  };

  const handleSelectType = (typeInfo: CardTypeInfo) => {
    soundEffects.playClick();
    setSelectedType(typeInfo);
  };

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
                    {typeItem.name}
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
                  <h3 className="text-2xl font-black font-display text-white">{selectedType.name}</h3>
                  <span className="text-xs font-mono text-slate-400">Official Pokémon TCG Energy & Elemental Type</span>
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
    </div>
  );
};
