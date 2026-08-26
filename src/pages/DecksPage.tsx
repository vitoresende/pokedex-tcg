import React, { useState } from 'react';
import { useCollection } from '../context/CollectionContext';
import { Deck, DeckCardItem } from '../types';
import { Layers, Zap, Shield, Sparkles, Copy, Check, AlertCircle, ChevronRight, Swords, Trophy } from 'lucide-react';
import { soundEffects } from '../services/audio';
import { CardDetailModal } from '../components/CardDetailModal';

export const DecksPage: React.FC = () => {
  const { decks, cards, selectedCard, setSelectedCard } = useCollection();
  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || 'deck-1');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'opening' | 'midgame' | 'lategame'>('opening');

  const currentDeck = decks.find(d => d.id === activeDeckId) || decks[0];

  const handleSelectDeck = (deckId: string) => {
    soundEffects.playClick();
    setActiveDeckId(deckId);
    setActiveGuideTab('opening');
  };

  const handleCopyDecklist = () => {
    soundEffects.playScan();
    const text = [
      `=== ${currentDeck.name} (${currentDeck.format}) ===`,
      `Arquétipo: ${currentDeck.archetype}`,
      '',
      '## Pokémon (' + currentDeck.stats.pokemon + ')',
      ...currentDeck.cards.filter(c => c.section === 'pokemon').map(c => `${c.count}x ${c.name} (${c.set})`),
      '',
      '## Treinadores (' + currentDeck.stats.trainers + ')',
      ...currentDeck.cards.filter(c => c.section === 'trainers').map(c => `${c.count}x ${c.name} (${c.set})`),
      '',
      '## Energias (' + currentDeck.stats.energies + ')',
      ...currentDeck.cards.filter(c => c.section === 'energies').map(c => `${c.count}x ${c.name} (${c.set})`),
      '',
      'Estratégia: ' + currentDeck.win_condition
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCardClick = (cardItem: DeckCardItem) => {
    soundEffects.playClick();
    const matchedCard = cards.find(c => 
      c.name_pt.toLowerCase().includes(cardItem.name.toLowerCase()) ||
      c.name_en.toLowerCase().includes(cardItem.name.toLowerCase())
    );
    if (matchedCard) {
      setSelectedCard(matchedCard);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Horizontal Deck Selector Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {decks.map((deck, idx) => {
          const isSelected = deck.id === activeDeckId;
          return (
            <button
              key={deck.id}
              onClick={() => handleSelectDeck(deck.id)}
              className={`px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-200 border flex items-center space-x-2 shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-pokedex-red to-red-700 text-white font-bold border-yellow-400/80 shadow-lg scale-105'
                  : 'bg-pokedex-card/90 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono font-bold">
                {idx + 1}
              </span>
              <span className="text-xs">{deck.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                deck.format_slug === 'expanded' ? 'bg-purple-900/60 text-purple-200' : 'bg-emerald-900/60 text-emerald-200'
              }`}>
                {deck.format}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deck Hero Card */}
      <div className="bg-pokedex-card/95 backdrop-blur-md rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Background Accent Glow */}
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: currentDeck.accent_color }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="bg-pokedex-red text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Deck de 60 Cartas
              </span>
              <span className="bg-slate-800 text-yellow-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                {currentDeck.format}
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
                {currentDeck.archetype}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">{currentDeck.name}</h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl">{currentDeck.summary}</p>
          </div>

          {/* Copy Decklist Action Button */}
          <button
            onClick={handleCopyDecklist}
            className="self-start lg:self-center bg-pokedex-darker hover:bg-slate-800 text-slate-100 font-bold px-4 py-2 rounded-xl border border-slate-700 text-xs flex items-center space-x-2 transition-all active:scale-95 shadow-md shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-yellow-300" />}
            <span>{copied ? 'Lista Copiada!' : 'Copiar Decklist (PTCG Live)'}</span>
          </button>
        </div>

        {/* Deck Composition Ratio & Energy Requirement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono">
          {/* Card Ratio */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[10px] uppercase">Distribuição (60 Cartas)</span>
            <div className="flex items-center justify-between font-bold">
              <span className="text-blue-400">{currentDeck.stats.pokemon} Pokémon</span>
              <span className="text-teal-400">{currentDeck.stats.trainers} Treinadores</span>
              <span className="text-amber-400">{currentDeck.stats.energies} Energias</span>
            </div>
            {/* Visual Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex">
              <div style={{ width: `${(currentDeck.stats.pokemon / 60) * 100}%` }} className="bg-blue-500"></div>
              <div style={{ width: `${(currentDeck.stats.trainers / 60) * 100}%` }} className="bg-teal-500"></div>
              <div style={{ width: `${(currentDeck.stats.energies / 60) * 100}%` }} className="bg-amber-500"></div>
            </div>
          </div>

          {/* Energy Status */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">Energias no Acervo</span>
            <div className="text-slate-200 font-semibold text-xs">{currentDeck.energy_breakdown.owned}</div>
            {currentDeck.energy_breakdown.missing_count > 0 ? (
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px] pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Necessária: {currentDeck.energy_breakdown.needed}</span>
              </div>
            ) : (
              <div className="text-emerald-400 font-bold text-[11px] pt-1">Energias completas!</div>
            )}
          </div>

          {/* Win Condition */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" /> Condição de Vitória
            </span>
            <p className="text-slate-300 text-[11px] font-sans line-clamp-2">
              {currentDeck.win_condition}
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Playbook Tabs (Turno 1-2, Meio de Jogo, Fechamento) */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Swords className="w-5 h-5 text-pokedex-lightred" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
              Manual Estratégico de Pilotagem
            </h3>
          </div>

          <div className="flex bg-pokedex-darker p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => { soundEffects.playClick(); setActiveGuideTab('opening'); }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeGuideTab === 'opening' ? 'bg-pokedex-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Abertura
            </button>
            <button
              onClick={() => { soundEffects.playClick(); setActiveGuideTab('midgame'); }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeGuideTab === 'midgame' ? 'bg-pokedex-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Meio de Jogo
            </button>
            <button
              onClick={() => { soundEffects.playClick(); setActiveGuideTab('lategame'); }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeGuideTab === 'lategame' ? 'bg-pokedex-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Fechamento
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 bg-pokedex-darker rounded-2xl border border-slate-800 space-y-2.5">
          <h4 className="font-bold text-yellow-300 text-xs font-mono uppercase">
            {currentDeck.strategy_guide[activeGuideTab].title}
          </h4>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
            {currentDeck.strategy_guide[activeGuideTab].steps.map((step, sIdx) => (
              <li key={sIdx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pokedex-blue mt-1.5 shrink-0"></span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prize Trade Tip Footer */}
        <div className="p-3 bg-purple-950/30 rounded-2xl border border-purple-800/40 text-xs font-mono flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-purple-300">Dica de Troca de Prêmios (Prize Trade): </span>
            <span className="text-purple-200">{currentDeck.prize_trade_tip}</span>
          </div>
        </div>
      </div>

      {/* Complete 60 Cards List Grouped */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-yellow-300" />
          <span>Lista Completa do Baralho ({currentDeck.cards.reduce((acc, c) => acc + c.count, 0)} Cartas)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pokémon Column */}
          <div className="bg-pokedex-card/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-blue-400 font-mono uppercase">Pokémon ({currentDeck.stats.pokemon})</span>
            </div>
            <div className="space-y-1.5">
              {currentDeck.cards.filter(c => c.section === 'pokemon').map((c, i) => (
                <div
                  key={i}
                  onClick={() => handleCardClick(c)}
                  className="flex items-center justify-between p-2 rounded-xl bg-pokedex-darker hover:bg-slate-800/90 border border-slate-800 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono font-bold text-yellow-300">{c.count}x</span>
                    <span className="text-slate-100 font-semibold truncate hover:text-cyan-300">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">{c.set.split('-')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trainers Column */}
          <div className="bg-pokedex-card/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-teal-400 font-mono uppercase">Treinadores ({currentDeck.stats.trainers})</span>
            </div>
            <div className="space-y-1.5">
              {currentDeck.cards.filter(c => c.section === 'trainers').map((c, i) => (
                <div
                  key={i}
                  onClick={() => handleCardClick(c)}
                  className="flex items-center justify-between p-2 rounded-xl bg-pokedex-darker hover:bg-slate-800/90 border border-slate-800 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono font-bold text-yellow-300">{c.count}x</span>
                    <span className="text-slate-100 font-semibold truncate hover:text-cyan-300">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{c.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Energies Column */}
          <div className="bg-pokedex-card/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-amber-400 font-mono uppercase">Energias ({currentDeck.stats.energies})</span>
            </div>
            <div className="space-y-1.5">
              {currentDeck.cards.filter(c => c.section === 'energies').map((c, i) => (
                <div
                  key={i}
                  onClick={() => handleCardClick(c)}
                  className="flex items-center justify-between p-2 rounded-xl bg-pokedex-darker hover:bg-slate-800/90 border border-slate-800 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono font-bold text-yellow-300">{c.count}x</span>
                    <span className="text-slate-100 font-semibold truncate hover:text-cyan-300">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">
                    {c.owned}/{c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onNavigateToDeck={(deckId) => setActiveDeckId(deckId)}
      />
    </div>
  );
};
