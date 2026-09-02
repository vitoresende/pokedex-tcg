import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { HoloCard } from './HoloCard';
import { 
  X, Heart, Plus, Minus, Layers, Sparkles, Save, 
  Trash2, PlusCircle, CheckCircle2 
} from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';
import { findSimilarCards } from '../utils/cardSimilarity';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onNavigateToDeck?: (deckId: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose, onNavigateToDeck }) => {
  const { 
    cards, favorites, toggleFavorite, updateCardQuantity, notes, 
    updateCardNote, decks, addCardToDeck, deleteCard 
  } = useCollection();
  const { t, getCardName, getCardSetName, language } = useLanguage();
  
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

  const similarMatches = findSimilarCards(card, cards, 4);

  const isFavorite = favorites.includes(card.id);
  const cardName = getCardName(card);
  const setName = getCardSetName(card);

  const handleSaveNote = () => {
    soundEffects.playClick();
    updateCardNote(card.id, localNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleDeckClick = (deckId: string) => {
    soundEffects.playClick();
    onClose();
    if (onNavigateToDeck) {
      onNavigateToDeck(deckId);
    }
  };

  const handleAddToDeck = () => {
    if (!selectedDeckForAdd) return;
    addCardToDeck(selectedDeckForAdd, card, 1);
    setCardAddedToDeck(true);
    setTimeout(() => setCardAddedToDeck(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(t('cardDetail.confirmDelete', { name: cardName }))) {
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
              {t('cardDetail.titlePrefix')} {card.set_code} #{card.card_number}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label={t('common.close')}
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
                <span>{isFavorite ? t('cardDetail.favorite') : t('cardDetail.addToFavs')}</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-mono">{t('cardDetail.qty')}</span>
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
              <span>{t('cardDetail.removeCard')}</span>
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
                  {t(`filters.types.${card.color_name.toLowerCase()}`) !== `filters.types.${card.color_name.toLowerCase()}` ? t(`filters.types.${card.color_name.toLowerCase()}`) : card.color_name} • {card.card_category === 'Trainer' ? (language === 'pt' ? 'Treinador' : 'Trainer') : card.card_category === 'Energy' ? (language === 'pt' ? 'Energia' : 'Energy') : 'Pokémon'}
                </span>
                {card.is_foil && (
                  <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('cardDetail.foilHolo')}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold font-sans text-white">{cardName}</h2>
              <p className="text-slate-400 text-xs">
                {language === 'pt' && card.name_en !== card.name_pt ? `EN: ${card.name_en}` : (language === 'en' && card.name_pt !== card.name_en ? `PT: ${card.name_pt}` : '')}
              </p>
            </div>

            {/* Spec Table */}
            <div className="bg-pokedex-darker rounded-2xl p-3 border border-slate-800 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{t('cardDetail.expansionSet')}</span>
                <span className="text-slate-200 font-semibold">{setName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{t('cardDetail.setCode')}</span>
                <span className="text-slate-200">{card.set_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{t('cardDetail.cardNumber')}</span>
                <span className="text-yellow-300 font-bold">{card.card_number} / {card.total_in_set || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{t('cardDetail.rarity')}</span>
                <span className="text-slate-200">{card.rarity_name} ({card.rarity_code})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{t('cardDetail.condition')}</span>
                <span className="text-emerald-400 font-bold">{card.quality || 'NM (Near Mint)'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">{t('cardDetail.language')}</span>
                <span className="text-slate-200">
                  {card.language === 'Português' || card.language === 'Portuguese' ? (language === 'pt' ? 'Português' : 'Portuguese') : (language === 'pt' ? 'Inglês' : 'English')}
                </span>
              </div>
            </div>

            {/* Add to Deck Selector */}
            {decks.length > 0 && (
              <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-2 w-full overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
                  <span>{t('cardDetail.addToDeck')}</span>
                  {cardAddedToDeck && <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('cardDetail.added')}</span>}
                </div>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <select
                    value={selectedDeckForAdd}
                    onChange={(e) => setSelectedDeckForAdd(e.target.value)}
                    aria-label={t('cardDetail.addToDeck')}
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
                    <span>{t('cardDetail.addBtn')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Decks Synergy Tags */}
            {card.decks && card.decks.length > 0 && (
              <div className="bg-purple-950/40 rounded-2xl p-3 border border-purple-800/50">
                <div className="flex items-center space-x-1.5 text-purple-300 font-bold mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t('cardDetail.featuredInDecks')}</span>
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

            {/* Similar / Substitute Cards in Collection */}
            {similarMatches.length > 0 && (
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-1.5 text-yellow-300 font-bold text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>
                    {language === 'pt'
                      ? `Cartas Similares / Substitutas na Coleção (${similarMatches.length})`
                      : `Similar / Substitute Cards in Collection (${similarMatches.length})`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {similarMatches.map(m => (
                    <div 
                      key={m.card.id} 
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2"
                    >
                      <div className="w-7 h-10 shrink-0 rounded overflow-hidden border border-slate-700">
                        <HoloCard card={m.card} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-[11px] text-white truncate">
                          {getCardName(m.card)}
                        </h5>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {m.card.set_code} #{m.card.card_number} • {m.card.quantity}x
                        </span>
                        <span className="text-[9px] text-cyan-300 font-mono truncate block">
                          {language === 'pt' ? m.reasonPt : m.reasonEn}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Notes / Strategy Comment */}
            <div className="space-y-1.5">
              <label htmlFor="card-note-input" className="text-slate-400 flex items-center justify-between">
                <span>{t('cardDetail.personalNotes')}</span>
                {noteSaved && <span className="text-emerald-400 text-[10px]">{t('cardDetail.saved')}</span>}
              </label>
              <textarea
                id="card-note-input"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder={t('cardDetail.notesPlaceholder')}
                rows={2}
                className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-pokedex-blue text-xs resize-none"
              />
              <button
                onClick={handleSaveNote}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-yellow-300" />
                <span>{t('cardDetail.saveCardNote')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
