import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { HoloCard } from './HoloCard';
import { 
  X, Heart, Plus, Minus, Layers, Sparkles, Save, 
  Trash2, PlusCircle, CheckCircle2 
} from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../services/audio';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onNavigateToDeck: (deckId: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose, onNavigateToDeck }) => {
  const { 
    favorites, toggleFavorite, updateCardQuantity, notes, 
    updateCardNote, decks, addCardToDeck, deleteCard 
  } = useCollection();
  const { isAllowed } = useAuth();
  
  const [localNote, setLocalNote] = useState<string>('');
  const [noteSaved, setNoteSaved] = useState<boolean>(false);
  const [selectedDeckForAdd, setSelectedDeckForAdd] = useState<string>(decks[0]?.id || '');
  const [cardAddedToDeck, setCardAddedToDeck] = useState<boolean>(false);

  useEffect(() => {
    if (card) {
      setLocalNote(notes[card.id] || card.comment || '');
      setNoteSaved(false);
      setCardAddedToDeck(false);
      soundEffects.playScan();
    }
  }, [card, notes]);

  if (!card) return null;

  const isFavorite = favorites.includes(card.id);

  const handleSaveNote = () => {
    soundEffects.playClick();
    updateCardNote(card.id, localNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleDeckClick = (deckId: string) => {
    soundEffects.playClick();
    onClose();
    onNavigateToDeck(deckId);
  };

  const handleAddToDeck = () => {
    if (!selectedDeckForAdd) return;
    addCardToDeck(selectedDeckForAdd, card, 1);
    setCardAddedToDeck(true);
    setTimeout(() => setCardAddedToDeck(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Remove "${card.name_en || card.name_pt}" from collection?`)) {
      deleteCard(card.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      {/* Pokédex Device Modal Frame */}
      <div className="relative w-full max-w-2xl bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Top Pokédex Bezel */}
        <div className="bg-pokedex-red px-6 py-3 border-b-2 border-pokedex-darkred flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="font-mono text-xs font-bold text-white tracking-widest uppercase truncate max-w-[300px]">
              Pokédex Data // {card.set_code} #{card.card_number}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start max-h-[80vh] overflow-y-auto">
          {/* Left Column: 3D Holographic Card View */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[260px] aspect-[2.5/3.5] mb-4">
              <HoloCard card={card} isDetailed className="w-full h-full" />
            </div>

            {/* Quick Actions: Favorite & Quantity */}
            <div className="w-full flex items-center justify-between bg-pokedex-darker p-3 rounded-2xl border border-slate-800">
              <button
                onClick={() => toggleFavorite(card.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isFavorite ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Favorite' : 'Add to Favs'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-mono">Qty:</span>
                <button
                  onClick={() => updateCardQuantity(card.id, -1)}
                  disabled={card.quantity <= 0}
                  aria-label="Decrease quantity"
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center text-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-sm text-yellow-300 w-6 text-center">
                  {card.quantity}
                </span>
                <button
                  onClick={() => updateCardQuantity(card.id, 1)}
                  aria-label="Increase quantity"
                  className="w-7 h-7 rounded-lg bg-pokedex-blue hover:bg-blue-600 text-white flex items-center justify-center text-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Delete Card Button */}
            <button
              onClick={handleDelete}
              className="mt-3 text-red-400/80 hover:text-red-400 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove this card from collection</span>
            </button>
          </div>

          {/* Right Column: Detailed Stats, Deck Inclusion & Notes */}
          <div className="space-y-4 text-xs font-mono">
            {/* Titles */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase"
                  style={{
                    backgroundColor: `${card.color_bg}22`,
                    color: card.color_bg,
                    borderColor: `${card.color_bg}66`
                  }}
                >
                  {card.color_name} • {card.card_category}
                </span>
                {card.is_foil && (
                  <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Foil / Holo
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold font-sans text-white">{card.name_en || card.name_pt}</h2>
              <p className="text-slate-400 text-xs">{card.name_pt !== card.name_en ? `PT: ${card.name_pt}` : ''}</p>
            </div>

            {/* Spec Table */}
            <div className="bg-pokedex-darker rounded-2xl p-3 border border-slate-800 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Expansion Set:</span>
                <span className="text-slate-200 font-semibold">{card.set_en || card.set_pt}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Set Code:</span>
                <span className="text-slate-200">{card.set_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Card Number:</span>
                <span className="text-yellow-300 font-bold">{card.card_number} / {card.total_in_set || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rarity:</span>
                <span className="text-slate-200">{card.rarity_name} ({card.rarity_code})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Condition:</span>
                <span className="text-emerald-400 font-bold">{card.quality || 'NM (Near Mint)'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Language:</span>
                <span className="text-slate-200">{card.language}</span>
              </div>
            </div>

            {/* Add to Deck Selector */}
            {decks.length > 0 && (
              <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-2 w-full overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
                  <span>Add to Deck:</span>
                  {cardAddedToDeck && <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Added!</span>}
                </div>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <select
                    value={selectedDeckForAdd}
                    onChange={(e) => setSelectedDeckForAdd(e.target.value)}
                    aria-label="Select deck to add card"
                    className="flex-1 min-w-0 bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pokedex-blue truncate"
                  >
                    {decks.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddToDeck}
                    className="bg-pokedex-blue hover:bg-blue-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0 whitespace-nowrap active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Decks Synergy Tags */}
            {card.decks && card.decks.length > 0 && (
              <div className="bg-purple-950/40 rounded-2xl p-3 border border-purple-800/50">
                <div className="flex items-center space-x-1.5 text-purple-300 font-bold mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Featured in Decks:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {card.decks.map((deckId) => {
                    const deckObj = decks.find(d => d.id === deckId);
                    return (
                      <button
                        key={deckId}
                        onClick={() => handleDeckClick(deckId)}
                        className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-[10px] px-2.5 py-1 rounded-lg border border-purple-400/40 transition-colors flex items-center gap-1"
                      >
                        <span>{deckObj?.name || deckId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Personal Notes / Strategy Comment */}
            <div className="space-y-1.5">
              <label htmlFor="card-note-input" className="text-slate-400 flex items-center justify-between">
                <span>Personal Notes:</span>
                {noteSaved && <span className="text-emerald-400 text-[10px]">Saved!</span>}
              </label>
              <textarea
                id="card-note-input"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Ex: Turn 1 combo with Mewtwo & Mew-GX, save for late-game..."
                rows={2}
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-pokedex-blue text-xs resize-none"
              />
              <button
                onClick={handleSaveNote}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-yellow-300" />
                <span>Save Card Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
