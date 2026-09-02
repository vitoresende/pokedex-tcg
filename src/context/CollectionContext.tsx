import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import initialCards from '../data/cards.json';
import initialDecks from '../data/decks.json';
import { Card, Deck, DeckCardItem } from '../types';
import { soundEffects } from '../services/audio';
import { useAuth } from './AuthContext';
import { syncUserCollectionToFirestore, loadUserCollectionFromFirestore } from '../services/firebase';

interface FilterState {
  searchQuery: string;
  selectedColor: string;
  selectedSet: string;
  selectedRarity: string;
  selectedCategory: string;
  onlyFoil: boolean;
  onlyOwned: boolean;
  onlyMissing: boolean;
  onlyDeckCards: boolean;
  sortBy: 'number' | 'name' | 'quantity' | 'rarity';
  sortDirection: 'asc' | 'desc';
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface DeckImportOption {
  mode: 'none' | 'existing' | 'new';
  existingDeckId?: string;
  newDeckName?: string;
  newDeckFormat?: 'Standard' | 'Expanded' | 'Casual';
}

interface CollectionContextType {
  cards: Card[];
  decks: Deck[];
  filteredCards: Card[];
  filters: FilterState;
  selectedCard: Card | null;
  selectedDeck: Deck | null;
  favorites: string[];
  notes: Record<string, string>;
  isMuted: boolean;
  syncing: boolean;
  syncStatus: CloudSyncStatus;
  lastSyncedAt: Date | null;
  stats: {
    totalOwnedCards: number;
    uniqueCardsCount: number;
    foilCardsCount: number;
    totalSetsCount: number;
    completionPercentage: number;
  };
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  setSelectedCard: (card: Card | null) => void;
  setSelectedDeck: (deck: Deck | null) => void;
  updateCardQuantity: (cardId: string, delta: number) => void;
  toggleFavorite: (cardId: string) => void;
  updateCardNote: (cardId: string, note: string) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  syncToCloud: () => Promise<boolean>;
  addNewCard: (card: Partial<Card>) => Card;
  deleteCard: (cardId: string) => void;
  importCardsFromCsv: (csvContent: string, deckOption?: DeckImportOption) => { added: number; updated: number; deckName?: string };
  createNewDeck: (deck: Partial<Deck>) => Deck;
  updateDeck: (deckId: string, updatedData: Partial<Deck>) => void;
  deleteDeck: (deckId: string) => void;
  addCardToDeck: (deckId: string, card: Card, count?: number) => void;
  removeCardFromDeck: (deckId: string, cardName: string) => void;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  selectedColor: 'ALL',
  selectedSet: 'ALL',
  selectedRarity: 'ALL',
  selectedCategory: 'ALL',
  onlyFoil: false,
  onlyOwned: false,
  onlyMissing: false,
  onlyDeckCards: false,
  sortBy: 'number',
  sortDirection: 'asc'
};

const COLOR_MAP: Record<string, { name: string; slug: string; bg: string }> = {
  G: { name: 'Grass', slug: 'grass', bg: '#78C850' },
  R: { name: 'Fire', slug: 'fire', bg: '#F08030' },
  W: { name: 'Water', slug: 'water', bg: '#6890F0' },
  L: { name: 'Lightning', slug: 'lightning', bg: '#F8D030' },
  P: { name: 'Psychic', slug: 'psychic', bg: '#F85888' },
  F: { name: 'Fighting', slug: 'fighting', bg: '#C03028' },
  D: { name: 'Darkness', slug: 'darkness', bg: '#705848' },
  M: { name: 'Metal', slug: 'metal', bg: '#B8B8D0' },
  Y: { name: 'Fairy', slug: 'fairy', bg: '#EE99AC' },
  O: { name: 'Dragon', slug: 'dragon', bg: '#7038F8' },
  C: { name: 'Colorless', slug: 'colorless', bg: '#A8A878' },
  E: { name: 'Energy', slug: 'energy', bg: '#F59E0B' },
  '': { name: 'Trainer', slug: 'trainer', bg: '#14B8A6' }
};

const STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pokedex-tcg-782d5.firebasestorage.app';

const getStorageCardUrl = (filename: string) => 
  `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/cards%2F${encodeURIComponent(filename)}?alt=media`;

const BASIC_ENERGY_CONFIG: Record<string, { code: string; num: string; filename: string }> = {
  'G': { code: 'SVE', num: '1', filename: 'sve_1.png' },
  'R': { code: 'SVE', num: '2', filename: 'sve_2.png' },
  'W': { code: 'SVE', num: '3', filename: 'sve_3.png' },
  'L': { code: 'SVE', num: '4', filename: 'sve_4.png' },
  'P': { code: 'SVE', num: '5', filename: 'sve_5.png' },
  'F': { code: 'SVE', num: '6', filename: 'sve_6.png' },
  'D': { code: 'SVE', num: '7', filename: 'sve_7.png' },
  'M': { code: 'SVE', num: '8', filename: 'sve_8.png' },
  'Y': { code: 'SM1', num: '169', filename: 'sm1_169.png' },
};

const TRAINER_KEYWORDS = [
  'cynthia', 'cintia', 'lillie', 'lilian', 'hau', 'bug catcher', 'caca-inseto', 'caça-inseto',
  'mysterious treasure', 'tesouro misterioso', 'switch', 'substituicao', 'substituição',
  'tate & liza', 'tate e liza', 'fan club', 'fa clube', 'fã-clube', 'communication', 'comunicacao', 'comunicação',
  'fisherman', 'pescador', 'recycle system', 'reciclagem de energia', 'u-turn board', 'prancha de fuga',
  'rescue stretcher', 'maca de resgate', 'research', 'pesquisa', 'boss', 'ordens', 'ball', 'bola',
  'candy', 'doce', 'rod', 'vara', 'retrieval', 'recuperacao', 'recuperação', 'escape rope', 'corda',
  'judge', 'juiz', 'marnie', 'guzma', 'acerola', 'volkner', 'welder', 'soldadora', 'crystal', 'cristal',
  'hearth', 'lareira', 'forest', 'floresta', 'plant', 'usina', 'stamp', 'carimbo', 'pokegear', 'pokégear',
  'bike', 'bicicleta', 'radar', 'potion', 'pocao', 'poção', 'pokenav', 'pokénav', 'stretcher', 'elixir',
  'treinador', 'trainer', 'supporter', 'apoiador', 'item', 'estadio', 'estádio', 'ferramenta', 'tool'
];

export const isKnownTrainer = (namePt: string, nameEn: string): boolean => {
  const nPt = (namePt || '').toLowerCase();
  const nEn = (nameEn || '').toLowerCase();
  return TRAINER_KEYWORDS.some(k => nPt.includes(k) || nEn.includes(k));
};

export const isKnownEnergy = (namePt: string, nameEn: string, setCode: string, color: string, cardNum: string): boolean => {
  const nPt = (namePt || '').toLowerCase();
  const nEn = (nameEn || '').toLowerCase();
  const sCode = (setCode || '').toUpperCase();
  const cNum = (cardNum || '').toLowerCase();
  return (
    color === 'E' ||
    sCode === 'SVE' ||
    sCode === 'BAS' ||
    cNum === 'energia' ||
    nPt.includes('energia') ||
    nEn.includes('energy')
  );
};

export const normalizeDeck = (rawDeck: Deck): Deck => {
  const cards = (rawDeck.cards || []).map(item => {
    let section = item.section;
    if (isKnownEnergy(item.name, item.name, item.set || '', '', '')) {
      section = 'energies';
    } else if (isKnownTrainer(item.name, item.name)) {
      section = 'trainers';
    }
    return { ...item, section };
  });

  const pokeCount = cards.filter(c => c.section === 'pokemon').reduce((a, b) => a + b.count, 0);
  const trainerCount = cards.filter(c => c.section === 'trainers').reduce((a, b) => a + b.count, 0);
  const energyCount = cards.filter(c => c.section === 'energies').reduce((a, b) => a + b.count, 0);

  return {
    ...rawDeck,
    cards,
    stats: {
      pokemon: pokeCount,
      trainers: trainerCount,
      energies: energyCount,
      total: pokeCount + trainerCount + energyCount
    }
  };
};

const normalizeCards = (rawCards: Card[]): Card[] => {
  return rawCards.map(c => {
    // Determine standard category
    let category: 'Pokémon' | 'Trainer' | 'Energy' = 'Pokémon';
    const catLower = (c.card_category || '').toLowerCase();
    
    if (isKnownEnergy(c.name_pt, c.name_en, c.set_code, c.color_code, c.card_number)) {
      category = 'Energy';
    } else if (
      isKnownTrainer(c.name_pt, c.name_en) ||
      catLower === 'trainer' || 
      catLower === 'treinador' || 
      c.color_slug === 'trainer' || 
      !c.color_code
    ) {
      category = 'Trainer';
    }

    // Special Energy specific overrides
    if (c.name_en.toLowerCase().includes('bubbly') || (c.set_code === 'CRI' && (c.card_number === '084' || c.card_number === '84'))) {
      return {
        ...c,
        set_code: 'CRI',
        card_number: '084',
        card_category: 'Energy',
        color_slug: 'energy',
        color_code: 'E',
        image_url: getStorageCardUrl('cri_084.png')
      };
    }

    if (c.name_en.toLowerCase().includes('weakness guard') || (c.set_code === 'UNM' && (c.card_number === '213' || c.card_number === '0213'))) {
      return {
        ...c,
        set_code: 'UNM',
        card_number: '213',
        card_category: 'Energy',
        color_slug: 'energy',
        color_code: 'C',
        image_url: getStorageCardUrl('unm_213.png')
      };
    }

    const isBasicEnergy = 
      c.set_code === 'BAS' || 
      c.set_code === 'SVE' ||
      c.card_number === 'Energia' ||
      c.name_pt.toLowerCase().includes('básica') ||
      c.name_en.toLowerCase().includes('basic energy');

    if (isBasicEnergy && BASIC_ENERGY_CONFIG[c.color_code]) {
      const meta = BASIC_ENERGY_CONFIG[c.color_code];
      return {
        ...c,
        set_code: meta.code,
        card_number: meta.num,
        image_url: getStorageCardUrl(meta.filename),
        card_category: 'Energy',
        color_slug: 'energy'
      };
    }

    // Ensure image_url uses Google Cloud Storage
    const setCode = (c.set_code || '').toLowerCase();
    let imageUrl = c.image_url;
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      imageUrl = getStorageCardUrl(`${setCode}_${c.card_number}.png`);
    }

    let colorSlug = c.color_slug;
    let colorName = c.color_name;
    let colorBg = c.color_bg;

    if (category === 'Trainer') {
      colorSlug = 'trainer';
      colorName = 'Trainer';
      colorBg = '#14B8A6';
    } else if (category === 'Energy') {
      colorSlug = 'energy';
      colorName = 'Energy';
      colorBg = '#F59E0B';
    }

    return {
      ...c,
      card_category: category,
      color_slug: colorSlug,
      color_name: colorName,
      color_bg: colorBg,
      image_url: imageUrl
    };
  });
};

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAllowed } = useAuth();
  
  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem('pokedex_tcg_cards');
    const parsed = saved ? JSON.parse(saved) : (initialCards as Card[]);
    return normalizeCards(parsed);
  });

  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('pokedex_tcg_decks');
    const parsed = saved ? JSON.parse(saved) : (initialDecks as Deck[]);
    return (parsed || []).map(normalizeDeck);
  });

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(decks[0] || null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('pokedex_tcg_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pokedex_tcg_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pokedex_muted');
        if (stored !== null) {
          return stored === 'true';
        }
      }
    } catch {
      // ignore
    }
    return soundEffects.getIsMuted();
  });
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isInitializedFromCloud, setIsInitializedFromCloud] = useState<boolean>(false);

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('pokedex_tcg_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('pokedex_tcg_decks', JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem('pokedex_tcg_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('pokedex_tcg_notes', JSON.stringify(notes));
  }, [notes]);

  // Load from Firestore on user login
  useEffect(() => {
    if (!user?.uid || !isAllowed) {
      setIsInitializedFromCloud(false);
      return;
    }

    let isMounted = true;

    async function loadCloudData() {
      try {
        setSyncStatus('syncing');
        setSyncing(true);
        const data = await loadUserCollectionFromFirestore(user!.uid);
        
        if (!isMounted) return;

        if (data) {
          if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
            setCards(normalizeCards(data.cards));
          } else if (data.quantities) {
            setCards(prev => normalizeCards(prev.map(c => ({
              ...c,
              quantity: data.quantities[c.id] !== undefined ? data.quantities[c.id] : c.quantity
            }))));
          }
          if (data.favorites) setFavorites(data.favorites);
          if (data.notes) setNotes(data.notes);
          if (data.decks && Array.isArray(data.decks)) setDecks(data.decks.map(normalizeDeck));
          setLastSyncedAt(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
          setSyncStatus('synced');
        } else {
          // New user first time: persist initial state so Firestore document is created immediately
          const quantities: Record<string, number> = {};
          const normalizedInitial = normalizeCards(initialCards as Card[]);
          normalizedInitial.forEach((c: any) => { quantities[c.id] = c.quantity || 0; });
          await syncUserCollectionToFirestore(user!.uid, {
            quantities,
            notes: {},
            favorites: [],
            decks: initialDecks as any,
            cards: normalizedInitial as any
          });
          setLastSyncedAt(new Date());
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('Error loading cloud collection:', err);
        setSyncStatus('error');
      } finally {
        if (isMounted) {
          setSyncing(false);
          setIsInitializedFromCloud(true);
        }
      }
    }

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, isAllowed]);

  // Continuous Automatic Debounced Sync to Firestore (Real-Time Background Sync)
  useEffect(() => {
    if (!isInitializedFromCloud || !user?.uid || !isAllowed) return;

    setSyncStatus('syncing');
    setSyncing(true);

    const timer = setTimeout(async () => {
      try {
        const quantities: Record<string, number> = {};
        cards.forEach(c => { quantities[c.id] = c.quantity; });
        
        await syncUserCollectionToFirestore(user.uid, {
          quantities,
          notes,
          favorites,
          decks,
          cards
        });

        setSyncStatus('synced');
        setSyncing(false);
        setLastSyncedAt(new Date());
      } catch (err) {
        console.error('Auto-sync to Firestore error:', err);
        setSyncStatus('error');
        setSyncing(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [cards, favorites, notes, decks, isInitializedFromCloud, user?.uid, isAllowed]);

  const setMuted = (muted: boolean) => {
    setIsMuted(muted);
    soundEffects.setMuted(muted);
    if (!muted) soundEffects.playClick();
  };

  const toggleMute = () => {
    setMuted(!isMuted);
  };

  const updateCardQuantity = (cardId: string, delta: number) => {
    soundEffects.playClick();
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const nextQty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: nextQty };
      }
      return c;
    }));

    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard(prev => prev ? { ...prev, quantity: Math.max(0, prev.quantity + delta) } : null);
    }
  };

  const toggleFavorite = (cardId: string) => {
    soundEffects.playFoilShine();
    setFavorites(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const updateCardNote = (cardId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [cardId]: note
    }));
  };

  const addNewCard = (cardData: Partial<Card>): Card => {
    soundEffects.playScan();
    const newId = `custom-card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const colorInfo = COLOR_MAP[cardData.color_code || ''] || COLOR_MAP[''];
    
    const newCard: Card = {
      id: newId,
      name_pt: cardData.name_pt || 'New Card',
      name_en: cardData.name_en || cardData.name_pt || 'New Card',
      set_pt: cardData.set_pt || 'Custom Collection',
      set_en: cardData.set_en || 'Custom Set',
      set_code: (cardData.set_code || 'CUS').toUpperCase(),
      card_number: cardData.card_number || '1',
      total_in_set: cardData.total_in_set || '100',
      quantity: cardData.quantity !== undefined ? cardData.quantity : 1,
      quality: cardData.quality || 'NM',
      language: cardData.language || 'EN',
      rarity_code: cardData.rarity_code || 'C',
      rarity_name: cardData.rarity_name || 'Common',
      color_code: cardData.color_code || '',
      color_name: colorInfo.name,
      color_slug: colorInfo.slug,
      color_bg: colorInfo.bg,
      card_category: cardData.card_category || (colorInfo.name === 'Trainer' ? 'Trainer' : colorInfo.name === 'Energy' ? 'Energy' : 'Pokémon'),
      is_foil: !!cardData.is_foil,
      extras: cardData.extras || '',
      comment: cardData.comment || '',
      image_url: cardData.image_url || '',
      local_image: '',
      decks: []
    };

    setCards(prev => [newCard, ...prev]);
    return newCard;
  };

  const deleteCard = (cardId: string) => {
    soundEffects.playClick();
    setCards(prev => prev.filter(c => c.id !== cardId));
    if (selectedCard?.id === cardId) {
      setSelectedCard(null);
    }
  };

  const importCardsFromCsv = (
    csvContent: string, 
    deckOption?: DeckImportOption
  ): { added: number; updated: number; deckName?: string } => {
    soundEffects.playScan();
    const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return { added: 0, updated: 0 };

    let added = 0;
    let updated = 0;

    const newCardsList = [...cards];
    const importedDeckItems: DeckCardItem[] = [];

    // Helper for robust CSV parsing with quotes support
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

    const targetDeckId = 
      deckOption?.mode === 'new' 
        ? `deck-${Date.now()}` 
        : (deckOption?.mode === 'existing' ? deckOption.existingDeckId : undefined);

    for (let i = 1; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i]);
      if (parts.length < 4) continue;

      const setPt = parts[0] || 'Imported Set';
      const setEn = parts[1] || setPt;
      const setCode = (parts[2] || 'IMP').toUpperCase();
      const cardPt = parts[3] || 'Card';
      const cardEn = parts[4] || cardPt;
      const qty = parseInt(parts[5] || '1') || 1;
      const quality = parts[6] || 'NM';
      const lang = parts[7] || 'PT';
      const rarity = parts[8] || 'C';
      const color = (parts[9] || '').toUpperCase();
      const extras = parts[10] || '';
      const cardNum = parts[11] || `${i}`;
      const comment = parts[12] || '';
      const totalInSet = parts[13] || '100';

      const colorInfo = COLOR_MAP[color] || COLOR_MAP[''];
      const isBasicEnergy = 
        setCode === 'BAS' || 
        setCode === 'SVE' || 
        cardNum.toLowerCase() === 'energia' || 
        (cardPt.toLowerCase().includes('energia') && cardPt.toLowerCase().includes('básica')) ||
        (color === 'E' && Boolean(BASIC_ENERGY_CONFIG[color]));
      
      let finalSetCode = setCode;
      let finalCardNum = cardNum;
      let finalImageUrl = getStorageCardUrl(`${setCode.toLowerCase()}_${cardNum}.png`);

      if (isBasicEnergy && BASIC_ENERGY_CONFIG[color]) {
        finalSetCode = BASIC_ENERGY_CONFIG[color].code;
        finalCardNum = BASIC_ENERGY_CONFIG[color].num;
        finalImageUrl = getStorageCardUrl(BASIC_ENERGY_CONFIG[color].filename);
      }

      const isEnergy = isKnownEnergy(cardPt, cardEn, setCode, color, cardNum);
      const isTrainer = !isEnergy && (isKnownTrainer(cardPt, cardEn) || colorInfo.name === 'Trainer' || !color);
      const category: 'Pokémon' | 'Trainer' | 'Energy' = isEnergy ? 'Energy' : isTrainer ? 'Trainer' : 'Pokémon';

      const section: 'pokemon' | 'trainers' | 'energies' = 
        category === 'Trainer' ? 'trainers' : category === 'Energy' ? 'energies' : 'pokemon';

      let colorSlug = colorInfo.slug;
      let colorName = colorInfo.name;
      let colorBg = colorInfo.bg;

      if (category === 'Trainer') {
        colorSlug = 'trainer';
        colorName = 'Trainer';
        colorBg = '#14B8A6';
      } else if (category === 'Energy') {
        colorSlug = 'energy';
        colorName = 'Energy';
        colorBg = '#F59E0B';
      }

      // Record for deck assignment
      importedDeckItems.push({
        name: cardEn || cardPt,
        set: finalSetCode,
        count: qty,
        owned: qty,
        section
      });

      const existingIndex = newCardsList.findIndex(c => 
        c.set_code.toUpperCase() === finalSetCode.toUpperCase() && 
        c.card_number === finalCardNum
      );

      if (existingIndex >= 0) {
        const existingCard = newCardsList[existingIndex];
        const newDecks = targetDeckId && !existingCard.decks.includes(targetDeckId)
          ? [...existingCard.decks, targetDeckId]
          : existingCard.decks;

        newCardsList[existingIndex] = {
          ...existingCard,
          quantity: existingCard.quantity + qty,
          card_category: category,
          color_slug: colorSlug,
          color_name: colorName,
          color_bg: colorBg,
          image_url: finalImageUrl,
          decks: newDecks
        };
        updated++;
      } else {
        const newCardDecks = targetDeckId ? [targetDeckId] : [];
        newCardsList.push({
          id: `imp-${finalSetCode.toLowerCase()}-${finalCardNum}-${Date.now()}-${i}`,
          name_pt: cardPt,
          name_en: cardEn,
          set_pt: setPt,
          set_en: setEn,
          set_code: finalSetCode,
          card_number: finalCardNum,
          total_in_set: totalInSet,
          quantity: qty,
          quality: quality,
          language: lang,
          rarity_code: rarity,
          rarity_name: rarity,
          color_code: color,
          color_name: colorName,
          color_slug: colorSlug,
          color_bg: colorBg,
          card_category: category,
          is_foil: extras.toLowerCase().includes('foil') || extras.toLowerCase().includes('holo'),
          extras: extras,
          comment: comment,
          image_url: finalImageUrl,
          local_image: '',
          decks: newCardDecks
        });
        added++;
      }
    }

    // Process Deck creation or update
    let resultingDeckName: string | undefined = undefined;

    // Group deck items by name
    const consolidatedDeckCards: DeckCardItem[] = [];
    importedDeckItems.forEach(item => {
      const existing = consolidatedDeckCards.find(c => c.name.toLowerCase() === item.name.toLowerCase());
      if (existing) {
        existing.count += item.count;
      } else {
        consolidatedDeckCards.push({ ...item });
      }
    });

    if (deckOption?.mode === 'new' && deckOption.newDeckName?.trim() && targetDeckId) {
      const pokeCount = consolidatedDeckCards.filter(c => c.section === 'pokemon').reduce((a, b) => a + b.count, 0);
      const trainerCount = consolidatedDeckCards.filter(c => c.section === 'trainers').reduce((a, b) => a + b.count, 0);
      const energyCount = consolidatedDeckCards.filter(c => c.section === 'energies').reduce((a, b) => a + b.count, 0);
      const totalCount = pokeCount + trainerCount + energyCount;

      const createdDeck: Deck = {
        id: targetDeckId,
        name: deckOption.newDeckName.trim(),
        format: deckOption.newDeckFormat || 'Standard',
        format_slug: (deckOption.newDeckFormat?.toLowerCase() || 'standard') as any,
        archetype: 'Custom Imported',
        badge_color: 'bg-red-600',
        accent_color: '#EF4444',
        summary: `Tournament deck imported with ${totalCount} cards.`,
        win_condition: 'Configure your custom deck strategy in the deck builder.',
        stats: { pokemon: pokeCount, trainers: trainerCount, energies: energyCount, total: totalCount },
        energy_breakdown: { owned: `${energyCount}`, needed: 'Standard', missing_count: 0 },
        cards: consolidatedDeckCards,
        strategy_guide: {
          opening: { title: '1. Opening Plan', steps: ['Setup Active Basic Pokémon and bench engine.'] },
          midgame: { title: '2. Midgame Plan', steps: ['Attach Energy and attack opponent active Pokémon.'] },
          lategame: { title: '3. Endgame Plan', steps: ['Close out remaining Prize Cards.'] }
        },
        prize_trade_tip: 'Aim for a solid prize trade advantage.'
      };

      setDecks(prev => [createdDeck, ...prev]);
      setSelectedDeck(createdDeck);
      resultingDeckName = createdDeck.name;
    } else if (deckOption?.mode === 'existing' && deckOption.existingDeckId) {
      const existingDeck = decks.find(d => d.id === deckOption.existingDeckId);
      if (existingDeck) {
        setDecks(prev => prev.map(d => {
          if (d.id !== deckOption.existingDeckId) return d;
          const merged = [...d.cards];
          consolidatedDeckCards.forEach(item => {
            const foundIdx = merged.findIndex(c => c.name.toLowerCase() === item.name.toLowerCase());
            if (foundIdx >= 0) {
              merged[foundIdx] = {
                ...merged[foundIdx],
                count: merged[foundIdx].count + item.count
              };
            } else {
              merged.push({ ...item });
            }
          });
          const pokeCount = merged.filter(c => c.section === 'pokemon').reduce((a, b) => a + b.count, 0);
          const trainerCount = merged.filter(c => c.section === 'trainers').reduce((a, b) => a + b.count, 0);
          const energyCount = merged.filter(c => c.section === 'energies').reduce((a, b) => a + b.count, 0);
          return {
            ...d,
            cards: merged,
            stats: { pokemon: pokeCount, trainers: trainerCount, energies: energyCount, total: pokeCount + trainerCount + energyCount }
          };
        }));
        resultingDeckName = existingDeck.name;
      }
    }

    setCards(newCardsList);
    return { added, updated, deckName: resultingDeckName };
  };

  const createNewDeck = (deckData: Partial<Deck>): Deck => {
    soundEffects.playScan();
    const newId = `custom-deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newDeck: Deck = {
      id: newId,
      name: deckData.name || 'New Custom Deck',
      format: deckData.format || 'Standard',
      format_slug: (deckData.format_slug || 'standard') as 'expanded' | 'casual' | 'standard',
      archetype: deckData.archetype || 'Custom Rogue',
      badge_color: deckData.badge_color || 'bg-blue-600',
      accent_color: deckData.accent_color || 'border-blue-500',
      summary: deckData.summary || 'Custom strategic deck build.',
      win_condition: deckData.win_condition || 'Take all 6 prize cards.',
      stats: deckData.stats || { pokemon: 0, trainers: 0, energies: 0, total: 0 },
      energy_breakdown: deckData.energy_breakdown || { owned: '0/0', needed: '0', missing_count: 0 },
      cards: deckData.cards || [],
      strategy_guide: deckData.strategy_guide || {
        opening: { title: 'Early Game', steps: ['Setup Active Basic Pokémon and bench engine.'] },
        midgame: { title: 'Mid Game', steps: ['Attach Energy and attack opponent active Pokémon.'] },
        lategame: { title: 'End Game', steps: ['Close out remaining Prize Cards.'] }
      },
      prize_trade_tip: deckData.prize_trade_tip || 'Manage your prize race efficiently.'
    };

    setDecks(prev => [newDeck, ...prev]);
    setSelectedDeck(newDeck);
    return newDeck;
  };

  const updateDeck = (deckId: string, updatedData: Partial<Deck>) => {
    soundEffects.playScan();
    setDecks(prev => prev.map(d => {
      if (d.id !== deckId) return d;
      const updated: Deck = {
        ...d,
        ...updatedData,
        strategy_guide: updatedData.strategy_guide ? {
          opening: {
            title: updatedData.strategy_guide.opening?.title ?? d.strategy_guide.opening.title,
            steps: updatedData.strategy_guide.opening?.steps ?? d.strategy_guide.opening.steps
          },
          midgame: {
            title: updatedData.strategy_guide.midgame?.title ?? d.strategy_guide.midgame.title,
            steps: updatedData.strategy_guide.midgame?.steps ?? d.strategy_guide.midgame.steps
          },
          lategame: {
            title: updatedData.strategy_guide.lategame?.title ?? d.strategy_guide.lategame.title,
            steps: updatedData.strategy_guide.lategame?.steps ?? d.strategy_guide.lategame.steps
          }
        } : d.strategy_guide,
        format_slug: updatedData.format 
          ? (updatedData.format.toLowerCase() as 'standard' | 'expanded' | 'casual') 
          : d.format_slug
      };
      const normalized = normalizeDeck(updated);
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(normalized);
      }
      return normalized;
    }));
  };

  const deleteDeck = (deckId: string) => {
    soundEffects.playClick();
    setDecks(prev => prev.filter(d => d.id !== deckId));
    if (selectedDeck?.id === deckId) {
      setSelectedDeck(decks.find(d => d.id !== deckId) || null);
    }
  };

  const addCardToDeck = (deckId: string, card: Card, count: number = 1) => {
    soundEffects.playClick();
    setDecks(prev => prev.map(d => {
      if (d.id !== deckId) return d;

      const existingIndex = d.cards.findIndex(item => item.name === card.name_pt || item.name === card.name_en);
      let updatedCards = [...d.cards];

      const section: 'pokemon' | 'trainers' | 'energies' = 
        card.card_category === 'Trainer' ? 'trainers' : 
        card.card_category === 'Energy' ? 'energies' : 'pokemon';

      if (existingIndex >= 0) {
        const currentCount = updatedCards[existingIndex].count;
        updatedCards[existingIndex] = {
          ...updatedCards[existingIndex],
          count: currentCount + count,
          owned: card.quantity
        };
      } else {
        updatedCards.push({
          name: card.name_pt,
          set: card.set_code,
          count: count,
          owned: card.quantity,
          section
        });
      }

      const updated = {
        ...d,
        cards: updatedCards
      };

      if (selectedDeck?.id === deckId) {
        setSelectedDeck(updated);
      }

      return updated;
    }));
  };

  const removeCardFromDeck = (deckId: string, cardName: string) => {
    soundEffects.playClick();
    setDecks(prev => prev.map(d => {
      if (d.id !== deckId) return d;

      const updatedCards = d.cards.filter(item => item.name !== cardName);
      const updated = {
        ...d,
        cards: updatedCards
      };

      if (selectedDeck?.id === deckId) {
        setSelectedDeck(updated);
      }

      return updated;
    }));
  };

  const syncToCloud = async (): Promise<boolean> => {
    if (!user?.uid) return false;
    setSyncing(true);
    setSyncStatus('syncing');
    soundEffects.playScan();
    try {
      const quantities: Record<string, number> = {};
      cards.forEach(c => { quantities[c.id] = c.quantity; });
      await syncUserCollectionToFirestore(user.uid, {
        quantities,
        notes,
        favorites,
        decks,
        cards
      });
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      setSyncing(false);
      return true;
    } catch (err) {
      console.error('Manual sync to Firestore error:', err);
      setSyncStatus('error');
      setSyncing(false);
      return false;
    }
  };

  const resetFilters = () => {
    soundEffects.playClick();
    setFilters(defaultFilters);
  };

  // Calculated statistics
  const stats = useMemo(() => {
    const totalOwned = cards.reduce((acc, c) => acc + c.quantity, 0);
    const uniqueCount = cards.filter(c => c.quantity > 0).length;
    const foilCount = cards.filter(c => c.is_foil && c.quantity > 0).length;
    const sets = new Set(cards.map(c => c.set_code).filter(Boolean));
    const completion = cards.length > 0 ? Math.round((uniqueCount / cards.length) * 100) : 0;

    return {
      totalOwnedCards: totalOwned,
      uniqueCardsCount: uniqueCount,
      foilCardsCount: foilCount,
      totalSetsCount: sets.size,
      completionPercentage: completion
    };
  }, [cards]);

  // Filtered & sorted cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Text query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.name_pt.toLowerCase().includes(q) ||
        c.name_en.toLowerCase().includes(q) ||
        c.card_number.toLowerCase().includes(q) ||
        c.set_code.toLowerCase().includes(q) ||
        c.set_pt.toLowerCase().includes(q) ||
        c.comment.toLowerCase().includes(q) ||
        (notes[c.id] && notes[c.id].toLowerCase().includes(q))
      );
    }

    // Set / Collection Filter
    if (filters.selectedSet !== 'ALL') {
      result = result.filter(c => (c.set_code || '').trim().toUpperCase() === filters.selectedSet.trim().toUpperCase());
    }

    // Category Filter (All / Pokémon / Trainer / Energy)
    if (filters.selectedCategory !== 'ALL') {
      const targetCat = filters.selectedCategory.toLowerCase();
      if (targetCat === 'energy' || targetCat === 'energia') {
        result = result.filter(c => 
          c.card_category === 'Energy' || 
          (c.card_category as string) === 'Energia' ||
          c.color_code === 'E' ||
          c.color_slug === 'energy' ||
          c.set_code === 'SVE' ||
          c.set_code === 'BAS' ||
          c.name_pt.toLowerCase().includes('energia')
        );
      } else if (targetCat === 'trainer' || targetCat === 'treinador') {
        result = result.filter(c => 
          c.card_category === 'Trainer' || 
          (c.card_category as string) === 'Treinador' ||
          c.color_slug === 'trainer' ||
          !c.color_code
        );
      } else if (targetCat === 'pokémon' || targetCat === 'pokemon') {
        result = result.filter(c => 
          (c.card_category === 'Pokémon' || (c.card_category as string) === 'Pokemon') &&
          c.color_slug !== 'trainer' &&
          c.color_slug !== 'energy' &&
          c.color_code !== 'E'
        );
      }
    }

    // Type / Color Filter (Elemental Types, Trainer, Energy)
    if (filters.selectedColor !== 'ALL') {
      if (filters.selectedColor === 'energy') {
        result = result.filter(c => 
          c.card_category === 'Energy' || 
          (c.card_category as string) === 'Energia' ||
          c.color_code === 'E' || 
          c.color_slug === 'energy' ||
          c.set_code === 'SVE' ||
          c.set_code === 'BAS' ||
          c.name_pt.toLowerCase().includes('energia') ||
          c.name_en.toLowerCase().includes('energy')
        );
      } else if (filters.selectedColor === 'trainer') {
        result = result.filter(c => 
          c.card_category === 'Trainer' || 
          (c.card_category as string) === 'Treinador' ||
          c.color_slug === 'trainer' || 
          !c.color_code
        );
      } else {
        result = result.filter(c => 
          c.color_slug === filters.selectedColor || 
          (c.color_code && c.color_code.toLowerCase() === filters.selectedColor.toLowerCase())
        );
      }
    }

    // Rarity Filter
    if (filters.selectedRarity !== 'ALL') {
      result = result.filter(c => (c.rarity_code || '').trim().toUpperCase() === filters.selectedRarity.trim().toUpperCase());
    }

    // Boolean flags
    if (filters.onlyFoil) {
      result = result.filter(c => c.is_foil);
    }
    if (filters.onlyOwned) {
      result = result.filter(c => c.quantity > 0);
    }
    if (filters.onlyMissing) {
      result = result.filter(c => c.quantity === 0);
    }
    if (filters.onlyDeckCards) {
      result = result.filter(c => c.decks && c.decks.length > 0);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'number') {
        const numA = parseInt(a.card_number.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.card_number.replace(/\D/g, '')) || 0;
        comparison = numA - numB;
      } else if (filters.sortBy === 'name') {
        comparison = a.name_pt.localeCompare(b.name_pt);
      } else if (filters.sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (filters.sortBy === 'rarity') {
        comparison = a.rarity_code.localeCompare(b.rarity_code);
      }

      return filters.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [cards, filters, notes]);

  return (
    <CollectionContext.Provider
      value={{
        cards,
        decks,
        filteredCards,
        filters,
        selectedCard,
        selectedDeck,
        favorites,
        notes,
        isMuted,
        syncing,
        syncStatus,
        lastSyncedAt,
        stats,
        setFilters,
        resetFilters,
        setSelectedCard,
        setSelectedDeck,
        updateCardQuantity,
        toggleFavorite,
        updateCardNote,
        setMuted,
        toggleMute,
        syncToCloud,
        addNewCard,
        deleteCard,
        importCardsFromCsv,
        createNewDeck,
        updateDeck,
        deleteDeck,
        addCardToDeck,
        removeCardFromDeck
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};
