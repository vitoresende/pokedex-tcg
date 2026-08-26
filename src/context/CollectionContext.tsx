import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
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
  G: { name: 'Planta', slug: 'grass', bg: '#78C850' },
  R: { name: 'Fogo', slug: 'fire', bg: '#F08030' },
  W: { name: 'Água', slug: 'water', bg: '#6890F0' },
  L: { name: 'Raios', slug: 'lightning', bg: '#F8D030' },
  P: { name: 'Psíquica', slug: 'psychic', bg: '#F85888' },
  F: { name: 'Luta', slug: 'fighting', bg: '#C03028' },
  D: { name: 'Escuridão', slug: 'darkness', bg: '#705848' },
  M: { name: 'Metal', slug: 'metal', bg: '#B8B8D0' },
  Y: { name: 'Fada', slug: 'fairy', bg: '#EE99AC' },
  O: { name: 'Dragão', slug: 'dragon', bg: '#7038F8' },
  C: { name: 'Incolor', slug: 'colorless', bg: '#A8A878' },
  E: { name: 'Energia', slug: 'energy', bg: '#F59E0B' },
  '': { name: 'Treinador', slug: 'trainer', bg: '#14B8A6' }
};

const RARITY_MAP: Record<string, string> = {
  C: 'Comum',
  U: 'Incomum',
  R: 'Rara',
  RH: 'Rara Holo',
  RU: 'Ultra Rara (GX/EX)',
  RD: 'Rara Dupla (ex)',
  IR: 'Ilustração Rara',
  S: 'Secreta / Especial'
};

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAllowed } = useAuth();
  
  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem('pokedex_tcg_cards');
    return saved ? JSON.parse(saved) : (initialCards as Card[]);
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

  // Persistência local
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

  // Carrega do Firestore quando o usuário loga
  useEffect(() => {
    if (user?.uid && isAllowed) {
      loadUserCollectionFromFirestore(user.uid).then(data => {
        if (data) {
          if (data.quantities) {
            setCards(prev => prev.map(c => ({
              ...c,
              quantity: data.quantities[c.id] !== undefined ? data.quantities[c.id] : c.quantity
            })));
          }
          if (data.favorites) setFavorites(data.favorites);
          if (data.notes) setNotes(data.notes);
          if (data.decks) setDecks(data.decks);
        }
      });
    }
  }, [user?.uid, isAllowed]);

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
      name_pt: cardData.name_pt || 'Nova Carta',
      name_en: cardData.name_en || cardData.name_pt || 'New Card',
      set_pt: cardData.set_pt || 'Coleção Personalizada',
      set_en: cardData.set_en || 'Custom Set',
      set_code: (cardData.set_code || 'CUS').toUpperCase(),
      card_number: cardData.card_number || '1',
      total_in_set: cardData.total_in_set || '100',
      quantity: cardData.quantity !== undefined ? cardData.quantity : 1,
      quality: cardData.quality || 'NM',
      language: cardData.language || 'PT',
      rarity_code: cardData.rarity_code || 'C',
      rarity_name: RARITY_MAP[cardData.rarity_code || 'C'] || 'Comum',
      color_code: cardData.color_code || '',
      color_name: colorInfo.name,
      color_slug: colorInfo.slug,
      color_bg: colorInfo.bg,
      card_category: cardData.card_category || (cardData.color_code === '' ? 'Treinador' : 'Pokémon'),
      is_foil: !!cardData.is_foil,
      extras: cardData.extras || (cardData.is_foil ? 'Foil' : ''),
      comment: cardData.comment || '',
      image_url: cardData.image_url || `https://images.pokemontcg.io/${(cardData.set_code || 'sv1').toLowerCase()}/${cardData.card_number || '1'}.png`,
      decks: cardData.decks || []
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

    const header = lines[0].split(',').map(h => h.trim().replace(/^[\uFEFF\ufeff]/, ''));
    let added = 0;
    let updated = 0;

    const newCardsList = [...cards];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 4) continue;

      const setPt = parts[0] || 'Coleção Importada';
      const setEn = parts[1] || setPt;
      const setCode = (parts[2] || 'IMP').toUpperCase();
      const cardPt = parts[3] || 'Carta';
      const cardEn = parts[4] || cardPt;
      const qty = parseInt(parts[5] || '1') || 1;
      const quality = parts[6] || 'NM';
      const lang = parts[7] || 'PT';
      const rarity = parts[8] || 'C';
      const color = parts[9] || '';
      const extras = parts[10] || '';
      const cardNum = parts[11] || `${i}`;
      const comment = parts[12] || '';
      const totalInSet = parts[13] || '100';

      const existingIndex = newCardsList.findIndex(c => 
        c.set_code === setCode && c.card_number === cardNum && c.name_pt.toLowerCase() === cardPt.toLowerCase()
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
          id: `imp-${Date.now()}-${i}`,
          name_pt: cardPt,
          name_en: cardEn,
          set_pt: setPt,
          set_en: setEn,
          set_code: setCode,
          card_number: cardNum,
          total_in_set: totalInSet,
          quantity: qty,
          quality: quality,
          language: lang,
          rarity_code: rarity,
          rarity_name: RARITY_MAP[rarity] || 'Comum',
          color_code: color,
          color_name: colorInfo.name,
          color_slug: colorInfo.slug,
          color_bg: colorInfo.bg,
          card_category: color === '' ? 'Treinador' : (color === 'E' ? 'Energia' : 'Pokémon'),
          is_foil: extras.includes('Foil') || ['RH', 'RU', 'RD', 'IR', 'S'].includes(rarity),
          extras: extras,
          comment: comment,
          image_url: `https://images.pokemontcg.io/${setCode.toLowerCase()}/${cardNum.replace(/\D/g, '') || '1'}.png`,
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
    const newId = `custom-deck-${Date.now()}`;
    const newDeck: Deck = {
      id: newId,
      name: deckData.name || 'Novo Baralho Personalizado',
      format: deckData.format || 'Standard',
      format_slug: (deckData.format_slug || 'standard') as any,
      archetype: deckData.archetype || 'Custom Deck',
      badge_color: deckData.badge_color || 'from-pokedex-red to-red-950',
      accent_color: deckData.accent_color || '#DC0A2D',
      summary: deckData.summary || 'Estratégia personalizada construída no Pokédex TCG.',
      win_condition: deckData.win_condition || 'Nocautear os atacantes principais e coletar 6 Prêmios.',
      stats: {
        pokemon: deckData.cards?.filter(c => c.section === 'pokemon').reduce((a, b) => a + b.count, 0) || 0,
        trainers: deckData.cards?.filter(c => c.section === 'trainers').reduce((a, b) => a + b.count, 0) || 0,
        energies: deckData.cards?.filter(c => c.section === 'energies').reduce((a, b) => a + b.count, 0) || 0,
        total: deckData.cards?.reduce((a, b) => a + b.count, 0) || 0,
      },
      energy_breakdown: deckData.energy_breakdown || {
        owned: 'Energias configuradas',
        needed: 'Nenhuma',
        missing_count: 0
      },
      cards: deckData.cards || [],
      strategy_guide: deckData.strategy_guide || {
        opening: { title: '1. Abertura', steps: ['Inicie com seu Pokémon Básico ativo e posicione o banco.'] },
        midgame: { title: '2. Meio de Jogo', steps: ['Evolua seus atacantes e ligue energias a cada turno.'] },
        lategame: { title: '3. Fechamento', steps: ['Execute nocautes finais para comprar todos os Prêmios.'] },
      },
      prize_trade_tip: deckData.prize_trade_tip || 'Gerencie as trocas de prêmio com cautela.'
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
    setDecks(prev => prev.map(deck => {
      if (deck.id !== deckId) return deck;
      
      const existingCard = deck.cards.find(c => c.name.toLowerCase() === card.name_pt.toLowerCase());
      let updatedCards: DeckCardItem[];

      if (existingCard) {
        updatedCards = deck.cards.map(c => 
          c.name.toLowerCase() === card.name_pt.toLowerCase()
            ? { ...c, count: Math.min(4, c.count + count), owned: card.quantity }
            : c
        );
      } else {
        const section: 'pokemon' | 'trainers' | 'energies' = 
          card.card_category === 'Pokémon' ? 'pokemon' : (card.card_category === 'Treinador' ? 'trainers' : 'energies');
        
        updatedCards = [
          ...deck.cards,
          {
            section,
            name: card.name_pt,
            set: `${card.set_pt} - ${card.set_code} ${card.card_number}`,
            count: Math.min(4, count),
            owned: card.quantity,
            rarity: card.rarity_code
          }
        ];
      }

      const pokemonCount = updatedCards.filter(c => c.section === 'pokemon').reduce((a, b) => a + b.count, 0);
      const trainersCount = updatedCards.filter(c => c.section === 'trainers').reduce((a, b) => a + b.count, 0);
      const energiesCount = updatedCards.filter(c => c.section === 'energies').reduce((a, b) => a + b.count, 0);

      const updated = {
        ...deck,
        cards: updatedCards,
        stats: {
          pokemon: pokemonCount,
          trainers: trainersCount,
          energies: energiesCount,
          total: pokemonCount + trainersCount + energiesCount
        }
      };

      if (selectedDeck?.id === deckId) {
        setSelectedDeck(updated);
      }

      return updated;
    }));
  };

  const removeCardFromDeck = (deckId: string, cardName: string) => {
    soundEffects.playClick();
    setDecks(prev => prev.map(deck => {
      if (deck.id !== deckId) return deck;
      
      const updatedCards = deck.cards.filter(c => c.name.toLowerCase() !== cardName.toLowerCase());
      const pokemonCount = updatedCards.filter(c => c.section === 'pokemon').reduce((a, b) => a + b.count, 0);
      const trainersCount = updatedCards.filter(c => c.section === 'trainers').reduce((a, b) => a + b.count, 0);
      const energiesCount = updatedCards.filter(c => c.section === 'energies').reduce((a, b) => a + b.count, 0);

      const updated = {
        ...deck,
        cards: updatedCards,
        stats: {
          pokemon: pokemonCount,
          trainers: trainersCount,
          energies: energiesCount,
          total: pokemonCount + trainersCount + energiesCount
        }
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
    soundEffects.playScan();
    try {
      const quantities: Record<string, number> = {};
      cards.forEach(c => { quantities[c.id] = c.quantity; });
      await syncUserCollectionToFirestore(user.uid, quantities, notes, favorites);
      setSyncing(false);
      return true;
    } catch (err) {
      setSyncing(false);
      return false;
    }
  };

  const resetFilters = () => {
    soundEffects.playClick();
    setFilters(defaultFilters);
  };

  // Estatísticas calculadas
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

  // Filtragem e ordenação das cartas
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Busca textual
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

    // Tipo / Cor
    if (filters.selectedColor !== 'ALL') {
      result = result.filter(c => c.color_slug === filters.selectedColor || c.color_code === filters.selectedColor);
    }

    // Coleção / Set
    if (filters.selectedSet !== 'ALL') {
      result = result.filter(c => c.set_code === filters.selectedSet);
    }

    // Raridade
    if (filters.selectedRarity !== 'ALL') {
      result = result.filter(c => c.rarity_code === filters.selectedRarity);
    }

    // Categoria
    if (filters.selectedCategory !== 'ALL') {
      result = result.filter(c => c.card_category === filters.selectedCategory);
    }

    // Filtros booleanos
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

    // Ordenação
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
    throw new Error('useCollection deve ser usado dentro de um CollectionProvider');
  }
  return context;
};
