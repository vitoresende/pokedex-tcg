import { Card, NationalPokemon } from '../types';
import nationalPokemonList from '../data/pokemon_national.json';

export function normalizePokemonName(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface NormalizedPokemon extends NationalPokemon {
  norm: string;
}

const PREPARED_POKEMON: NormalizedPokemon[] = (nationalPokemonList as NationalPokemon[])
  .map((p) => ({
    ...p,
    norm: normalizePokemonName(p.name),
  }))
  .sort((a, b) => b.norm.length - a.norm.length);

/**
 * Returns an array of National Pokédex IDs (1..1025) that match a given TCG card.
 * Handles single Pokémon, forms (e.g. Alolan Sandshrew -> Sandshrew),
 * suffixes (e.g. Krookodile ex -> Krookodile), and Tag Teams (e.g. Mewtwo & Mew -> [150, 151]).
 */
export function getPokemonIdsForCard(card: Card): number[] {
  if (card.card_category !== 'Pokémon') return [];

  const names = [card.name_en, card.name_pt].filter(Boolean);
  const matched: NormalizedPokemon[] = [];

  for (const name of names) {
    const normCard = normalizePokemonName(name);
    const paddedCard = ` ${normCard} `;

    for (const p of PREPARED_POKEMON) {
      if (paddedCard.includes(` ${p.norm} `)) {
        // Prevent substring overlap on single entity names unless it's a Tag Team / dual entity
        const isSub = matched.some((m) => ` ${m.norm} `.includes(` ${p.norm} `));
        if (!isSub && !matched.some((m) => m.id === p.id)) {
          matched.push(p);
        }
      }
    }
  }

  return matched.map((m) => m.id);
}

/**
 * Builds a fast Map<pokemonId, Card[]> indexing all collection cards by their National Pokémon ID.
 */
export function buildPokemonCardsMap(cards: Card[]): Map<number, Card[]> {
  const map = new Map<number, Card[]>();

  for (const card of cards) {
    const pokemonIds = getPokemonIdsForCard(card);
    for (const pid of pokemonIds) {
      const existing = map.get(pid);
      if (existing) {
        existing.push(card);
      } else {
        map.set(pid, [card]);
      }
    }
  }

  return map;
}
