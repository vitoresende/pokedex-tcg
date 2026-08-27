import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import initialCards from '../data/cards.json';
import initialDecks from '../data/decks.json';
import { Card, Deck } from '../types';
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
  toggleMute: () => void;
  syncToCloud: () => Promise<boolean>;
  addNewCard: (card: Partial<Card>) => Card;
  deleteCard: (cardId: string) => void;
  importCardsFromCsv: (csvContent: string) => { added: number; updated: number };
  createNewDeck: (deck: Partial<Deck>) => Deck;
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

const BASIC_ENERGY_CONFIG: Record<string, { code: string; num: string; url: string }> = {
  'G': { code: 'SVE', num: '1', url: 'https://images.pokemontcg.io/sve/1.png' },
  'R': { code: 'SVE', num: '2', url: 'https://images.pokemontcg.io/sve/2.png' },
  'W': { code: 'SVE', num: '3', url: 'https://images.pokemontcg.io/sve/3.png' },
  'L': { code: 'SVE', num: '4', url: 'https://images.pokemontcg.io/sve/4.png' },
  'P': { code: 'SVE', num: '5', url: 'https://images.pokemontcg.io/sve/5.png' },
  'F': { code: 'SVE', num: '6', url: 'https://images.pokemontcg.io/sve/6.png' },
  'D': { code: 'SVE', num: '7', url: 'https://images.pokemontcg.io/sve/7.png' },
  'M': { code: 'SVE', num: '8', url: 'https://images.pokemontcg.io/sve/8.png' },
  'Y': { code: 'SM1', num: '169', url: 'https://images.pokemontcg.io/sm1/169.png' },
};

const normalizeCards = (rawCards: Card[]): Card[] => {
  return rawCards.map(c => {
    // Special Energy specific overrides
    if (c.name_en.toLowerCase().includes('bubbly') || (c.set_code === 'CRI' && (c.card_number === '084' || c.card_number === '84'))) {
      return {
        ...c,
        set_code: 'CRI',
        card_number: '084',
        card_category: 'Energy',
        image_url: 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/CRI/CRI_084_R_PT.png'
      };
    }

    if (c.name_en.toLowerCase().includes('weakness guard') || (c.set_code === 'UNM' && c.card_number === '213')) {
      return {
        ...c,
        set_code: 'UNM',
        card_number: '213',
        card_category: 'Energy',
        image_url: 'https://images.pokemontcg.io/sm11/213.png'
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
        image_url: meta.url,
        card_category: 'Energy'
      };
    }
    return c;
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
    return saved ? JSON.parse(saved) : (initialDecks as Deck[]);
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

  const [isMuted, setIsMuted] = useState<boolean>(false);
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
          if (data.decks) setDecks(data.decks);
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

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
    if (!next) soundEffects.playClick();
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

  const importCardsFromCsv = (csvContent: string): { added: number; updated: number } => {
    soundEffects.playScan();
    const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return { added: 0, updated: 0 };

    let added = 0;
    let updated = 0;

    const newCardsList = [...cards];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 4) continue;

      const setPt = parts[0] || 'Imported Set';
      const setEn = parts[1] || setPt;
      const setCode = (parts[2] || 'IMP').toUpperCase();
      const cardPt = parts[3] || 'Card';
      const cardEn = parts[4] || cardPt;
      const qty = parseInt(parts[5] || '1') || 1;
      const quality = parts[6] || 'NM';
      const lang = parts[7] || 'EN';
      const rarity = parts[8] || 'C';
      const color = parts[9] || '';
      const extras = parts[10] || '';
      const cardNum = parts[11] || `${i}`;
      const comment = parts[12] || '';
      const totalInSet = parts[13] || '100';

      const isBasicEnergy = setCode === 'BAS' || cardNum.toLowerCase() === 'energia' || (cardPt.toLowerCase().includes('energia') && cardPt.toLowerCase().includes('básica'));
      
      let finalSetCode = setCode;
      let finalCardNum = cardNum;
      let finalImageUrl = `https://images.pokemontcg.io/${setCode.toLowerCase()}/${cardNum.replace(/\D/g, '') || '1'}.png`;

      const BASIC_ENERGY_MAP: Record<string, { code: string; num: string; url: string }> = {
        'G': { code: 'SVE', num: '1', url: 'https://images.pokemontcg.io/sve/1.png' },
        'R': { code: 'SVE', num: '2', url: 'https://images.pokemontcg.io/sve/2.png' },
        'W': { code: 'SVE', num: '3', url: 'https://images.pokemontcg.io/sve/3.png' },
        'L': { code: 'SVE', num: '4', url: 'https://images.pokemontcg.io/sve/4.png' },
        'P': { code: 'SVE', num: '5', url: 'https://images.pokemontcg.io/sve/5.png' },
        'F': { code: 'SVE', num: '6', url: 'https://images.pokemontcg.io/sve/6.png' },
        'D': { code: 'SVE', num: '7', url: 'https://images.pokemontcg.io/sve/7.png' },
        'M': { code: 'SVE', num: '8', url: 'https://images.pokemontcg.io/sve/8.png' },
        'Y': { code: 'SM1', num: '169', url: 'https://images.pokemontcg.io/sm1/169.png' },
      };

      if (isBasicEnergy && BASIC_ENERGY_MAP[color]) {
        finalSetCode = BASIC_ENERGY_MAP[color].code;
        finalCardNum = BASIC_ENERGY_MAP[color].num;
        finalImageUrl = BASIC_ENERGY_MAP[color].url;
      }

      const existingIndex = newCardsList.findIndex(c => 
        c.set_code === finalSetCode && c.card_number === finalCardNum && c.name_pt.toLowerCase() === cardPt.toLowerCase()
      );

      if (existingIndex >= 0) {
        newCardsList[existingIndex] = {
          ...newCardsList[existingIndex],
          quantity: newCardsList[existingIndex].quantity + qty
        };
        updated++;
      } else {
        const colorInfo = COLOR_MAP[color] || COLOR_MAP[''];
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
          color_name: colorInfo.name,
          color_slug: colorInfo.slug,
          color_bg: colorInfo.bg,
          card_category: (isBasicEnergy || colorInfo.name === 'Energy') ? 'Energy' : colorInfo.name === 'Trainer' ? 'Trainer' : 'Pokémon',
          is_foil: extras.toLowerCase().includes('foil') || extras.toLowerCase().includes('holo'),
          extras: extras,
          comment: comment,
          image_url: finalImageUrl,
          local_image: '',
          decks: []
        });
        added++;
      }
    }

    setCards(newCardsList);
    return { added, updated };
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

    // Type / Color / Category
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
          (c.color_slug === filters.selectedColor || c.color_code.toLowerCase() === filters.selectedColor.toLowerCase()) &&
          c.card_category !== 'Trainer' && 
          (c.card_category as string) !== 'Treinador'
        );
      }
    }

    // Set / Collection
    if (filters.selectedSet !== 'ALL') {
      result = result.filter(c => c.set_code === filters.selectedSet);
    }

    // Rarity
    if (filters.selectedRarity !== 'ALL') {
      result = result.filter(c => c.rarity_code === filters.selectedRarity);
    }

    // Category Filter (All / Pokémon / Trainer / Energy)
    if (filters.selectedCategory !== 'ALL') {
      if (filters.selectedCategory === 'Energy') {
        result = result.filter(c => 
          c.card_category === 'Energy' || 
          (c.card_category as string) === 'Energia' ||
          c.color_code === 'E' ||
          c.set_code === 'SVE' ||
          c.set_code === 'BAS' ||
          c.name_pt.toLowerCase().includes('energia')
        );
      } else if (filters.selectedCategory === 'Trainer') {
        result = result.filter(c => 
          c.card_category === 'Trainer' || 
          (c.card_category as string) === 'Treinador' ||
          !c.color_code
        );
      } else if (filters.selectedCategory === 'Pokémon') {
        result = result.filter(c => 
          c.card_category === 'Pokémon' || 
          (c.card_category as string) === 'Pokemon'
        );
      } else {
        result = result.filter(c => c.card_category === filters.selectedCategory);
      }
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
        toggleMute,
        syncToCloud,
        addNewCard,
        deleteCard,
        importCardsFromCsv,
        createNewDeck,
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
