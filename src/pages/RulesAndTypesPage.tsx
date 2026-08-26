import React, { useState } from 'react';
import typesData from '../data/types_info.json';
import rulesData from '../data/rules.json';
import { CardTypeInfo, FormatRule, TrainerTypeRule, SpecialConditionRule } from '../types';
import { 
  Leaf, Flame, Droplet, Zap, Eye, Shield, Moon, Hammer, Sparkles, CircleDot, 
  BookOpen, Layers, Award, AlertTriangle, BatteryCharging, Briefcase, HelpCircle
} from 'lucide-react';
import { soundEffects } from '../services/audio';

const ICON_COMPONENTS: Record<string, React.FC<{ className?: string }>> = {
  leaf: Leaf,
  flame: Flame,
  droplet: Droplet,
  zap: Zap,
  eye: Eye,
  shield: Shield,
  moon: Moon,
  hammer: Hammer,
  sparkles: Sparkles,
  'flame-kindling': Flame,
  'circle-dot': CircleDot,
};

export const RulesAndTypesPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<CardTypeInfo | null>(null);
  const [activeSection, setActiveSection] = useState<'types' | 'formats' | 'trainers' | 'conditions'>('types');

  const types = typesData as CardTypeInfo[];
  const formats = rulesData.formats as FormatRule[];
  const trainers = rulesData.trainer_types as TrainerTypeRule[];
  const conditions = rulesData.special_conditions as SpecialConditionRule[];

  const handleTypeClick = (t: CardTypeInfo) => {
    soundEffects.playClick();
    setSelectedType(t);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        <button
          onClick={() => { soundEffects.playClick(); setActiveSection('types'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeSection === 'types'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>11 Tipos Elementais</span>
        </button>

        <button
          onClick={() => { soundEffects.playClick(); setActiveSection('formats'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeSection === 'formats'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-yellow-300" />
          <span>Formatos (Standard, Expanded, Casual)</span>
        </button>

        <button
          onClick={() => { soundEffects.playClick(); setActiveSection('trainers'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeSection === 'trainers'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 text-yellow-300" />
          <span>Treinadores & Energias</span>
        </button>

        <button
          onClick={() => { soundEffects.playClick(); setActiveSection('conditions'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeSection === 'conditions'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-300" />
          <span>Condições Especiais</span>
        </button>
      </div>

      {/* SECTION 1: 11 Tipos Elementais (Recreating the JPEG in pure HTML/CSS) */}
      {activeSection === 'types' && (
        <div className="space-y-4">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800">
            <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span>Guia dos Tipos de Pokémon e Energias</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cada tipo possui identidades táticas, efeitos secundários característicos e mecânicas exclusivas de combate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map((type) => {
              const Icon = ICON_COMPONENTS[type.icon] || Sparkles;
              return (
                <div
                  key={type.id}
                  onClick={() => handleTypeClick(type)}
                  className="group relative bg-pokedex-card/90 hover:bg-pokedex-card rounded-3xl border border-slate-800 hover:border-white/30 p-5 shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Ambient Glow */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
                    style={{ backgroundColor: type.color }}
                  />

                  {/* Header: Icon & Name */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border border-white/20"
                        style={{ backgroundColor: type.color }}
                      >
                        <Icon className="w-5 h-5 text-white drop-shadow" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-pokedex-darker px-2 py-0.5 rounded-full border border-slate-800">
                        {type.name_en}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-sans text-white mb-2 flex items-center gap-2">
                      <span>{type.name}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }}></span>
                    </h3>

                    {/* Exact JPEG text description */}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                      {type.description}
                    </p>
                  </div>

                  {/* Footer Meta & Strengths */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Exemplos:</span>
                      <span className="text-slate-200 font-semibold">{type.sample_card}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Fraqueza Típica:</span>
                      <span className="text-red-400 font-bold">{type.weakness}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Formatos Oficiais e Casuais */}
      {activeSection === 'formats' && (
        <div className="space-y-4">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800">
            <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-300" />
              <span>Formatos de Jogo Pokémon TCG</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Entenda as diferenças de regras entre os formatos Standard, Expanded e Jogos Casuais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formats.map((fmt) => (
              <div key={fmt.id} className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pokedex-red text-white uppercase">
                      {fmt.tag}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 text-yellow-300 px-2 py-0.5 rounded-full">
                      {fmt.status_badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-sans text-white mb-2">{fmt.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">{fmt.description}</p>
                </div>

                <div className="space-y-2 text-xs font-mono pt-3 border-t border-slate-800">
                  <div className="bg-pokedex-darker p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Tamanho do Baralho:</span>
                    <span className="text-white font-bold">{fmt.deck_size}</span>
                  </div>
                  <div className="bg-pokedex-darker p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Cartas de Prêmio:</span>
                    <span className="text-yellow-300 font-bold">{fmt.prizes}</span>
                  </div>
                  <div className="bg-pokedex-darker p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Limite de Cópias:</span>
                    <span className="text-slate-200">{fmt.copy_limit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deck Construction Principles Box */}
          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-3">
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pokedex-blue" />
              <span>Regras Fundamentais de Montagem</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(rulesData.deck_building_rules as any[]).map((rule, idx) => (
                <div key={idx} className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-yellow-300 font-mono">{rule.title}</h4>
                  <p className="text-slate-300 leading-relaxed font-sans text-[11px]">{rule.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Treinadores & Energias */}
      {activeSection === 'trainers' && (
        <div className="space-y-4">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800">
            <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-teal-400" />
              <span>Cartas de Treinador e Energias</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Guia rápido das subcategorias de cartas de Treinador e suas restrições de uso por turno.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trainers.map((tr, idx) => (
              <div key={idx} className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white font-mono">{tr.type}</h3>
                </div>

                <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 text-xs font-sans text-slate-200">
                  <span className="text-teal-300 font-bold font-mono block text-[10px] uppercase mb-1">Regra de Jogada:</span>
                  {tr.rule}
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  <span className="text-slate-400">Exemplos no seu acervo: </span>
                  <span className="text-slate-200 font-semibold">{tr.examples}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Energy Breakdown */}
          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-md space-y-3">
            <div className="flex items-center space-x-2">
              <BatteryCharging className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white font-mono uppercase">Energias Básicas vs Energias Especiais</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-300 font-mono">Energias Básicas (Sem Limite)</h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Você pode ter quantas cópias quiser de Energias Básicas (Planta, Fogo, Água, Raios, Psíquica, Luta, Escuridão, Metal, Fada). Você pode ligar 1 Energia por turno da sua mão a 1 de seus Pokémon em campo.
                </p>
              </div>
              <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-300 font-mono">Energias Especiais (Máximo 4 Cópias)</h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Energias que fornecem efeitos extras (como Energia Borbulhante, Incolor Dupla, Aurora). Estão sujeitas à regra do limite de 4 cópias no baralho e podem ser descartadas por cartas como Martelo Avançado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Condições Especiais */}
      {activeSection === 'conditions' && (
        <div className="space-y-4">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800">
            <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <span>Condições Especiais (Status de Combate)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Como funcionam os status Envenenado, Queimado, Confuso, Paralisado e Adormecido no Pokémon TCG.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {conditions.map((cond, idx) => (
              <div key={idx} className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-yellow-300 font-mono">{cond.name}</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Efeito no Jogo:</span>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">{cond.effect}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Como Curar:</span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed mt-0.5">{cond.cure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
