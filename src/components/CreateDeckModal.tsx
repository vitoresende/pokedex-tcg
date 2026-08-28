import React, { useState } from 'react';
import { Layers, X, Plus, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { Card, DeckCardItem } from '../types';
import { soundEffects } from '../services/audio';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ isOpen, onClose }) => {
  const { cards, createNewDeck } = useCollection();

  const [deckName, setDeckName] = useState('');
  const [format, setFormat] = useState<'Standard' | 'Expanded' | 'Casual'>('Standard');
  const [archetype, setArchetype] = useState('Aggro / Beatdown');
  const [summary, setSummary] = useState('');
  const [winCondition, setWinCondition] = useState('');
  const [selectedCards, setSelectedCards] = useState<DeckCardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const totalCards = selectedCards.reduce((acc, c) => acc + c.count, 0);
  const pokemonCount = selectedCards.filter(c => c.section === 'pokemon').reduce((acc, c) => acc + c.count, 0);
  const trainersCount = selectedCards.filter(c => c.section === 'trainers').reduce((acc, c) => acc + c.count, 0);
  const energiesCount = selectedCards.filter(c => c.section === 'energies').reduce((acc, c) => acc + c.count, 0);

  const filteredCollection = cards.filter(c => 
    c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name_pt.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const handleAddCard = (card: Card) => {
    soundEffects.playClick();
    const existing = selectedCards.find(c => c.name.toLowerCase() === (card.name_en || card.name_pt).toLowerCase());
    if (existing) {
      if (existing.count >= 4 && card.card_category !== 'Energy') {
        soundEffects.playAlert();
        return;
      }
      setSelectedCards(prev => prev.map(c => 
        c.name.toLowerCase() === (card.name_en || card.name_pt).toLowerCase()
          ? { ...c, count: c.count + 1 }
          : c
      ));
    } else {
      const section: 'pokemon' | 'trainers' | 'energies' = 
        card.card_category === 'Pokémon' ? 'pokemon' : (card.card_category === 'Trainer' ? 'trainers' : 'energies');
      setSelectedCards(prev => [
        ...prev,
        {
          section,
          name: card.name_en || card.name_pt,
          set: `${card.set_en || card.set_pt} - ${card.set_code} ${card.card_number}`,
          count: 1,
          owned: card.quantity,
          rarity: card.rarity_code
        }
      ]);
    }
  };

  const handleRemoveCard = (cardName: string) => {
    soundEffects.playClick();
    setSelectedCards(prev => {
      const existing = prev.find(c => c.name === cardName);
      if (existing && existing.count > 1) {
        return prev.map(c => c.name === cardName ? { ...c, count: c.count - 1 } : c);
      }
      return prev.filter(c => c.name !== cardName);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) return;

    soundEffects.playScan();
    createNewDeck({
      name: deckName.trim(),
      format: format,
      format_slug: format === 'Expanded' ? 'expanded' : (format === 'Casual' ? 'casual' : 'standard'),
      archetype: archetype.trim() || 'Custom Deck',
      summary: summary.trim() || 'Custom strategy built in Pokédex TCG.',
      win_condition: winCondition.trim() || 'Claim 6 Prize cards with precision strikes.',
      cards: selectedCards,
      stats: {
        pokemon: pokemonCount,
        trainers: trainersCount,
        energies: energiesCount,
        total: totalCards
      },
      energy_breakdown: {
        owned: `${energiesCount} Energies`,
        needed: totalCards < 60 ? `Missing ${60 - totalCards} cards` : 'Full 60-card deck',
        missing_count: Math.max(0, 60 - totalCards)
      },
      strategy_guide: {
        opening: { title: '1. Opening Plan', steps: ['Start with active Basic Pokémon and establish bench.'] },
        midgame: { title: '2. Midgame Plan', steps: ['Evolve attackers and attach energy each turn.'] },
        lategame: { title: '3. Endgame Plan', steps: ['Execute finishing attacks to claim all Prize cards.'] },
      },
      prize_trade_tip: 'Prioritize maintaining the prize trade advantage.'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Top Header */}
        <div className="bg-pokedex-red px-6 py-3 border-b-2 border-pokedex-darkred flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-yellow-300" />
            <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Create New Deck (Deck Builder)
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-pokedex-darkred hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4 font-mono text-xs">
          {/* Deck Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-slate-400 block text-[10px] uppercase mb-1">Deck Name *</label>
              <input
                type="text"
                required
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Ex: Gardevoir Psychic Turbo"
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs font-sans"
              />
            </div>

            <div>
              <label className="text-slate-400 block text-[10px] uppercase mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs"
              >
                <option value="Standard">Standard</option>
                <option value="Expanded">Expanded</option>
                <option value="Casual">Casual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block text-[10px] uppercase mb-1">Archetype</label>
              <input
                type="text"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                placeholder="Ex: Aggro, Control, OHKO, Toolbox"
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block text-[10px] uppercase mb-1">Win Condition</label>
              <input
                type="text"
                value={winCondition}
                onChange={(e) => setWinCondition(e.target.value)}
                placeholder="Ex: High Turn 2 burst damage with energy acceleration"
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs font-sans"
              />
            </div>
          </div>

          {/* Deck Ratio Counters */}
          <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`font-bold text-sm ${totalCards === 60 ? 'text-emerald-400' : 'text-yellow-300'}`}>
                {totalCards} / 60 Cards
              </span>
              <span className="text-[10px] text-blue-400">{pokemonCount} Pokémon</span>
              <span className="text-[10px] text-teal-400">{trainersCount} Trainers</span>
              <span className="text-[10px] text-amber-400">{energiesCount} Energies</span>
            </div>

            {totalCards === 60 ? (
              <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Deck!
              </span>
            ) : (
              <span className="text-slate-400 text-[10px]">
                {60 - totalCards > 0 ? `${60 - totalCards} left` : `${totalCards - 60} excess`}
              </span>
            )}
          </div>

          {/* Card Picker from Collection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 block text-[10px] uppercase">Add Cards from Collection:</label>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection by name or type..."
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-pokedex-blue"
              />
            </div>

            {/* Quick search suggestions */}
            {searchQuery && (
              <div className="bg-black/70 rounded-2xl border border-slate-800 p-2 max-h-36 overflow-y-auto space-y-1">
                {filteredCollection.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-1.5 hover:bg-slate-800 rounded-lg text-xs gap-2 min-w-0">
                    <span className="text-slate-200 truncate flex-1 min-w-0">{card.name_en || card.name_pt} <small className="text-slate-500">({card.set_code})</small></span>
                    <button
                      type="button"
                      onClick={() => handleAddCard(card)}
                      className="bg-pokedex-blue hover:bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap shadow active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Cards in Deck */}
          {selectedCards.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cards in Deck ({selectedCards.length} types):</span>
              <div className="bg-black/50 p-2.5 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto space-y-1">
                {selectedCards.map((c) => (
                  <div key={c.name} className="flex items-center justify-between p-1.5 bg-pokedex-darker rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-300 font-bold">{c.count}x</span>
                      <span className="text-slate-200 truncate max-w-[200px]">{c.name}</span>
                      <span className="text-[10px] text-slate-500">({c.section})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(c.name)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Save Deck</span>
          </button>
        </form>
      </div>
    </div>
  );
};
