import React, { useState } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  X
} from 'lucide-react';
import { useCollection, isKnownEnergy, isKnownTrainer } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';
import { Card } from '../types';
import { HoloCard } from './HoloCard';
import { CardDetailModal } from './CardDetailModal';
import { findSimilarCards, SimilarCardMatch } from '../utils/cardSimilarity';

export interface ValidatedCardItem {
  id: string;
  setPt: string;
  setEn: string;
  setCode: string;
  cardPt: string;
  cardEn: string;
  cardNum: string;
  category: 'Pokémon' | 'Trainer' | 'Energy';
  color: string;
  colorName: string;
  colorBg: string;
  requiredQty: number;
  ownedExactQty: number;
  ownedTotalQty: number;
  missingQty: number;
  isComplete: boolean;
  isBasicEnergy: boolean;
  alternativeCopies: number;
  matchedCard?: Card;
  mockCard: Card;
  similarCards: SimilarCardMatch[];
}

export interface ValidationSummary {
  deckName: string;
  totalRequired: number;
  totalOwned: number;
  totalMissing: number;
  readinessPercent: number;
  uniqueTotal: number;
  uniqueMissing: number;
  uniqueComplete: number;
  items: ValidatedCardItem[];
}

const COLOR_MAP: Record<string, { name: string; bg: string }> = {
  'G': { name: 'Grass', bg: '#22c55e' },
  'R': { name: 'Fire', bg: '#ef4444' },
  'W': { name: 'Water', bg: '#3b82f6' },
  'L': { name: 'Lightning', bg: '#eab308' },
  'P': { name: 'Psychic', bg: '#a855f7' },
  'F': { name: 'Fighting', bg: '#f97316' },
  'D': { name: 'Darkness', bg: '#475569' },
  'M': { name: 'Metal', bg: '#94a3b8' },
  'Y': { name: 'Fairy', bg: '#ec4899' },
  'N': { name: 'Dragon', bg: '#d97706' },
  'C': { name: 'Colorless', bg: '#cbd5e1' },
  '': { name: 'Colorless', bg: '#64748b' }
};

const SAMPLE_CSV = `Edicao,Edicao (Sigla),Colecao (Sigla),Nome (PT),Nome (EN),Quantidade,Foil,Idioma,Raridade,Cor,Preco Minimo,Numero,Comentario,Total da Colecao
Rivais Predestinados,Destined Rivals,DRI,Articuno da Equipe Rocket,Team Rocket's Articuno,1,N,PT,R,W,,051,,182
Rivais Predestinados,Destined Rivals,DRI,Mewtwo ex da Equipe Rocket,Team Rocket's Mewtwo ex,3,N,PT,E,P,,081,,182
Escarlate e Violeta,Scarlet & Violet,SV1,Ultra Bola,Ultra Ball,4,N,PT,U,T,,196,,198
Escarlate e Violeta,Scarlet & Violet,SV1,Substituição,Switch,2,N,PT,C,T,,194,,198
Fagulhas Impetuosas,Surging Sparks,SSP,Substituição Confusa,Scramble Switch,1,N,PT,A,T,,186,,191
Fábulas Nebulosas,Shrouded Fable,SFA,Maca Noturna,Night Stretcher,2,N,PT,U,T,,061,,064
Energia Básica - Escarlate e Violeta,Basic Energy - Scarlet & Violet,SV-BE,Energia de Escuridão (Coroa Estelar),Darkness Energy (Stellar Crown),6,N,PT,C,D,,SVE015,,032
Energia Básica - Escarlate e Violeta,Basic Energy - Scarlet & Violet,SV-BE,Energia Psíquica (Coroa Estelar),Psychic Energy (Stellar Crown),6,N,PT,C,P,,SVE013,,032`;

export const DeckValidatorTab: React.FC = () => {
  const { cards } = useCollection();
  const { t } = useLanguage();

  const [csvText, setCsvText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
  const [filter, setFilter] = useState<'all' | 'missing' | 'complete'>('all');
  const [selectedCardForModal, setSelectedCardForModal] = useState<Card | null>(null);
  const [copied, setCopied] = useState(false);

  // Substitutes state: item.id -> array of { card: Card, count: number }
  const [substitutes, setSubstitutes] = useState<Record<string, { card: Card; count: number }[]>>({});
  const [expandedSimilar, setExpandedSimilar] = useState<Record<string, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Helper for parsing CSV line with quote escaping
  const parseCsvLine = (line: string): string[] => {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim().replace(/^"|"$/g, ''));
    return parts;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      soundEffects.playClick();
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setCsvText(text);
      };
      reader.readAsText(file, 'latin1');
    }
  };

  const handleValidate = () => {
    if (!csvText.trim()) return;
    soundEffects.playClick();

    const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Reset substitutes and expanded state for a new validation run
    setSubstitutes({});
    setExpandedSimilar({});
    setSearchQueries({});

    // Intermediate aggregation to handle duplicate cards in the same deck
    const aggregatedMap = new Map<string, {
      setPt: string;
      setEn: string;
      setCode: string;
      cardPt: string;
      cardEn: string;
      cardNum: string;
      color: string;
      totalRequired: number;
    }>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && (
        line.toLowerCase().includes('edicao') || 
        line.toLowerCase().includes('edição') || 
        line.toLowerCase().includes('nome') ||
        line.toLowerCase().includes('quantidade')
      )) {
        continue;
      }

      const parts = parseCsvLine(line);
      if (parts.length < 4) continue;

      const setPt = parts[0] || 'Imported Set';
      const setEn = parts[1] || setPt;
      const setCode = (parts[2] || 'IMP').toUpperCase();
      const cardPt = parts[3] || 'Carta';
      const cardEn = parts[4] || cardPt;
      const qty = parseInt(parts[5], 10) || 1;
      const color = (parts[9] || '').toUpperCase();
      const cardNum = parts[11] || '1';

      // Aggregation key: basic energies by color code; others by normalized name and set
      const isEnergy = isKnownEnergy(cardPt, cardEn, setCode, color, cardNum);
      const isBasicEnergy = isEnergy && (
        setCode === 'BAS' || 
        setCode === 'SVE' || 
        setCode === 'SV-BE' || 
        cardPt.toLowerCase().includes('energia') ||
        ['G','R','W','L','P','F','D','M','Y'].includes(color)
      );

      const groupKey = isBasicEnergy 
        ? `basic-energy-${color || 'C'}`
        : `${cardEn.toLowerCase()}_${setCode.toLowerCase()}_${cardNum}`;

      if (aggregatedMap.has(groupKey)) {
        const existing = aggregatedMap.get(groupKey)!;
        existing.totalRequired += qty;
      } else {
        aggregatedMap.set(groupKey, {
          setPt,
          setEn,
          setCode,
          cardPt,
          cardEn,
          cardNum,
          color,
          totalRequired: qty,
        });
      }
    }

    if (aggregatedMap.size === 0) {
      alert(t('validator.noCardsParsed'));
      return;
    }

    const validatedItems: ValidatedCardItem[] = [];

    aggregatedMap.forEach((entry, key) => {
      const isEnergy = isKnownEnergy(entry.cardPt, entry.cardEn, entry.setCode, entry.color, entry.cardNum);
      const isBasicEnergy = isEnergy && (
        entry.setCode === 'BAS' || 
        entry.setCode === 'SVE' || 
        entry.setCode === 'SV-BE' || 
        entry.cardPt.toLowerCase().includes('energia') ||
        ['G','R','W','L','P','F','D','M','Y'].includes(entry.color)
      );
      const isTrainer = !isEnergy && (isKnownTrainer(entry.cardPt, entry.cardEn) || entry.color === '' || entry.color === 'T');
      const category: 'Pokémon' | 'Trainer' | 'Energy' = isEnergy ? 'Energy' : isTrainer ? 'Trainer' : 'Pokémon';

      let ownedExactQty = 0;
      let ownedTotalQty = 0;
      let matchedCard: Card | undefined = undefined;

      if (isBasicEnergy) {
        // For basic energies, any basic energy card of this color in the collection counts!
        const matchingEnergies = cards.filter(c => 
          c.card_category === 'Energy' && 
          (c.color_code === entry.color || c.name_pt.toLowerCase().includes('energia'))
        );
        ownedTotalQty = matchingEnergies.reduce((acc, c) => acc + (c.quantity || 1), 0);
        
        const exactMatches = matchingEnergies.filter(c => 
          c.set_code.toUpperCase() === entry.setCode && c.card_number === entry.cardNum
        );
        ownedExactQty = exactMatches.reduce((acc, c) => acc + (c.quantity || 1), 0);
        matchedCard = exactMatches[0] || matchingEnergies[0];
      } else {
        // Non-basic energy: check exact set+number and cross-set matching by name
        const exactMatches = cards.filter(c => 
          c.set_code.toUpperCase() === entry.setCode && 
          c.card_number.replace(/^0+/, '') === entry.cardNum.replace(/^0+/, '')
        );
        ownedExactQty = exactMatches.reduce((acc, c) => acc + (c.quantity || 1), 0);

        const nameMatches = cards.filter(c => 
          c.name_en.toLowerCase() === entry.cardEn.toLowerCase() || 
          c.name_pt.toLowerCase() === entry.cardPt.toLowerCase()
        );
        ownedTotalQty = nameMatches.reduce((acc, c) => acc + (c.quantity || 1), 0);
        matchedCard = exactMatches[0] || nameMatches[0];
      }

      const missingQty = Math.max(0, entry.totalRequired - ownedTotalQty);
      const isComplete = ownedTotalQty >= entry.totalRequired;
      const alternativeCopies = Math.max(0, ownedTotalQty - ownedExactQty);

      const colorInfo = COLOR_MAP[entry.color] || COLOR_MAP[''];

      // Construct a mock Card object for rendering in HoloCard
      const mockCard: Card = matchedCard || {
        id: `mock-${key}`,
        name_pt: entry.cardPt,
        name_en: entry.cardEn,
        set_code: entry.setCode,
        card_number: entry.cardNum,
        set_name: entry.setPt,
        quantity: ownedTotalQty,
        card_category: category,
        color_code: entry.color,
        color_name: colorInfo.name,
        color_bg: colorInfo.bg,
        is_foil: false,
        image_url: ''
      };

      // Find similar cards from collection if missing or incomplete
      const similarCards = missingQty > 0 ? findSimilarCards({
        id: matchedCard?.id,
        name_pt: entry.cardPt,
        name_en: entry.cardEn,
        card_category: category,
        color_code: entry.color,
        set_code: entry.setCode,
        card_number: entry.cardNum
      }, cards, 6) : [];

      validatedItems.push({
        id: key,
        setPt: entry.setPt,
        setEn: entry.setEn,
        setCode: entry.setCode,
        cardPt: entry.cardPt,
        cardEn: entry.cardEn,
        cardNum: entry.cardNum,
        category,
        color: entry.color,
        colorName: colorInfo.name,
        colorBg: colorInfo.bg,
        requiredQty: entry.totalRequired,
        ownedExactQty,
        ownedTotalQty,
        missingQty,
        isComplete,
        isBasicEnergy,
        alternativeCopies,
        matchedCard,
        mockCard,
        similarCards
      });
    });

    // Sort items: Missing cards first, then by category (Pokémon -> Trainers -> Energy)
    validatedItems.sort((a, b) => {
      if (a.missingQty > 0 && b.missingQty === 0) return -1;
      if (a.missingQty === 0 && b.missingQty > 0) return 1;
      const catOrder = { 'Pokémon': 0, 'Trainer': 1, 'Energy': 2 };
      return (catOrder[a.category] || 0) - (catOrder[b.category] || 0);
    });

    const totalRequired = validatedItems.reduce((acc, item) => acc + item.requiredQty, 0);
    const totalMissing = validatedItems.reduce((acc, item) => acc + item.missingQty, 0);
    const totalOwned = Math.max(0, totalRequired - totalMissing);
    const readinessPercent = totalRequired > 0 ? Math.round((totalOwned / totalRequired) * 100) : 0;
    const uniqueTotal = validatedItems.length;
    const uniqueMissing = validatedItems.filter(i => i.missingQty > 0).length;
    const uniqueComplete = uniqueTotal - uniqueMissing;

    setValidationResult({
      deckName: 'Deck Validado',
      totalRequired,
      totalOwned,
      totalMissing,
      readinessPercent,
      uniqueTotal,
      uniqueMissing,
      uniqueComplete,
      items: validatedItems
    });
  };

  const handleAssignSubstitute = (itemId: string, card: Card) => {
    soundEffects.playClick();
    setSubstitutes(prev => {
      const currentList = prev[itemId] || [];
      const existingIndex = currentList.findIndex(s => s.card.id === card.id);
      if (existingIndex >= 0) {
        const updated = [...currentList];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1
        };
        return { ...prev, [itemId]: updated };
      } else {
        return { ...prev, [itemId]: [...currentList, { card, count: 1 }] };
      }
    });
  };

  const handleRemoveSubstitute = (itemId: string, cardId: string) => {
    soundEffects.playClick();
    setSubstitutes(prev => {
      const currentList = prev[itemId] || [];
      const filtered = currentList.filter(s => s.card.id !== cardId);
      if (filtered.length === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: filtered };
    });
  };

  const toggleExpanded = (itemId: string) => {
    soundEffects.playClick();
    setExpandedSimilar(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCopyMissingList = () => {
    if (!validationResult) return;
    soundEffects.playClick();

    const missingItems = validationResult.items.filter(i => i.missingQty > 0);
    if (missingItems.length === 0) {
      navigator.clipboard.writeText(t('validator.noMissing'));
    } else {
      let text = `📋 Cartas Faltantes para o Deck (${validationResult.totalMissing} no total):\n\n`;
      missingItems.forEach(item => {
        const itemSubs = substitutes[item.id] || [];
        const subCount = itemSubs.reduce((acc, s) => acc + s.count, 0);
        const remMissing = Math.max(0, item.missingQty - subCount);

        text += `- ${item.missingQty}x ${item.cardPt} (${item.cardEn}) [${item.setCode} #${item.cardNum}] - Você possui ${item.ownedTotalQty}/${item.requiredQty}\n`;
        if (itemSubs.length > 0) {
          text += `  ↳ Substituições atribuídas (${subCount}x): ${itemSubs.map(s => `${s.count}x ${s.card.name_pt} (${s.card.set_code} #${s.card.card_number})`).join(', ')}\n`;
          if (remMissing > 0) {
            text += `  ↳ Ainda faltam: ${remMissing}x\n`;
          } else {
            text += `  ↳ Totalmente coberta por cartas substitutas!\n`;
          }
        }
      });
      navigator.clipboard.writeText(text);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    soundEffects.playClick();
    setValidationResult(null);
    setSubstitutes({});
    setExpandedSimilar({});
    setFilter('all');
  };

  const filteredItems = validationResult ? validationResult.items.filter(item => {
    if (filter === 'missing') return item.missingQty > 0;
    if (filter === 'complete') return item.isComplete;
    return true;
  }) : [];

  // Calculations taking assigned substitutes into account
  const totalSubstitutesCount = Object.values(substitutes).flat().reduce((acc, s) => acc + s.count, 0);
  const totalOwnedWithSubs = validationResult 
    ? Math.min(validationResult.totalRequired, validationResult.totalOwned + totalSubstitutesCount)
    : 0;
  const readinessWithSubs = (validationResult && validationResult.totalRequired > 0)
    ? Math.round((totalOwnedWithSubs / validationResult.totalRequired) * 100)
    : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Input View */}
      {!validationResult ? (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start space-x-3 mb-3">
              <Info className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  {t('validator.title')}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {t('validator.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl flex items-center space-x-2 text-xs transition-colors border border-slate-700">
                <Upload className="w-4 h-4 text-yellow-400" />
                <span>{t('validator.uploadHelp').split(':')[0]}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => { soundEffects.playClick(); setCsvText(SAMPLE_CSV); }}
                className="text-[11px] text-yellow-400/90 hover:text-yellow-300 underline font-mono flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Carregar Exemplo</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              {t('addCard.csvHelp')}
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Cole aqui o CSV no formato LigaPokémon (Edicao, Nome, Quantidade, etc.)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono text-[11px] leading-relaxed transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleValidate}
            disabled={!csvText.trim()}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2 border border-yellow-300/40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('validator.validateBtn')}</span>
          </button>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-5">
          {/* Header Banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
            validationResult.totalMissing === 0 || readinessWithSubs === 100
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
              : 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-3">
                {validationResult.totalMissing === 0 || readinessWithSubs === 100 ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>
                      {validationResult.totalMissing === 0
                        ? t('validator.deckComplete')
                        : readinessWithSubs === 100
                        ? 'Deck 100% Completo com Substitutas!'
                        : t('validator.deckIncomplete')}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {validationResult.totalMissing === 0
                      ? t('validator.deckCompleteDesc', { total: validationResult.totalRequired })
                      : t('validator.deckIncompleteDesc', {
                          owned: validationResult.totalOwned,
                          total: validationResult.totalRequired,
                          percent: validationResult.readinessPercent,
                          missing: validationResult.totalMissing
                        })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopyMissingList}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-1.5 border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{t('validator.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{t('validator.copyMissingList')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition-colors border border-slate-700"
                  title={t('validator.newValidation')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar with Dual Level (Original vs With Substitutes) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>
                  {totalSubstitutesCount > 0 
                    ? t('validator.readinessWithSubstitutes', {
                        percent: readinessWithSubs,
                        count: totalOwnedWithSubs,
                        total: validationResult.totalRequired
                      })
                    : t('validator.readiness')}
                </span>
                <span className="font-bold text-yellow-300">
                  {totalSubstitutesCount > 0 ? `${readinessWithSubs}%` : `${validationResult.readinessPercent}%`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 relative">
                {/* Base owned bar */}
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${validationResult.readinessPercent}%` }}
                />
                {/* Additional with substitutes bar */}
                {totalSubstitutesCount > 0 && (
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-teal-400 to-emerald-500 opacity-80 transition-all duration-500"
                    style={{ 
                      left: `${validationResult.readinessPercent}%`, 
                      width: `${Math.max(0, readinessWithSubs - validationResult.readinessPercent)}%` 
                    }}
                  />
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
              <div className="bg-slate-900/60 rounded-xl p-2 text-center border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{t('validator.totalInDeck')}</span>
                <span className="font-bold text-sm sm:text-base text-white">{validationResult.totalRequired}</span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-2 text-center border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{t('validator.inCollection')}</span>
                <span className="font-bold text-sm sm:text-base text-emerald-400">{validationResult.totalOwned}</span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-2 text-center border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Substitutas</span>
                <span className="font-bold text-sm sm:text-base text-cyan-400">+{totalSubstitutesCount}</span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-2 text-center border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{t('validator.missingCount')}</span>
                <span className={`font-bold text-sm sm:text-base ${Math.max(0, validationResult.totalMissing - totalSubstitutesCount) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Math.max(0, validationResult.totalMissing - totalSubstitutesCount)}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => { soundEffects.playClick(); setFilter('all'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                filter === 'all'
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('validator.filterAll', { count: validationResult.uniqueTotal })}
            </button>
            <button
              onClick={() => { soundEffects.playClick(); setFilter('missing'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                filter === 'missing'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('validator.filterMissing', { count: validationResult.uniqueMissing })}
            </button>
            <button
              onClick={() => { soundEffects.playClick(); setFilter('complete'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                filter === 'complete'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('validator.filterComplete', { count: validationResult.uniqueComplete })}
            </button>
          </div>

          {/* Card Items List */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                {filter === 'missing' ? t('validator.noMissing') : 'Nenhuma carta nesta seleção.'}
              </div>
            ) : (
              filteredItems.map(item => {
                const itemSubs = substitutes[item.id] || [];
                const subCount = itemSubs.reduce((acc, s) => acc + s.count, 0);
                const remMissing = Math.max(0, item.missingQty - subCount);
                const isMissing = item.missingQty > 0;
                const isExpanded = Boolean(expandedSimilar[item.id]);
                const searchQuery = searchQueries[item.id] || '';

                // Filter collection cards for manual search
                const searchedCollection = searchQuery.trim()
                  ? cards.filter(c => 
                      c.quantity > 0 && 
                      (c.name_pt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.set_code.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).slice(0, 4)
                  : [];

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      remMissing > 0
                        ? 'bg-slate-900/85 border-rose-900/60'
                        : isMissing
                        ? 'bg-slate-900/85 border-cyan-900/60'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Thumbnail, Identity & Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div 
                          className="w-10 h-14 shrink-0 cursor-pointer rounded-lg overflow-hidden border border-slate-700 hover:scale-105 transition-transform"
                          onClick={() => item.matchedCard && setSelectedCardForModal(item.matchedCard)}
                          title="Ver Detalhes"
                        >
                          <HoloCard card={item.mockCard} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              item.category === 'Pokémon' ? 'bg-amber-900/60 text-amber-200' :
                              item.category === 'Trainer' ? 'bg-blue-900/60 text-blue-200' :
                              'bg-purple-900/60 text-purple-200'
                            }`}>
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.setCode} #{item.cardNum}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-white truncate drop-shadow-sm mt-0.5">
                            {item.cardPt}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.cardEn}
                          </p>

                          {item.alternativeCopies > 0 && (
                            <span className="text-[9px] text-cyan-400 font-mono block mt-0.5">
                              {t('validator.inOtherEditions', { count: item.alternativeCopies })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantities & Status Pill */}
                      <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                        <div className="text-[11px] font-mono text-slate-300">
                          <span className="text-slate-400">{t('validator.needed')}: </span>
                          <span className="font-bold text-white">{item.requiredQty}</span>
                          <span className="mx-1 text-slate-600">|</span>
                          <span className="text-slate-400">{t('validator.owned')}: </span>
                          <span className={`font-bold ${item.ownedTotalQty >= item.requiredQty ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.ownedTotalQty}
                          </span>
                        </div>

                        {remMissing > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="w-3 h-3" />
                            <span>{t('validator.missing', { count: remMissing })}</span>
                          </span>
                        ) : subCount > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Substituída ({item.ownedTotalQty + subCount}/{item.requiredQty})</span>
                          </span>
                        ) : item.ownedTotalQty > item.requiredQty ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('validator.surplus', { count: item.ownedTotalQty - item.requiredQty })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>OK ({item.ownedTotalQty}/{item.requiredQty})</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Assigned Substitutes Badges */}
                    {itemSubs.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1 font-bold">
                          <span>🔄 Substituição:</span>
                        </span>
                        {itemSubs.map(sub => (
                          <span 
                            key={sub.card.id} 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono shadow-sm"
                          >
                            <span>{sub.count}x {sub.card.name_pt} ({sub.card.set_code})</span>
                            <button
                              onClick={() => handleRemoveSubstitute(item.id, sub.card.id)}
                              className="text-cyan-400 hover:text-white p-0.5 ml-0.5"
                              title="Remover substituta"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Similar Cards Drawer Trigger (for cards with missing copies) */}
                    {isMissing && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full flex items-center justify-between py-1 px-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-[11px] font-mono text-yellow-300 hover:text-yellow-200 transition-colors border border-slate-800"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="font-bold">
                              {item.similarCards.length > 0
                                ? `✨ ${item.similarCards.length} Cartas Similares / Substitutas na Coleção`
                                : `Buscar Carta Substituta na Coleção`}
                            </span>
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {/* Expanded Drawer: List of Similar Card Candidates */}
                        {isExpanded && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                            {item.similarCards.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                  Sugestões Automáticas Baseadas em Função & Espécie:
                                </span>
                                {item.similarCards.map(sim => (
                                  <div
                                    key={sim.card.id}
                                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-all"
                                  >
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <div 
                                        className="w-7 h-10 shrink-0 rounded overflow-hidden cursor-pointer border border-slate-700"
                                        onClick={() => setSelectedCardForModal(sim.card)}
                                      >
                                        <HoloCard card={sim.card} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="font-bold text-[11px] text-white truncate">
                                            {sim.card.name_pt}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            ({sim.card.set_code} #{sim.card.card_number})
                                          </span>
                                        </div>
                                        <span className="text-[9px] text-cyan-300 font-mono block">
                                          {sim.reasonPt} • Possui: {sim.card.quantity}x
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleAssignSubstitute(item.id, sim.card)}
                                      className="shrink-0 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 shadow transition-all active:scale-95"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Usar</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 font-mono italic">
                                {t('validator.noSimilarFound')}
                              </p>
                            )}

                            {/* Manual Collection Search inside the Drawer */}
                            <div className="pt-2 border-t border-slate-800/80 space-y-2">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQueries(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  placeholder={t('validator.searchSubstitutePlaceholder')}
                                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono"
                                />
                              </div>

                              {searchedCollection.length > 0 && (
                                <div className="space-y-1">
                                  {searchedCollection.map(c => (
                                    <div 
                                      key={c.id} 
                                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                                    >
                                      <span className="truncate text-slate-200 text-[11px] font-mono">
                                        {c.name_pt} ({c.set_code} #{c.card_number}) - {c.quantity}x
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleAssignSubstitute(item.id, c)}
                                        className="bg-slate-800 hover:bg-slate-700 text-yellow-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ml-2"
                                      >
                                        + Usar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Card Detail Modal (if card clicked) */}
      {selectedCardForModal && (
        <CardDetailModal
          card={selectedCardForModal}
          onClose={() => setSelectedCardForModal(null)}
        />
      )}
    </div>
  );
};
