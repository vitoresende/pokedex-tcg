import { Card } from '../types';

export interface SimilarCardMatch {
  card: Card;
  reasonPt: string;
  reasonEn: string;
  score: number;
}

// Tactical Role Keywords for Trainers
const TRAINER_CLUSTERS = [
  {
    role: 'ball_search',
    labelPt: 'Busca de Pokémon (Efeito Bola / Tutor)',
    labelEn: 'Pokémon Search (Ball / Tutor Effect)',
    keywords: [
      'ball', 'bola', 'communication', 'comunicacao', 'comunicação',
      'treasure', 'tesouro', 'fan club', 'fa clube', 'fã-clube',
      'poffin', 'aroma', 'radar', 'pokenav', 'pokénav', 'search', 'busca'
    ]
  },
  {
    role: 'switch_reposition',
    labelPt: 'Troca & Recuo de Pokémon Ativo',
    labelEn: 'Active Pokémon Switch & Reposition',
    keywords: [
      'switch', 'substituicao', 'substituição', 'escape rope', 'corda',
      'u-turn', 'prancha', 'prime catcher', 'balloon', 'balao', 'balão',
      'cart', 'carrinho', 'tate & liza', 'tate e liza', 'air balloon'
    ]
  },
  {
    role: 'discard_recovery',
    labelPt: 'Recuperação e Reciclagem de Descarte',
    labelEn: 'Discard Recovery & Recycle',
    keywords: [
      'stretcher', 'maca', 'rod', 'vara', 'retrieval', 'recuperacao', 'recuperação',
      'recycle', 'reciclagem', 'fisherman', 'pescador', 'super rod', 'energy retrieval'
    ]
  },
  {
    role: 'draw_supporter',
    labelPt: 'Compra e Renovação de Mão',
    labelEn: 'Hand Refresh & Draw Supporter',
    keywords: [
      'research', 'pesquisa', 'cynthia', 'cintia', 'cíntia', 'iono', 'judge',
      'juiz', 'marnie', 'colress', 'hau', 'nemona', 'explorer', 'lillie',
      'lilian', 'draw', 'compra'
    ]
  },
  {
    role: 'gust_disruption',
    labelPt: 'Puxar Pokémon do Banco do Oponente (Gust)',
    labelEn: 'Opponent Bench Disruption (Gust Effect)',
    keywords: [
      'boss', 'ordens', 'guzma', 'serena', 'lysandre', 'counter catcher',
      'catcher', 'pega'
    ]
  },
  {
    role: 'energy_acceleration',
    labelPt: 'Aceleração e Suporte de Energia',
    labelEn: 'Energy Acceleration & Movement',
    keywords: [
      'energy switch', 'substituição de energia', 'elixir', 'transceiver',
      'transmissor', 'welder', 'soldadora', 'volkner'
    ]
  }
];

// Helper to extract base Pokémon species name without suffixes like "ex", "GX", "V", "Team Rocket's"
export function extractPokemonSpecies(name: string): string {
  if (!name) return '';
  let clean = name.toLowerCase();
  
  // Remove prefixes
  clean = clean.replace(/^(team rocket's|da equipe rocket|radiant|brilhante|shining)\s+/i, '');
  
  // Remove suffixes
  clean = clean.replace(/\s+(ex|gx|v|vmax|vstar|tag team|da equipe rocket)$/i, '');
  clean = clean.replace(/\s+ex\b/i, '');
  clean = clean.replace(/\s+gx\b/i, '');
  clean = clean.replace(/\s+v\b/i, '');
  
  return clean.trim();
}

/**
 * Finds similar, alternative or functionally equivalent cards from the user's collection.
 * 
 * @param target The card to find substitutes for (name, set, category, color)
 * @param collection The available collection cards with quantity > 0
 * @param limit Maximum number of matches to return (default 6)
 */
export function findSimilarCards(
  target: {
    id?: string;
    name_pt: string;
    name_en: string;
    card_category: string;
    color_code?: string;
    set_code?: string;
    card_number?: string;
  },
  collection: Card[],
  limit: number = 6
): SimilarCardMatch[] {
  if (!target || !collection || collection.length === 0) return [];

  const targetPt = (target.name_pt || '').toLowerCase();
  const targetEn = (target.name_en || '').toLowerCase();
  const targetCategory = target.card_category || 'Pokémon';
  const targetColor = (target.color_code || '').toUpperCase();
  const targetSet = (target.set_code || '').toUpperCase();
  const targetNum = target.card_number || '';
  const targetSpecies = targetCategory === 'Pokémon' ? extractPokemonSpecies(target.name_en || target.name_pt) : '';

  // Determine target trainer clusters (if trainer)
  const targetClusters = targetCategory === 'Trainer'
    ? TRAINER_CLUSTERS.filter(c => c.keywords.some(k => targetPt.includes(k) || targetEn.includes(k)))
    : [];

  const matches: SimilarCardMatch[] = [];

  for (const card of collection) {
    // Must be in collection
    if ((card.quantity || 0) <= 0) continue;

    // Do not compare against the exact same card in the same set/number
    if (card.id === target.id) continue;
    if (card.set_code.toUpperCase() === targetSet && card.card_number === targetNum) continue;

    const cardPt = (card.name_pt || '').toLowerCase();
    const cardEn = (card.name_en || '').toLowerCase();
    let score = 0;
    let reasonPt = '';
    let reasonEn = '';

    // Level 1: Exact Name Match in a Different Expansion / Set
    if (
      (cardEn && cardEn === targetEn) ||
      (cardPt && cardPt === targetPt)
    ) {
      score = 100;
      reasonPt = `Edição Equivalente (${card.set_code} #${card.card_number})`;
      reasonEn = `Equivalent Print (${card.set_code} #${card.card_number})`;
    }
    // Level 2: Pokémon Similarity
    else if (targetCategory === 'Pokémon' && card.card_category === 'Pokémon') {
      const cardSpecies = extractPokemonSpecies(card.name_en || card.name_pt);
      
      // Same Species
      if (targetSpecies && cardSpecies && (targetSpecies === cardSpecies || cardSpecies.includes(targetSpecies) || targetSpecies.includes(cardSpecies))) {
        score = 85;
        reasonPt = `Mesma Espécie Pokémon (${card.name_pt})`;
        reasonEn = `Same Pokémon Species (${card.name_en})`;
      }
      // Same Elemental Type and Power Level (ex/GX)
      else if (targetColor && card.color_code === targetColor) {
        const isTargetSpecial = targetPt.includes('ex') || targetPt.includes('gx') || targetEn.includes('ex') || targetEn.includes('gx');
        const isCardSpecial = cardPt.includes('ex') || cardPt.includes('gx') || cardEn.includes('ex') || cardEn.includes('gx');
        
        if (isTargetSpecial && isCardSpecial) {
          score = 65;
          reasonPt = `Atacante do Mesmo Tipo (${card.color_name || 'Tipo'})`;
          reasonEn = `Attacker of Same Type (${card.color_name || 'Type'})`;
        } else {
          score = 45;
          reasonPt = `Pokémon do Mesmo Tipo (${card.color_name || 'Tipo'})`;
          reasonEn = `Pokémon of Same Type (${card.color_name || 'Type'})`;
        }
      }
    }
    // Level 3: Trainer Functional Cluster Match
    else if (targetCategory === 'Trainer' && card.card_category === 'Trainer') {
      const matchingCluster = targetClusters.find(cluster => 
        cluster.keywords.some(k => cardPt.includes(k) || cardEn.includes(k))
      );

      if (matchingCluster) {
        score = 75;
        reasonPt = matchingCluster.labelPt;
        reasonEn = matchingCluster.labelEn;
      }
    }
    // Level 4: Energy Match
    else if (targetCategory === 'Energy' && card.card_category === 'Energy') {
      if (targetColor && card.color_code === targetColor) {
        score = 70;
        reasonPt = `Energia do Mesmo Tipo (${card.color_name || 'Elemental'})`;
        reasonEn = `Energy of Same Type (${card.color_name || 'Elemental'})`;
      }
    }

    if (score > 0) {
      matches.push({
        card,
        score,
        reasonPt,
        reasonEn
      });
    }
  }

  // Sort matches by highest score first, then by quantity owned descending
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.card.quantity || 1) - (a.card.quantity || 1);
  });

  return matches.slice(0, limit);
}
