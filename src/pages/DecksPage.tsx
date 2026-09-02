import React, { useState } from 'react';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { Deck, DeckCardItem } from '../types';
import { 
  Layers, Copy, Check, AlertCircle, 
  Swords, Trophy, Plus, Trash2, Sparkles, Pencil, CheckCircle2 
} from 'lucide-react';
import { soundEffects } from '../services/audio';
import { CardDetailModal } from '../components/CardDetailModal';
import { CreateDeckModal } from '../components/CreateDeckModal';
import { EditDeckModal } from '../components/EditDeckModal';
import { AddCardModal } from '../components/AddCardModal';

export const DecksPage: React.FC = () => {
  const { decks, cards, selectedCard, setSelectedCard, deleteDeck, removeCardFromDeck } = useCollection();
  const { 
    t, language, getCardName, 
    localizePlaybookTitle, localizePlaybookStep, 
    localizePrizeTradeTip, localizeDeckText, localizeFormat 
  } = useLanguage();
  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || 'deck-1');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'opening' | 'midgame' | 'lategame'>('opening');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [validateModalOpen, setValidateModalOpen] = useState<boolean>(false);

  const currentDeck = decks.find(d => d.id === activeDeckId) || decks[0] || {
    id: 'empty',
    name: 'No Decks Available',
    format: 'Standard',
    format_slug: 'standard',
    archetype: 'Empty',
    badge_color: 'from-slate-800 to-slate-950',
    accent_color: '#64748B',
    summary: 'Build your first deck by clicking the button above.',
    win_condition: 'Configure your custom deck strategy.',
    stats: { pokemon: 0, trainers: 0, energies: 0, total: 0 },
    energy_breakdown: { owned: '0', needed: 'None', missing_count: 0 },
    cards: [],
    strategy_guide: {
      opening: { title: '1. Opening Plan', steps: ['Add cards to the deck.'] },
      midgame: { title: '2. Midgame Plan', steps: ['Develop your board state.'] },
      lategame: { title: '3. Endgame Plan', steps: ['Claim Prize cards.'] },
    },
    prize_trade_tip: 'Aim for a solid 60-card synergy.'
  };

  const handleSelectDeck = (deckId: string) => {
    soundEffects.playClick();
    setActiveDeckId(deckId);
    setActiveGuideTab('opening');
  };

  const handleDeleteCurrentDeck = () => {
    if (confirm(t('decks.confirmDelete', { name: currentDeck.name }))) {
      soundEffects.playClick();
      deleteDeck(currentDeck.id);
      const remaining = decks.filter(d => d.id !== currentDeck.id);
      if (remaining.length > 0) {
        setActiveDeckId(remaining[0].id);
      }
    }
  };

  const handleCopyDecklist = () => {
    soundEffects.playScan();
    const text = [
      `=== ${currentDeck.name} (${currentDeck.format}) ===`,
      `Archetype: ${currentDeck.archetype}`,
      '',
      '## Pokémon (' + currentDeck.stats.pokemon + ')',
      ...currentDeck.cards.filter(c => c.section === 'pokemon').map(c => `${c.count}x ${c.name} (${c.set})`),
      '',
      '## Trainers (' + currentDeck.stats.trainers + ')',
      ...currentDeck.cards.filter(c => c.section === 'trainers').map(c => `${c.count}x ${c.name} (${c.set})`),
      '',
      '## Energies (' + currentDeck.stats.energies + ')',
      ...currentDeck.cards.filter(c => c.section === 'energies').map(c => `${c.count}x ${c.name} (${c.set})`),
      '',
      'Strategy: ' + currentDeck.win_condition
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCardClick = (cardItem: DeckCardItem) => {
    soundEffects.playClick();
    const matchedCard = cards.find(c => 
      c.name_en.toLowerCase().includes(cardItem.name.toLowerCase()) ||
      c.name_pt.toLowerCase().includes(cardItem.name.toLowerCase())
    );
    if (matchedCard) {
      setSelectedCard(matchedCard);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Top Deck Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-yellow-300" />
            <span>{t('decks.title', { count: decks.length })}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {t('decks.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { soundEffects.playClick(); setValidateModalOpen(true); }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-2xl shadow-lg transition-all active:scale-95 text-xs font-mono flex items-center justify-center space-x-2 border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
            <span>{t('decks.validateDeck')}</span>
          </button>

          <button
            onClick={() => { soundEffects.playClick(); setCreateModalOpen(true); }}
            className="bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold px-4 py-2 rounded-2xl shadow-lg transition-all active:scale-95 text-xs font-mono flex items-center justify-center space-x-2 border border-white/20"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>{t('decks.createDeck')}</span>
          </button>
        </div>
      </div>

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

      {/* Main Active Deck Banner / Strategy Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentDeck.badge_color} border-2 border-slate-700/80 p-6 shadow-2xl transition-all`}>
        {/* Glow Accent Sphere */}
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: currentDeck.accent_color }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="bg-pokedex-red text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                {t('decks.cardsCount', { count: currentDeck.stats.total || 60 })}
              </span>
              <span className="bg-slate-800 text-yellow-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                {localizeFormat(currentDeck.format)}
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
                {currentDeck.archetype}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">{currentDeck.name}</h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl">{localizeDeckText(currentDeck.summary)}</p>
          </div>

          {/* Action Buttons: Copy, Edit & Delete */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => { soundEffects.playClick(); setEditModalOpen(true); }}
              className="bg-blue-600/90 hover:bg-blue-600 text-white font-bold px-3.5 py-2 rounded-xl border border-blue-400/40 text-xs flex items-center space-x-1.5 transition-all active:scale-95 shadow-md shrink-0 font-mono"
            >
              <Pencil className="w-3.5 h-3.5 text-yellow-300" />
              <span>{t('decks.editDeckBtn')}</span>
            </button>

            <button
              onClick={handleCopyDecklist}
              className="bg-pokedex-darker hover:bg-slate-800 text-slate-100 font-bold px-3.5 py-2 rounded-xl border border-slate-700 text-xs flex items-center space-x-2 transition-all active:scale-95 shadow-md shrink-0 font-mono"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-yellow-300" />}
              <span>{copied ? t('decks.decklistCopied') : t('decks.exportLive')}</span>
            </button>

            {decks.length > 1 && (
              <button
                onClick={handleDeleteCurrentDeck}
                title={t('decks.deleteDeck')}
                className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Deck Composition Ratio & Energy Requirement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono">
          {/* Card Ratio */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[10px] uppercase">{t('decks.composition', { count: currentDeck.stats.total })}</span>
            <div className="flex items-center justify-between font-bold">
              <span className="text-blue-400">{t('decks.pokemonCount', { count: currentDeck.stats.pokemon })}</span>
              <span className="text-teal-400">{t('decks.trainersCount', { count: currentDeck.stats.trainers })}</span>
              <span className="text-amber-400">{t('decks.energiesCount', { count: currentDeck.stats.energies })}</span>
            </div>
            {/* Visual Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex">
              <div style={{ width: `${currentDeck.stats.total ? (currentDeck.stats.pokemon / currentDeck.stats.total) * 100 : 0}%` }} className="bg-blue-500"></div>
              <div style={{ width: `${currentDeck.stats.total ? (currentDeck.stats.trainers / currentDeck.stats.total) * 100 : 0}%` }} className="bg-teal-500"></div>
              <div style={{ width: `${currentDeck.stats.total ? (currentDeck.stats.energies / currentDeck.stats.total) * 100 : 0}%` }} className="bg-amber-500"></div>
            </div>
          </div>

          {/* Energy Status */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">{t('decks.energyBreakdown')}</span>
            <div className="text-slate-200 font-semibold text-xs">{localizeDeckText(currentDeck.energy_breakdown.owned)}</div>
            {currentDeck.energy_breakdown.missing_count > 0 ? (
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px] pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('decks.energyRequired', { needed: currentDeck.energy_breakdown.needed })}</span>
              </div>
            ) : (
              <div className="text-emerald-400 font-bold text-[11px] pt-1">{t('decks.energyComplete')}</div>
            )}
          </div>

          {/* Win Condition */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" /> {t('decks.winCondition')}
            </span>
            <p className="text-slate-300 text-[11px] font-sans line-clamp-2">
              {localizeDeckText(currentDeck.win_condition)}
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Playbook Tabs */}
      <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Swords className="w-5 h-5 text-pokedex-lightred" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                {t('decks.playbook')}
              </h3>
            </div>
            <button
              onClick={() => { soundEffects.playClick(); setEditModalOpen(true); }}
              className="sm:hidden text-[11px] text-yellow-300 hover:text-yellow-200 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"
            >
              <Pencil className="w-3 h-3" />
              <span>{t('common.edit')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-pokedex-darker p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => { soundEffects.playClick(); setActiveGuideTab('opening'); }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeGuideTab === 'opening' ? 'bg-pokedex-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('decks.opening')}
              </button>
              <button
                onClick={() => { soundEffects.playClick(); setActiveGuideTab('midgame'); }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeGuideTab === 'midgame' ? 'bg-pokedex-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('decks.midgame')}
              </button>
              <button
                onClick={() => { soundEffects.playClick(); setActiveGuideTab('lategame'); }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeGuideTab === 'lategame' ? 'bg-pokedex-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('decks.endgame')}
              </button>
            </div>

            <button
              onClick={() => { soundEffects.playClick(); setEditModalOpen(true); }}
              className="hidden sm:flex text-xs text-yellow-300 hover:text-yellow-200 items-center gap-1.5 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-xl border border-slate-700 font-mono transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{t('decks.customizePlaybook')}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 bg-pokedex-darker rounded-2xl border border-slate-800 space-y-2.5">
          <h4 className="font-bold text-yellow-300 text-xs font-mono uppercase">
            {localizePlaybookTitle(currentDeck.strategy_guide[activeGuideTab].title)}
          </h4>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
            {currentDeck.strategy_guide[activeGuideTab].steps.map((step, sIdx) => (
              <li key={sIdx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pokedex-blue mt-1.5 shrink-0"></span>
                <span>{localizePlaybookStep(step)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prize Trade Tip Footer */}
        <div className="p-3 bg-purple-950/30 rounded-2xl border border-purple-800/40 text-xs font-mono flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-purple-300">{t('decks.prizeTradeTip')} </span>
            <span className="text-purple-200">{localizePrizeTradeTip(currentDeck.prize_trade_tip)}</span>
          </div>
        </div>
      </div>

      {/* Complete Cards List Grouped */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-yellow-300" />
          <span>{t('decks.completeList')} ({currentDeck.cards.reduce((acc, c) => acc + c.count, 0)} {t('common.cards')})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pokémon Column */}
          <div className="bg-pokedex-card/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-blue-400 font-mono uppercase">{t('decks.pokemonSection', { count: currentDeck.stats.pokemon })}</span>
            </div>
            <div className="space-y-1.5">
              {currentDeck.cards.filter(c => c.section === 'pokemon').map((c, i) => {
                const matchedCard = cards.find(card => card.name_en.toLowerCase() === c.name.toLowerCase() || card.name_pt.toLowerCase() === c.name.toLowerCase());
                const displayName = matchedCard ? getCardName(matchedCard) : c.name;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-pokedex-darker hover:bg-slate-800/90 border border-slate-800 transition-colors text-xs"
                  >
                    <div 
                      onClick={() => handleCardClick(c)}
                      className="flex items-center space-x-2 truncate cursor-pointer flex-1"
                    >
                      <span className="font-mono font-bold text-yellow-300">{c.count}x</span>
                      <span className="text-slate-100 font-semibold truncate hover:text-cyan-300">{displayName}</span>
                    </div>
                    <button
                      onClick={() => removeCardFromDeck(currentDeck.id, c.name)}
                      title={t('decks.removeFromDeck')}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trainers Column */}
          <div className="bg-pokedex-card/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-teal-400 font-mono uppercase">{t('decks.trainersSection', { count: currentDeck.stats.trainers })}</span>
            </div>
            <div className="space-y-1.5">
              {currentDeck.cards.filter(c => c.section === 'trainers').map((c, i) => {
                const matchedCard = cards.find(card => card.name_en.toLowerCase() === c.name.toLowerCase() || card.name_pt.toLowerCase() === c.name.toLowerCase());
                const displayName = matchedCard ? getCardName(matchedCard) : c.name;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-pokedex-darker hover:bg-slate-800/90 border border-slate-800 transition-colors text-xs"
                  >
                    <div 
                      onClick={() => handleCardClick(c)}
                      className="flex items-center space-x-2 truncate cursor-pointer flex-1"
                    >
                      <span className="font-mono font-bold text-yellow-300">{c.count}x</span>
                      <span className="text-slate-100 font-semibold truncate hover:text-cyan-300">{displayName}</span>
                    </div>
                    <button
                      onClick={() => removeCardFromDeck(currentDeck.id, c.name)}
                      title={t('decks.removeFromDeck')}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Energies Column */}
          <div className="bg-pokedex-card/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-amber-400 font-mono uppercase">{t('decks.energySection', { count: currentDeck.stats.energies })}</span>
            </div>
            <div className="space-y-1.5">
              {currentDeck.cards.filter(c => c.section === 'energies').map((c, i) => {
                const matchedCard = cards.find(card => card.name_en.toLowerCase() === c.name.toLowerCase() || card.name_pt.toLowerCase() === c.name.toLowerCase());
                const displayName = matchedCard ? getCardName(matchedCard) : c.name;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-pokedex-darker hover:bg-slate-800/90 border border-slate-800 transition-colors text-xs"
                  >
                    <div 
                      onClick={() => handleCardClick(c)}
                      className="flex items-center space-x-2 truncate cursor-pointer flex-1"
                    >
                      <span className="font-mono font-bold text-yellow-300">{c.count}x</span>
                      <span className="text-slate-100 font-semibold truncate hover:text-cyan-300">{displayName}</span>
                    </div>
                    <button
                      onClick={() => removeCardFromDeck(currentDeck.id, c.name)}
                      title={t('decks.removeFromDeck')}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
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

      {/* Create New Deck Modal */}
      <CreateDeckModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Edit Deck & Strategic Playbook Modal */}
      <EditDeckModal
        deck={currentDeck}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />

      {/* Deck Validator Modal */}
      {validateModalOpen && (
        <AddCardModal
          isOpen={validateModalOpen}
          onClose={() => setValidateModalOpen(false)}
          initialTab="validate"
        />
      )}
    </div>
  );
};
