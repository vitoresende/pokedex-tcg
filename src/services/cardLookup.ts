import { Card } from '../types';

export interface CardLookupResult {
  id: string;
  namePt: string;
  nameEn: string;
  setCode: string;
  setName: string;
  cardNumber: string;
  totalInSet: string;
  category: 'Pokémon' | 'Trainer' | 'Energy';
  colorCode: string;
  colorName: string;
  rarityCode: string;
  rarityName: string;
  imageUrl: string;
  hp?: number;
  types?: string[];
}

export interface ParsedQuery {
  name: string;
  number?: string;
  total?: string;
}

const SET_ID_TO_CODE: Record<string, string> = {
  'swsh10.5': 'PGO',
  'sv01': 'SVI',
  'sv1': 'SVI',
  'sv02': 'PAL',
  'sv2': 'PAL',
  'sv03': 'OBF',
  'sv3': 'OBF',
  'sv03.5': 'MEW',
  'sv3.5': 'MEW',
  'sv04': 'PAR',
  'sv4': 'PAR',
  'sv04.5': 'PAF',
  'sv4.5': 'PAF',
  'sv05': 'TEF',
  'sv5': 'TEF',
  'sv06': 'TWM',
  'sv6': 'TWM',
  'sv06.5': 'SFA',
  'sv6.5': 'SFA',
  'sv07': 'SCR',
  'sv7': 'SCR',
  'sv08': 'SSP',
  'sv8': 'SSP',
  'sv08.5': 'PRE',
  'sv8.5': 'PRE',
  'sv10': 'DRI',
  'dri': 'DRI',
  'swsh1': 'SSH',
  'swsh2': 'RCL',
  'swsh3': 'DAA',
  'swsh3.5': 'CPA',
  'swsh4': 'VIV',
  'swsh4.5': 'SHF',
  'swsh5': 'BST',
  'swsh6': 'CRE',
  'swsh7': 'EVS',
  'swsh7.5': 'CEL',
  'swsh8': 'FST',
  'swsh9': 'BRS',
  'swsh10': 'ASR',
  'swsh11': 'LOR',
  'swsh12': 'SIT',
  'swsh12.5': 'CRZ',
  'sm1': 'SUM',
  'sm2': 'GRI',
  'sm3': 'BUS',
  'sm3.5': 'SLG',
  'sm4': 'CIN',
  'sm5': 'UPR',
  'sm6': 'FLI',
  'sm7': 'CES',
  'sm7.5': 'DRM',
  'sm8': 'LOT',
  'sm9': 'TEU',
  'sm10': 'UNB',
  'sm11': 'UNM',
  'sm11.5': 'HIF',
  'sm12': 'CEC'
};

const RARITY_MAP: Record<string, string> = {
  'comum': 'C',
  'common': 'C',
  'incomum': 'U',
  'uncommon': 'U',
  'rara': 'R',
  'rare': 'R',
  'rara holo': 'RH',
  'rare holo': 'RH',
  'ultra rara': 'RU',
  'ultra rare': 'RU',
  'rara holo gx': 'RU',
  'rara holo v': 'RU',
  'rara ultra': 'RU',
  'dupla rara': 'RD',
  'double rare': 'RD',
  'ilustração rara': 'IR',
  'illustration rare': 'IR',
  'rara secreta': 'S',
  'secreta rara': 'S',
  'secret rare': 'S'
};

const TYPE_MAP: Record<string, { code: string; name: string }> = {
  'planta': { code: 'G', name: 'Grass' },
  'grama': { code: 'G', name: 'Grass' },
  'grass': { code: 'G', name: 'Grass' },
  'fogo': { code: 'R', name: 'Fire' },
  'fire': { code: 'R', name: 'Fire' },
  'água': { code: 'W', name: 'Water' },
  'agua': { code: 'W', name: 'Water' },
  'water': { code: 'W', name: 'Water' },
  'elétrico': { code: 'L', name: 'Lightning' },
  'eletrico': { code: 'L', name: 'Lightning' },
  'raio': { code: 'L', name: 'Lightning' },
  'lightning': { code: 'L', name: 'Lightning' },
  'psíquico': { code: 'P', name: 'Psychic' },
  'psiquico': { code: 'P', name: 'Psychic' },
  'psychic': { code: 'P', name: 'Psychic' },
  'luta': { code: 'F', name: 'Fighting' },
  'fighting': { code: 'F', name: 'Fighting' },
  'escuridão': { code: 'D', name: 'Darkness' },
  'escuridao': { code: 'D', name: 'Darkness' },
  'darkness': { code: 'D', name: 'Darkness' },
  'metal': { code: 'M', name: 'Metal' },
  'fada': { code: 'Y', name: 'Fairy' },
  'fairy': { code: 'Y', name: 'Fairy' },
  'dragão': { code: 'N', name: 'Dragon' },
  'dragao': { code: 'N', name: 'Dragon' },
  'dragon': { code: 'N', name: 'Dragon' },
  'incolor': { code: 'C', name: 'Colorless' },
  'colorless': { code: 'C', name: 'Colorless' }
};

/**
 * Parses user search query string into card name, card number, and total in set.
 * Supports:
 * - "Charizard 10/125"
 * - "Mewtwo 081/182"
 * - "10/78 Charizard"
 * - "Ultra Bola 196"
 * - "Pikachu"
 */
export function parseCardQuery(input: string): ParsedQuery {
  const trimmed = input.trim();
  if (!trimmed) return { name: '' };

  // Format: "Charizard 10/125" or "Charizard 081/182"
  const slashMatch = trimmed.match(/^(.*?)\s*#?(\d+)\s*\/\s*(\d+)\s*$/i);
  if (slashMatch) {
    return {
      name: slashMatch[1].trim(),
      number: slashMatch[2].trim(),
      total: slashMatch[3].trim()
    };
  }

  // Format: "10/125 Charizard"
  const prefixSlashMatch = trimmed.match(/^#?(\d+)\s*\/\s*(\d+)\s+(.*?)$/i);
  if (prefixSlashMatch) {
    return {
      name: prefixSlashMatch[3].trim(),
      number: prefixSlashMatch[1].trim(),
      total: prefixSlashMatch[2].trim()
    };
  }

  // Format: "Charizard 10" or "Charizard #10" or "Ultra Bola 196"
  const numberMatch = trimmed.match(/^(.*?)\s*#?(\d+)\s*$/i);
  if (numberMatch && numberMatch[1].trim().length > 0) {
    return {
      name: numberMatch[1].trim(),
      number: numberMatch[2].trim()
    };
  }

  return { name: trimmed };
}

const COMMON_TYPOS: Record<string, string> = {
  'slopoke': 'slowpoke',
  'pikashu': 'pikachu',
  'charzard': 'charizard',
  'blastoyse': 'blastoise',
  'blastois': 'blastoise',
  'venasaur': 'venusaur',
  'mewtwoo': 'mewtwo',
  'rayquasa': 'rayquaza',
  'eeve': 'eevee',
  'snorlax': 'snorlax',
  'dragonaite': 'dragonite',
  'necrozma': 'necrozma',
  'mimikiu': 'mimikyu',
  'lucario': 'lucario',
  'gardevoir': 'gardevoir'
};

/**
 * Queries TCGdex API (Portuguese first, English fallback) to retrieve and format card candidates.
 */
export async function lookupCardOnline(query: string): Promise<CardLookupResult[]> {
  const parsed = parseCardQuery(query);
  if (!parsed.name) return [];

  const rawNameLower = parsed.name.toLowerCase().trim();
  const searchName = COMMON_TYPOS[rawNameLower] || parsed.name;

  try {
    // 1. Query Portuguese endpoint
    let ptList: any[] = [];
    try {
      const ptRes = await fetch(`https://api.tcgdex.net/v2/pt/cards?name=${encodeURIComponent(searchName)}`);
      if (ptRes.ok) {
        ptList = await ptRes.json();
      }
    } catch (e) {
      console.warn('Could not query Portuguese TCGdex endpoint:', e);
    }

    // 2. Query English endpoint if no PT results
    let candidatesList = Array.isArray(ptList) ? ptList : [];

    if (candidatesList.length === 0) {
      try {
        const enRes = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(searchName)}`);
        if (enRes.ok) {
          const enList = await enRes.json();
          if (Array.isArray(enList) && enList.length > 0) {
            candidatesList = enList;
          }
        }
      } catch (e) {
        console.warn('Could not query English TCGdex endpoint:', e);
      }
    }

    if (candidatesList.length === 0) return [];

    // 3. Filter / prioritize candidates by card number if specified
    let filtered = candidatesList;
    if (parsed.number) {
      const targetClean = parsed.number.replace(/^0+/, '') || '1';
      const exactNumMatches = candidatesList.filter(c => {
        const cClean = (c.localId || '').replace(/^0+/, '') || '1';
        return cClean === targetClean;
      });

      const exactWithImage = exactNumMatches.filter(c => Boolean(c.image));

      if (exactWithImage.length > 0) {
        filtered = exactWithImage;
      } else if (exactNumMatches.length > 0) {
        // Exact match exists but has NO image on TCGdex (e.g. promo card mep-086).
        // Find near matches (e.g. #085) or other printings that DO have valid images
        const nearMatches = candidatesList.filter(c => {
          const cNum = parseInt((c.localId || '').replace(/\D/g, ''), 10);
          const targetNum = parseInt(targetClean, 10);
          return Math.abs(cNum - targetNum) <= 2 && Boolean(c.image);
        });
        filtered = [...exactNumMatches, ...nearMatches, ...candidatesList.filter(c => Boolean(c.image))];
      } else {
        // No exact match for this number: check close numbers (+- 2)
        const nearMatches = candidatesList.filter(c => {
          const cNum = parseInt((c.localId || '').replace(/\D/g, ''), 10);
          const targetNum = parseInt(targetClean, 10);
          return Math.abs(cNum - targetNum) <= 2;
        });
        if (nearMatches.length > 0) {
          filtered = [...nearMatches, ...candidatesList];
        }
      }
    }

    // Limit candidate detail fetches to top 5
    const topCandidates = filtered.slice(0, 5);

    const detailedResults = await Promise.all(
      topCandidates.map(async (brief): Promise<CardLookupResult | null> => {
        try {
          // Fetch PT details
          let detail: any = null;
          let namePt = brief.name;
          let nameEn = brief.name;

          try {
            const detailRes = await fetch(`https://api.tcgdex.net/v2/pt/cards/${brief.id}`);
            if (detailRes.ok) {
              detail = await detailRes.json();
              if (detail.name) namePt = detail.name;
            }
          } catch (e) {}

          // Fetch EN details for English name and fallback
          try {
            const enRes = await fetch(`https://api.tcgdex.net/v2/en/cards/${brief.id}`);
            if (enRes.ok) {
              const enDetail = await enRes.json();
              if (enDetail.name) nameEn = enDetail.name;
              if (!detail) detail = enDetail;
            }
          } catch (e) {}

          if (!detail) return null;

          const setIdLower = (detail.set?.id || '').toLowerCase();
          const setCode = SET_ID_TO_CODE[setIdLower] || (detail.set?.id || 'IMP').toUpperCase();
          const setName = detail.set?.name || 'Pokémon TCG';

          const primaryTypeStr = (detail.types && detail.types[0]) ? detail.types[0].toLowerCase() : '';
          const typeInfo = TYPE_MAP[primaryTypeStr] || { code: 'C', name: 'Colorless' };

          let category: 'Pokémon' | 'Trainer' | 'Energy' = 'Pokémon';
          let colorCode = typeInfo.code;
          let colorName = typeInfo.name;

          if (detail.category === 'Treinador' || detail.category === 'Trainer') {
            category = 'Trainer';
            colorCode = 'T';
            colorName = 'Trainer';
          } else if (detail.category === 'Energia' || detail.category === 'Energy') {
            category = 'Energy';
            colorCode = typeInfo.code || 'E';
            colorName = typeInfo.name || 'Energy';
          }

          const rarityLower = (detail.rarity || '').toLowerCase();
          const rarityCode = RARITY_MAP[rarityLower] || 'C';

          const totalOfficial = detail.set?.cardCount?.official 
            ? String(detail.set.cardCount.official) 
            : (parsed.total || '100');

          let imageUrl = detail.image ? `${detail.image}/high.png` : '';

          // Tier 2: TCGPlayer product scan (for cards/promos where TCGdex has no scan)
          if (!imageUrl && detail.variants_detailed) {
            for (const v of detail.variants_detailed) {
              if (v?.thirdParty?.tcgplayer) {
                imageUrl = `https://product-images.tcgplayer.com/fit-in/437x437/${v.thirdParty.tcgplayer}.jpg`;
                break;
              }
            }
          }

          // Tier 3: pokemontcg.io standard scan
          if (!imageUrl && detail.set?.id && detail.localId) {
            const cleanNum = String(detail.localId).replace(/^0+/, '') || '1';
            imageUrl = `https://images.pokemontcg.io/${detail.set.id.toLowerCase()}/${cleanNum}.png`;
          }

          return {
            id: detail.id,
            namePt: namePt || detail.name,
            nameEn: nameEn || detail.name,
            setCode,
            setName,
            cardNumber: detail.localId || parsed.number || '1',
            totalInSet: totalOfficial,
            category,
            colorCode,
            colorName,
            rarityCode,
            rarityName: detail.rarity || 'Comum',
            imageUrl,
            hp: detail.hp,
            types: detail.types
          };
        } catch (err) {
          console.warn('Error fetching card detail for', brief.id, err);
          return null;
        }
      })
    );

    return detailedResults.filter((r): r is CardLookupResult => r !== null);
  } catch (error) {
    console.error('Failed to lookup card online:', error);
    return [];
  }
}
