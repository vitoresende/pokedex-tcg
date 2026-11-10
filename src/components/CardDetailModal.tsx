import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../types';
import { HoloCard } from './HoloCard';
import { ConfirmModal } from './ConfirmModal';
import { 
  X, Heart, Plus, Minus, Layers, Sparkles, Save, 
  Trash2, PlusCircle, CheckCircle2, Image as ImageIcon, 
  RefreshCw, Search, Loader2, ChevronDown, CircleDollarSign, Star, Calendar 
} from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';
import { findSimilarCards } from '../utils/cardSimilarity';
import { lookupCardOnline, CardLookupResult } from '../services/cardLookup';
import { formatSetWithYear, getSetRegulationMark } from '../utils/setMetadata';
import { downloadAndUploadImageToStorage } from '../services/firebase';
import { getPokemonIdsForCard } from '../utils/nationalPokemonMatcher';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onNavigateToDeck?: (deckId: string) => void;
}

function parsePriceValue(raw: string): number | undefined {
  const trimmed = raw.replace(/[^\d.,]/g, '').trim();
  if (!trimmed) return undefined;
  let normalized = trimmed;
  if (trimmed.includes(',') && trimmed.includes('.')) {
    if (trimmed.lastIndexOf(',') > trimmed.lastIndexOf('.')) {
      normalized = trimmed.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = trimmed.replace(/,/g, '');
    }
  } else if (trimmed.includes(',')) {
    normalized = trimmed.replace(',', '.');
  }
  const parsed = parseFloat(normalized);
  return !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose, onNavigateToDeck }) => {
  const { 
    cards, favorites, toggleFavorite, updateCardQuantity, notes, 
    updateCardNote, decks, addCardToDeck, updateCard, deleteCard, 
    selectDeckCardForPokemon, isReadOnly, showToast, syncing 
  } = useCollection();
  const { t, getCardName, getCardSetName, language } = useLanguage();
  
  const [localNote, setLocalNote] = useState<string>('');
  const [noteSaved, setNoteSaved] = useState<boolean>(false);
  const [selectedDeckForAdd, setSelectedDeckForAdd] = useState<string>(decks[0]?.id || '');
  const [cardAddedToDeck, setCardAddedToDeck] = useState<boolean>(false);

  const [priceInput, setPriceInput] = useState<string>('');
  const [priceDateInput, setPriceDateInput] = useState<string>('');
  const [priceSaved, setPriceSaved] = useState<boolean>(false);
  const [isPriceDirty, setIsPriceDirty] = useState<boolean>(false);
  const prevCardIdRef = useRef<string | null>(null);
  const priceSavedTimerRef = useRef<number | null>(null);

  const [isFixingImage, setIsFixingImage] = useState(false);
  const [isSearchingScans, setIsSearchingScans] = useState(false);
  const [scanResults, setScanResults] = useState<CardLookupResult[]>([]);
  const [imageFixSuccess, setImageFixSuccess] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!card) {
      prevCardIdRef.current = null;
      setIsConfirmDeleteOpen(false);
      return;
    }
    if (prevCardIdRef.current !== card.id) {
      prevCardIdRef.current = card.id;
      setLocalNote(notes[card.id] || card.comment || '');
      setNoteSaved(false);
      setCardAddedToDeck(false);
      setIsFixingImage(false);
      setScanResults([]);
      setIsConfirmDeleteOpen(false);
      setPriceInput(card.price !== undefined && card.price !== null ? String(card.price) : '');
      setPriceDateInput(card.price_updated_at || '');
      setPriceSaved(false);
      setIsPriceDirty(false);
      soundEffects.playScan();
    }
  }, [card, notes]);

  const handleSearchOnlineScans = async () => {
    if (!card || isReadOnly) return;
    soundEffects.playClick();
    setIsSearchingScans(true);
    try {
      const cardLabel = card.name_pt || card.name_en;
      const setHint = card.set_pt || card.set_code || '';
      const queryWithSet = `${cardLabel} ${card.card_number} ${setHint}`.trim();
      let results = await lookupCardOnline(queryWithSet);
      if (results.length === 0) {
        results = await lookupCardOnline(`${cardLabel} ${card.card_number}`.trim());
      }
      if (results.length === 0) {
        results = await lookupCardOnline(cardLabel);
      }
      setScanResults(results);
    } catch (e) {
      console.warn('Error fetching online scans:', e);
    } finally {
      setIsSearchingScans(false);
    }
  };

  const handleApplyScan = async (scan: CardLookupResult) => {
    if (!card || isReadOnly) return;
    soundEffects.playScan();
    const normalizedSetCode = scan.setCode === 'SVI' ? 'SV1' : (scan.setCode || card.set_code);
    const setPt = scan.setName || card.set_pt;
    const cardNumber = scan.cardNumber || card.card_number;
    const targetFilename = `${normalizedSetCode.toLowerCase()}_${cardNumber}.png`;

    let finalImageUrl = scan.imageUrl;
    if (finalImageUrl && !finalImageUrl.includes('firebasestorage.googleapis.com')) {
      try {
        finalImageUrl = await downloadAndUploadImageToStorage(finalImageUrl, targetFilename);
      } catch (err) {
        console.warn('Could not mirror scan image to storage, keeping original URL:', err);
      }
    }

    updateCard(card.id, {
      image_url: finalImageUrl,
      set_code: normalizedSetCode,
      set_pt: setPt,
      set_en: card.set_en || scan.setName,
      card_number: cardNumber,
      name_pt: card.name_pt || scan.namePt,
      name_en: card.name_en || scan.nameEn,
      image_filename: card.image_filename || targetFilename
    });
    setImageFixSuccess(true);
    setIsFixingImage(false);
    setScanResults([]);
    setTimeout(() => setImageFixSuccess(false), 3000);
  };

  if (!card) return null;

  const similarMatches = findSimilarCards(card, cards, 4);

  const isFavorite = favorites.includes(card.id);
  const cardName = getCardName(card);
  const setName = getCardSetName(card);

  const handleSaveNote = () => {
    if (isReadOnly) return;
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

  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    setIsPriceDirty(true);
    setPriceSaved(false);
    if (!priceDateInput && val.trim()) {
      setPriceDateInput(new Date().toISOString().split('T')[0]);
    }
  };

  const commitPriceUpdate = (showFeedback = true): { price: number | undefined; price_updated_at: string | undefined } => {
    const finalPrice = parsePriceValue(priceInput);
    const finalDate = finalPrice !== undefined ? (priceDateInput || new Date().toISOString().split('T')[0]) : undefined;
    if (card && !isReadOnly) {
      updateCard(card.id, {
        price: finalPrice,
        price_updated_at: finalDate
      });
      setIsPriceDirty(false);
      if (showFeedback) {
        soundEffects.playSuccess();
        setPriceSaved(true);
        if (priceSavedTimerRef.current) {
          window.clearTimeout(priceSavedTimerRef.current);
        }
        priceSavedTimerRef.current = window.setTimeout(() => setPriceSaved(false), 4500);
        const currency = language === 'pt' ? 'R$' : '$';
        if (finalPrice !== undefined) {
          showToast(
            language === 'pt'
              ? `✅ Valor de "${cardName}" salvo: ${currency} ${finalPrice.toFixed(2)} (${finalDate})`
              : `✅ Saved value for "${cardName}": ${currency} ${finalPrice.toFixed(2)} (${finalDate})`,
            'success'
          );
        } else {
          showToast(
            language === 'pt'
              ? `Valor removido de "${cardName}"`
              : `Removed value from "${cardName}"`,
            'info'
          );
        }
      }
    }
    return { price: finalPrice, price_updated_at: finalDate };
  };

  const handleSavePrice = () => {
    if (isReadOnly || !card) return;
    commitPriceUpdate(true);
  };

  const handleClearPriceAndDate = () => {
    if (isReadOnly || !card) return;
    soundEffects.playClick();
    setPriceInput('');
    setPriceDateInput('');
    setIsPriceDirty(false);
    updateCard(card.id, {
      price: undefined,
      price_updated_at: undefined
    });
    setPriceSaved(true);
    if (priceSavedTimerRef.current) {
      window.clearTimeout(priceSavedTimerRef.current);
    }
    priceSavedTimerRef.current = window.setTimeout(() => setPriceSaved(false), 4500);
    showToast(
      language === 'pt'
        ? `🗑️ Valor e data removidos de "${cardName}"`
        : `🗑️ Value & date cleared for "${cardName}"`,
      'info'
    );
  };

  const handleModalClose = () => {
    if (!isReadOnly && card && isPriceDirty) {
      commitPriceUpdate(true);
    }
    onClose();
  };

  const matchedPokemonIds = card && card.card_category === 'Pokémon' ? getPokemonIdsForCard(card) : [];
  const hasPokemonMatch = matchedPokemonIds.length > 0;
  const isDeckCard = Boolean(card?.is_deck_card);

  const handleToggleDeckCard = () => {
    if (isReadOnly || !card) return;
    soundEffects.playClick();
    const nextIsMain = !card.is_deck_card;
    if (isPriceDirty) {
      const { price: finalPrice, price_updated_at: finalDate } = commitPriceUpdate(false);
      updateCard(card.id, {
        is_deck_card: nextIsMain,
        price: finalPrice,
        price_updated_at: finalDate
      });
    } else if (hasPokemonMatch) {
      selectDeckCardForPokemon(matchedPokemonIds[0], card.id);
    } else {
      updateCard(card.id, { is_deck_card: nextIsMain });
    }
    showToast(
      nextIsMain
        ? (language === 'pt' ? `⭐ "${cardName}" marcada como Carta Principal!` : `⭐ "${cardName}" marked as Main Card!`)
        : (language === 'pt' ? `"${cardName}" desmarcada como principal` : `"${cardName}" unmarked as main card`),
      'info'
    );
  };

  const handleAddToDeck = () => {
    if (isReadOnly || !selectedDeckForAdd) return;
    addCardToDeck(selectedDeckForAdd, card, 1);
    setCardAddedToDeck(true);
    setTimeout(() => setCardAddedToDeck(false), 2000);
  };

  const handleDelete = () => {
    if (isReadOnly) return;
    soundEffects.playClick();
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (isReadOnly) return;
    deleteCard(card.id);
    showToast(
      language === 'pt'
        ? `🗑️ "${cardName}" removida da coleção`
        : `🗑️ "${cardName}" removed from collection`,
      'info'
    );
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
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
            onClick={handleModalClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full bg-pokedex-darkred hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start max-h-[80vh] overflow-y-auto overflow-x-hidden">
          {/* Left Column: 3D Holographic Card View */}
          <div className="flex flex-col items-center min-w-0 w-full">
            <div className="w-full max-w-[260px] aspect-[2.5/3.5] mb-4">
              <HoloCard card={card} isDetailed className="w-full h-full" />
            </div>

            {/* Quick Actions: Favorite & Quantity */}
            <div className="w-full flex items-center justify-between bg-pokedex-darker p-3 rounded-2xl border border-slate-800">
              <button
                onClick={() => !isReadOnly && toggleFavorite(card.id)}
                disabled={isReadOnly}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isFavorite ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? t('cardDetail.favorite') : t('cardDetail.addToFavs')}</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-mono">{t('cardDetail.qty')}</span>
                {!isReadOnly && (
                  <button
                    onClick={() => updateCardQuantity(card.id, -1)}
                    disabled={card.quantity <= 0}
                    aria-label="Decrease quantity"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center text-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="font-mono font-bold text-sm text-yellow-300 w-6 text-center">
                  {card.quantity}
                </span>
                {!isReadOnly && (
                  <button
                    onClick={() => updateCardQuantity(card.id, 1)}
                    aria-label="Increase quantity"
                    className="w-7 h-7 rounded-lg bg-pokedex-blue hover:bg-blue-600 text-white flex items-center justify-center text-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Image / Scan Correction Trigger & Delete Card (Owner only) */}
            {!isReadOnly && (
              <>
                <div className="w-full mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setIsFixingImage(!isFixingImage);
                      if (!isFixingImage && scanResults.length === 0) {
                        handleSearchOnlineScans();
                      }
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-yellow-300 hover:text-yellow-200 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{language === 'pt' ? 'Buscar / Atualizar Imagem Oficial' : 'Search / Update Official Scan'}</span>
                  </button>

                  {imageFixSuccess && (
                    <p className="text-emerald-400 text-[10px] font-mono text-center mt-1 flex items-center justify-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{language === 'pt' ? 'Imagem atualizada com sucesso!' : 'Image updated successfully!'}</span>
                    </p>
                  )}

                  {/* Scans Drawer */}
                  {isFixingImage && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {language === 'pt' ? 'Scans Oficiais Encontrados:' : 'Found Official Scans:'}
                        </span>
                        <button
                          type="button"
                          onClick={handleSearchOnlineScans}
                          disabled={isSearchingScans}
                          className="text-yellow-400 hover:text-yellow-300 text-[10px] font-mono flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSearchingScans ? 'animate-spin' : ''}`} />
                          <span>{language === 'pt' ? 'Rebuscar' : 'Refresh'}</span>
                        </button>
                      </div>

                      {isSearchingScans ? (
                        <div className="py-4 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                          <span>{language === 'pt' ? 'Consultando base de scans...' : 'Looking up scans...'}</span>
                        </div>
                      ) : scanResults.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                          {scanResults.map(scan => (
                            <button
                              key={scan.id}
                              type="button"
                              onClick={() => handleApplyScan(scan)}
                              className="flex flex-col items-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-400 text-left transition-all group"
                            >
                              {scan.imageUrl ? (
                                <img src={scan.imageUrl} alt="" className="w-14 h-20 object-cover rounded shadow group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-14 h-20 bg-slate-800 rounded flex items-center justify-center text-[9px] text-slate-500">Sem scan</div>
                              )}
                              <span className="font-bold text-[10px] text-white mt-1 text-center truncate w-full">{scan.setName}</span>
                              <span className="text-[9px] text-slate-400 font-mono text-center">#{scan.cardNumber}</span>
                              <span className="text-[9px] text-yellow-400 font-bold mt-0.5 group-hover:underline">Aplicar</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-mono text-center py-2">
                          {language === 'pt' ? 'Nenhum scan correspondente encontrado automaticamente.' : 'No matching scans found automatically.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete Card Button */}
                <button
                  onClick={handleDelete}
                  className="mt-3 text-red-400/80 hover:text-red-400 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('cardDetail.removeCard')}</span>
                </button>
              </>
            )}
          </div>

          {/* Right Column: Detailed Stats, Deck Inclusion & Notes */}
          <div className="space-y-4 text-xs font-mono min-w-0 w-full">
            {/* Titles */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase max-w-full truncate"
                  style={{ 
                    backgroundColor: `${card.color_bg}22`,
                    color: card.color_bg,
                    borderColor: `${card.color_bg}66`
                  }}
                >
                  {t(`filters.types.${card.color_name.toLowerCase()}`) !== `filters.types.${card.color_name.toLowerCase()}` ? t(`filters.types.${card.color_name.toLowerCase()}`) : card.color_name} • {card.card_category === 'Trainer' ? (language === 'pt' ? 'Treinador' : 'Trainer') : card.card_category === 'Energy' ? (language === 'pt' ? 'Energia' : 'Energy') : 'Pokémon'}
                </span>
                {card.is_foil && (
                  <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 shrink-0" /> {t('cardDetail.foilHolo')}
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
                <span className="text-slate-200 font-semibold">{formatSetWithYear(card.set_code, setName)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{t('cardDetail.setCode')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-200">{card.set_code}</span>
                  {getSetRegulationMark(card.set_code, setName) && (
                    <span className="bg-slate-800 text-yellow-300 font-bold px-1.5 py-0.2 rounded border border-yellow-400/40 font-mono text-[10px]" title="Marca de Regulamentação">
                      [{getSetRegulationMark(card.set_code, setName)}]
                    </span>
                  )}
                </div>
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

            {/* Market Value & Main Card Configuration */}
            <div className="bg-pokedex-darker rounded-2xl p-3.5 border border-slate-800 space-y-2.5 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 text-yellow-300 font-bold text-[11px] uppercase tracking-wider truncate">
                  <CircleDollarSign className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="truncate">{t('cardDetail.priceSectionTitle')}</span>
                </div>
                {priceSaved && (
                  <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1 font-mono shrink-0 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('cardDetail.priceSaved')}</span>
                  </span>
                )}
              </div>

              {/* Chosen Main Card Toggle (Compact single-row pill) */}
              <button
                type="button"
                onClick={handleToggleDeckCard}
                disabled={isReadOnly}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                  isDeckCard
                    ? 'bg-amber-500/20 text-yellow-300 border-yellow-400/50 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Star className={`w-4 h-4 shrink-0 ${isDeckCard ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                  <span className="truncate">{t('cardDetail.deckCardToggle')}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-black shrink-0 ${
                  isDeckCard ? 'bg-yellow-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isDeckCard
                    ? (language === 'pt' ? '✓ ATIVA' : '✓ ACTIVE')
                    : (language === 'pt' ? 'MARCAR' : 'SELECT')}
                </span>
              </button>

              {/* Current Price Status Badge */}
              {card.price !== undefined && Number(card.price) > 0 ? (
                <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-emerald-300 font-black text-sm truncate">
                      {language === 'pt' ? 'R$' : '$'} {Number(card.price).toFixed(2)}
                    </span>
                  </div>
                  {card.price_updated_at && (
                    <span className="text-slate-300 text-[11px] font-mono shrink-0">
                      {card.price_updated_at}
                    </span>
                  )}
                </div>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="truncate">
                    {language === 'pt' ? 'Sem valor cadastrado' : 'No value registered'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">R$ 0,00</span>
                </div>
              )}

              {/* Inputs for Price and Updated Date */}
              {!isReadOnly ? (
                <div className="space-y-2 pt-0.5 min-w-0 w-full">
                  <div className="grid grid-cols-1 gap-2 w-full min-w-0">
                    {/* Price Input (Full Width) */}
                    <div className="w-full min-w-0">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1 truncate">
                        {t('cardDetail.priceLabel')}
                      </label>
                      <div className="relative w-full min-w-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-yellow-400 pointer-events-none">
                          {language === 'pt' ? 'R$' : '$'}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={priceInput}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSavePrice();
                            }
                          }}
                          placeholder="0,00"
                          className="w-full max-w-full min-w-0 bg-slate-900/90 border border-slate-700 rounded-xl pl-8 pr-2.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-colors box-border block"
                        />
                      </div>
                    </div>

                    {/* Date Input (Full Width — prevents overflow on both mobile & desktop) */}
                    <div className="w-full max-w-full min-w-0 overflow-hidden">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1 truncate">
                        {t('cardDetail.priceUpdatedLabel')}
                      </label>
                      <input
                        type="date"
                        value={priceDateInput}
                        onChange={(e) => {
                          setPriceDateInput(e.target.value);
                          setIsPriceDirty(true);
                          setPriceSaved(false);
                        }}
                        className="w-full max-w-full min-w-0 appearance-none bg-slate-900/90 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer box-border block [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Unsaved Changes Hint */}
                  {isPriceDirty && !priceSaved && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono flex items-center justify-between animate-in fade-in">
                      <span className="truncate">
                        {language === 'pt'
                          ? '⚠️ Valor alterado — clique em Salvar'
                          : '⚠️ Value modified — click Save'}
                      </span>
                    </div>
                  )}

                  {/* Save Price & Clear Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleSavePrice}
                      className={`flex-1 py-2 px-3 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow active:scale-[0.98] border min-w-0 ${
                        priceSaved && card.price !== undefined
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-yellow-300 shadow-md'
                      }`}
                    >
                      {priceSaved && card.price !== undefined ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                          <span className="truncate">{language === 'pt' ? 'Salvo!' : 'Saved!'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                          <span className="truncate">{t('cardDetail.savePrice')}</span>
                        </>
                      )}
                    </button>

                    {(card.price !== undefined || Boolean(card.price_updated_at) || Boolean(priceInput.trim()) || Boolean(priceDateInput.trim())) && (
                      <button
                        type="button"
                        onClick={handleClearPriceAndDate}
                        title={language === 'pt' ? 'Limpar valor e data' : 'Clear value and date'}
                        className="py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-red-950/60 hover:bg-red-900/70 text-red-300 hover:text-white border border-red-500/40 active:scale-[0.98] shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('cardDetail.clearPrice')}</span>
                      </button>
                    )}
                  </div>

                  {/* Explicit Persistent Saved Banner inside Modal */}
                  {priceSaved && (
                    <div className="px-2.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-400/60 text-emerald-200 text-[10px] font-mono flex items-center justify-between gap-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold truncate">
                          {card.price !== undefined
                            ? `R$ ${Number(card.price).toFixed(2)}`
                            : t('cardDetail.priceCleared')}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                        {syncing
                          ? (language === 'pt' ? 'Sincronizando...' : 'Syncing...')
                          : (language === 'pt' ? '✓ Nuvem' : '✓ Synced')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between py-1 border-t border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">{t('cardDetail.priceLabel')}</span>
                  <span className="text-yellow-300 font-bold">
                    {card.price !== undefined ? `${language === 'pt' ? 'R$' : '$'} ${card.price.toFixed(2)}` : '—'}
                    {card.price_updated_at ? ` (${card.price_updated_at})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Add to Deck Selector */}
            {!isReadOnly && decks.length > 0 && (
              <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-2 w-full overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
                  <span>{t('cardDetail.addToDeck')}</span>
                  {cardAddedToDeck && <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('cardDetail.added')}</span>}
                </div>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={selectedDeckForAdd}
                      onChange={(e) => setSelectedDeckForAdd(e.target.value)}
                      aria-label={t('cardDetail.addToDeck')}
                      className="w-full appearance-none bg-black/60 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-pokedex-blue truncate font-sans cursor-pointer"
                    >
                      {decks.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
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
            {!isReadOnly ? (
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
            ) : localNote ? (
              <div className="space-y-1.5">
                <span className="text-slate-400 block">{t('cardDetail.personalNotes')}</span>
                <div className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs font-sans">
                  {localNote}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title={language === 'pt' ? 'Remover Carta // Confirmação' : 'Remove Card // Confirmation'}
        message={t('cardDetail.confirmDelete', { name: cardName })}
        description={
          language === 'pt'
            ? `Esta ação removerá "${cardName}" (${card.set_code} #${card.card_number}) da sua coleção.`
            : `This action will remove "${cardName}" (${card.set_code} #${card.card_number}) from your collection.`
        }
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
