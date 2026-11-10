import type { Card } from '../types';
import { getSetReleaseYear, SET_OFFICIAL_NAMES_PT } from '../utils/setMetadata';
import { ensureSetInCatalog, getCachedSetsList } from './tcgSetsService';

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
  setHint?: string;
}

const SET_ID_TO_CODE: Record<string, string> = {
  // Celebração de 30 Anos (2026)
  '30th': '30TH',
  '30th-c': '30TH-C',
  '30c': '30TH',

  // Megaevolução (2025-2026)
  'me01': 'ME01', 'me1': 'ME01',
  'me02': 'ME02', 'me2': 'ME02',
  'me02.5': 'ME02.5', 'me2.5': 'ME02.5',
  'me03': 'ME03', 'me3': 'ME03',
  'me04': 'ME04', 'me4': 'ME04',
  'me05': 'ME05', 'me5': 'ME05',
  'me06': 'ME06', 'me6': 'ME06',
  'me07': 'ME07', 'me7': 'ME07',
  'me08': 'ME08', 'me8': 'ME08',
  'me09': 'ME09', 'me9': 'ME09',
  'me10': 'ME10',
  'mee': 'MEE',
  'mep': 'MEP',

  // Scarlet & Violet & SWSH
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
  'sv09': 'JTG',
  'sv9': 'JTG',
  'sv10': 'DRI',
  'dri': 'DRI',
  'sv10.5w': 'WHT',
  'sv10.5b': 'BLK',
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

// Reverse mapping: Set Code -> TCGdex Set ID
const SET_CODE_TO_TCGDEX_ID: Record<string, string> = {};
for (const [tcgdexId, code] of Object.entries(SET_ID_TO_CODE)) {
  const upperCode = code.toUpperCase();
  if (!SET_CODE_TO_TCGDEX_ID[upperCode] || tcgdexId.includes('0')) {
    SET_CODE_TO_TCGDEX_ID[upperCode] = tcgdexId;
  }
}

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
  'ilustração rara especial': 'S',
  'special illustration rare': 'S',
  'hiper rara': 'S',
  'hyper rare': 'S',
  'rara secreta': 'S',
  'secreta rara': 'S',
  'secret rare': 'S',
  'rara futurista': '30th',
  'futuristic rare': '30th',
  'futuristic': '30th'
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
  'raios': { code: 'L', name: 'Lightning' },
  'lightning': { code: 'L', name: 'Lightning' },
  'psíquico': { code: 'P', name: 'Psychic' },
  'psiquico': { code: 'P', name: 'Psychic' },
  'psychic': { code: 'P', name: 'Psychic' },
  'luta': { code: 'F', name: 'Fighting' },
  'lutador': { code: 'F', name: 'Fighting' },
  'combate': { code: 'F', name: 'Fighting' },
  'fighting': { code: 'F', name: 'Fighting' },
  'escuridão': { code: 'D', name: 'Darkness' },
  'escuridao': { code: 'D', name: 'Darkness' },
  'sombrio': { code: 'D', name: 'Darkness' },
  'noturno': { code: 'D', name: 'Darkness' },
  'dark': { code: 'D', name: 'Darkness' },
  'darkness': { code: 'D', name: 'Darkness' },
  'metal': { code: 'M', name: 'Metal' },
  'aço': { code: 'M', name: 'Metal' },
  'aco': { code: 'M', name: 'Metal' },
  'steel': { code: 'M', name: 'Metal' },
  'fada': { code: 'Y', name: 'Fairy' },
  'fairy': { code: 'Y', name: 'Fairy' },
  'dragão': { code: 'O', name: 'Dragon' },
  'dragao': { code: 'O', name: 'Dragon' },
  'dragon': { code: 'O', name: 'Dragon' },
  'incolor': { code: 'C', name: 'Colorless' },
  'colorless': { code: 'C', name: 'Colorless' }
};

const TRAINER_TRANSLATIONS_EN_TO_PT: Record<string, string> = {
  'switch': 'Substituição',
  'ultra ball': 'Ultra Bola',
  'poké pad': 'Poké Bloco',
  'poke pad': 'Poké Bloco',
  'professor\'s research': 'Pesquisa de Professores',
  'boss\'s orders': 'Ordens da Chefia',
  'rare candy': 'Doce Raro',
  'energy retrieval': 'Recuperação de Energia',
  'super rod': 'Supervara',
  'nest ball': 'Bola Ninho',
  'buddy-buddy poffin': 'Poffin de Companheirismo',
  'earthen vessel': 'Vaso Terrestre',
  'counter catcher': 'Pegador de Reversão',
  'night stretcher': 'Maca Noturna'
};

const TRAINER_TRANSLATIONS_PT_TO_EN: Record<string, string> = {
  'substituicao': 'Switch',
  'substituição': 'Switch',
  'ultra bola': 'Ultra Ball',
  'poke bloco': 'Poké Pad',
  'poké bloco': 'Poké Pad'
};

function stripAccents(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Translates known English card names or prefixes (e.g. Alolan, Hisuian) to Portuguese.
 */
function translateNameToPt(nameEn: string): string {
  if (!nameEn) return '';
  const lower = nameEn.toLowerCase().trim();
  if (TRAINER_TRANSLATIONS_EN_TO_PT[lower]) {
    return TRAINER_TRANSLATIONS_EN_TO_PT[lower];
  }

  if (nameEn.startsWith('Alolan ')) {
    return nameEn.replace('Alolan ', '') + ' de Alola';
  }
  if (nameEn.startsWith('Galarian ')) {
    return nameEn.replace('Galarian ', '') + ' de Galar';
  }
  if (nameEn.startsWith('Hisuian ')) {
    return nameEn.replace('Hisuian ', '') + ' de Hisui';
  }
  if (nameEn.startsWith('Paldean ')) {
    return nameEn.replace('Paldean ', '') + ' de Paldea';
  }

  return nameEn;
}

interface SetSearchEntry {
  tcgdexId: string;
  code: string;
  namesNorm: string[];
}

let cachedLiveSetsEntries: SetSearchEntry[] | null = null;
let liveSetsPromise: Promise<SetSearchEntry[]> | null = null;

/**
 * Builds a comprehensive list of known + dynamically synced sets so queries can match
 * any collection name (e.g., "Reinado Delta", "Delta Reign", "Escuridão Absoluta") or code ("ME06").
 */
function buildSetSearchEntries(extraSets?: Array<{ id: string; code: string; namePt?: string; nameEn?: string }>): SetSearchEntry[] {
  const map = new Map<string, SetSearchEntry>();

  const addEntry = (tcgdexId: string, code: string, names: (string | undefined)[]) => {
    const idClean = tcgdexId.trim().toLowerCase();
    const codeClean = code.trim().toUpperCase();
    if (!idClean) return;

    const existing = map.get(idClean) || { tcgdexId: idClean, code: codeClean, namesNorm: [] };
    for (const n of names) {
      if (!n) continue;
      const norm = stripAccents(n.toLowerCase().trim());
      if (norm.length >= 2 && !existing.namesNorm.includes(norm)) {
        existing.namesNorm.push(norm);
      }
    }
    map.set(idClean, existing);
  };

  // 1. From SET_ID_TO_CODE + SET_OFFICIAL_NAMES_PT
  for (const [id, code] of Object.entries(SET_ID_TO_CODE)) {
    const ptName = SET_OFFICIAL_NAMES_PT[code] || SET_OFFICIAL_NAMES_PT[id.toUpperCase()];
    addEntry(id, code, [ptName, code, id]);
  }

  // 2. Hardcoded English / Portuguese aliases for recent expansions
  addEntry('me06', 'ME06', ['Reinado Delta', 'Delta Reign', 'ME06', 'ME6']);
  addEntry('me05', 'ME05', ['Escuridão Absoluta', 'Pitch Black', 'ME05', 'ME5']);
  addEntry('me04', 'ME04', ['Caos Ascendente', 'Chaos Rising', 'ME04', 'ME4']);
  addEntry('me03', 'ME03', ['Equilíbrio Perfeito', 'Perfect Order', 'ME03', 'ME3']);
  addEntry('me02.5', 'ME02.5', ['Heróis Excelsos', 'Ascended Heroes', 'ME02.5', 'ME2.5']);
  addEntry('me02', 'ME02', ['Fogo Fantasmagórico', 'Phantasmal Flames', 'ME02', 'ME2']);
  addEntry('me01', 'ME01', ['Megaevolução', 'Mega Evolution', 'ME01', 'ME1']);
  addEntry('30th', '30TH', ['Celebração de 30 Anos', '30 Anos', '30th']);

  // 3. From getCachedSetsList() (includes dynamically synced TCGdex sets)
  for (const item of getCachedSetsList()) {
    const tcgdexId = SET_CODE_TO_TCGDEX_ID[item.code.toUpperCase()] || item.id.toLowerCase();
    addEntry(tcgdexId, item.code, [item.namePt, item.nameEn, item.code, item.id]);
  }

  // 4. Extra sets fetched directly from TCGdex
  if (extraSets) {
    for (const s of extraSets) {
      addEntry(s.id, s.code, [s.namePt, s.nameEn, s.code, s.id]);
    }
  }

  return Array.from(map.values());
}

/**
 * Ensures we have the latest sets list from TCGdex API in memory (including brand-new sets).
 */
async function getLiveSetSearchEntries(): Promise<SetSearchEntry[]> {
  if (cachedLiveSetsEntries) return cachedLiveSetsEntries;
  if (liveSetsPromise) return liveSetsPromise;

  liveSetsPromise = (async () => {
    try {
      const [ptRes, enRes] = await Promise.all([
        fetch('https://api.tcgdex.net/v2/pt/sets').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('https://api.tcgdex.net/v2/en/sets').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const enMap: Record<string, string> = {};
      if (Array.isArray(enRes)) {
        for (const s of enRes) {
          if (s?.id && s?.name) enMap[String(s.id).toLowerCase()] = String(s.name);
        }
      }

      const extra: Array<{ id: string; code: string; namePt?: string; nameEn?: string }> = [];
      if (Array.isArray(ptRes)) {
        for (const s of ptRes) {
          if (!s?.id) continue;
          const idLower = String(s.id).toLowerCase();
          const code = SET_ID_TO_CODE[idLower] || String(s.id).toUpperCase();
          const namePt = String(s.name || code);
          const nameEn = enMap[idLower] || namePt;
          extra.push({ id: idLower, code, namePt, nameEn });
          ensureSetInCatalog(code, namePt);
        }
      }

      cachedLiveSetsEntries = buildSetSearchEntries(extra);
      return cachedLiveSetsEntries;
    } catch (_) {
      return buildSetSearchEntries();
    } finally {
      liveSetsPromise = null;
    }
  })();

  return liveSetsPromise;
}

/**
 * Extracts a set hint from the query if the user typed a collection name or set code
 * (e.g., "Magmortar Reinado Delta", "Magmortar ME06 21", "Reinado Delta").
 */
function extractSetHintFromQuery(
  rawInput: string,
  entries: SetSearchEntry[]
): { cleanedInput: string; setHint?: string } {
  let trimmed = rawInput.trim();
  if (!trimmed) return { cleanedInput: '' };

  if (/\b(30th|30 anos|30ano|trinta anos)\b/i.test(trimmed)) {
    return {
      cleanedInput: trimmed.replace(/\b(30th|30 anos|30ano|trinta anos)\b/gi, '').trim(),
      setHint: '30th'
    };
  }

  const normInput = stripAccents(trimmed.toLowerCase());

  // 1. Check multi-word or long set names first (sorted longest first so "Reinado Delta" matches before "Delta")
  const namedCandidates: Array<{ phrase: string; tcgdexId: string }> = [];
  for (const entry of entries) {
    for (const nameNorm of entry.namesNorm) {
      if (nameNorm.length >= 4 && !/^[a-z0-9.]+$/.test(nameNorm)) {
        namedCandidates.push({ phrase: nameNorm, tcgdexId: entry.tcgdexId });
      }
    }
  }
  namedCandidates.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const cand of namedCandidates) {
    const idx = normInput.indexOf(cand.phrase);
    if (idx !== -1) {
      const before = trimmed.slice(0, idx).trim();
      const after = trimmed.slice(idx + cand.phrase.length).trim();
      const cleaned = `${before} ${after}`.replace(/^[-–—•,\s]+|[-–—•,\s]+$/g, '').trim();
      return { cleanedInput: cleaned, setHint: cand.tcgdexId };
    }
  }

  // 2. Check explicit set code tokens (e.g. ME06, ME6, ME05, SV09, SVI, PAL, OBF, DRI, PRE)
  const tokens = trimmed.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const tokClean = tokens[i].replace(/^[#(]+|[)]+$/g, '').toLowerCase();
    // Match ME01..ME99, SV01..SV99, SWSH1..SWSH12, or known 3-letter set codes
    const matchedEntry = entries.find(
      e =>
        e.tcgdexId === tokClean ||
        e.code.toLowerCase() === tokClean ||
        `me0${tokClean.replace(/^me/, '')}` === e.tcgdexId
    );
    if (matchedEntry && (tokens.length > 1 || /^(me|sv|swsh)\d/i.test(tokClean) || tokClean.length >= 3)) {
      // Avoid treating a Pokémon name like "Mew" as set code MEW if it's the only word
      if (tokClean === 'mew' && tokens.length === 1) continue;
      const remaining = [...tokens.slice(0, i), ...tokens.slice(i + 1)].join(' ').trim();
      return { cleanedInput: remaining, setHint: matchedEntry.tcgdexId };
    }
  }

  return { cleanedInput: trimmed };
}

/**
 * Parses user search query string into card name, card number, total in set, and set hint.
 */
export function parseCardQuery(input: string, customEntries?: SetSearchEntry[]): ParsedQuery {
  const entries = customEntries || buildSetSearchEntries();
  const { cleanedInput, setHint } = extractSetHintFromQuery(input, entries);
  const trimmed = cleanedInput.trim();

  if (!trimmed) {
    return { name: '', setHint };
  }

  // Only a number left (e.g. when query was "Reinado Delta 21" or "ME06 021/103")
  const onlySlashNum = trimmed.match(/^#?(\d+)\s*\/\s*(\d+)$/);
  if (onlySlashNum) {
    return {
      name: '',
      number: onlySlashNum[1],
      total: onlySlashNum[2],
      setHint
    };
  }
  const onlyNum = trimmed.match(/^#?(\d+)$/);
  if (onlyNum) {
    return {
      name: '',
      number: onlyNum[1],
      setHint
    };
  }

  // Format: "Charizard 10/125" or "Charizard 081/182"
  const slashMatch = trimmed.match(/^(.*?)\s*#?(\d+)\s*\/\s*(\d+)\s*$/i);
  if (slashMatch) {
    return {
      name: slashMatch[1].trim(),
      number: slashMatch[2].trim(),
      total: slashMatch[3].trim(),
      setHint
    };
  }

  // Format: "10/125 Charizard"
  const prefixSlashMatch = trimmed.match(/^#?(\d+)\s*\/\s*(\d+)\s+(.*?)$/i);
  if (prefixSlashMatch) {
    return {
      name: prefixSlashMatch[3].trim(),
      number: prefixSlashMatch[1].trim(),
      total: prefixSlashMatch[2].trim(),
      setHint
    };
  }

  // Format: "Charizard 10" or "Charizard #10" or "Ultra Bola 196"
  const numberMatch = trimmed.match(/^(.*?)\s*#?(\d+)\s*$/i);
  if (numberMatch && numberMatch[1].trim().length > 0) {
    return {
      name: numberMatch[1].trim(),
      number: numberMatch[2].trim(),
      setHint
    };
  }

  return { name: trimmed, setHint };
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
 * Extracts the best available high-resolution card image URL from a TCGdex card detail object.
 * Supports TCGdex direct assets, TCGPlayer root/pricing/variant product IDs (used by new sets like ME06 Reinado Delta),
 * and pokemontcg.io fallback for older expansions.
 */
export function extractBestCardImageUrl(detail: any): string {
  if (!detail) return '';

  // Tier 1: Direct TCGdex asset scan
  if (detail.image) {
    return `${detail.image}/high.png`;
  }

  // Tier 2: TCGPlayer product scan from root `thirdParty.tcgplayer`, `pricing.tcgplayer`, or `variants_detailed`
  let tcgplayerId: number | string | undefined = detail.thirdParty?.tcgplayer;

  if (!tcgplayerId && detail.pricing?.tcgplayer) {
    const tcp = detail.pricing.tcgplayer;
    tcgplayerId =
      tcp.holofoil?.productId ||
      tcp.normal?.productId ||
      tcp['reverse-holofoil']?.productId ||
      tcp['1st-edition-holofoil']?.productId;
  }

  if (!tcgplayerId && Array.isArray(detail.variants_detailed)) {
    for (const v of detail.variants_detailed) {
      if (v?.thirdParty?.tcgplayer) {
        tcgplayerId = v.thirdParty.tcgplayer;
        break;
      }
    }
  }

  if (tcgplayerId) {
    return `https://tcgplayer-cdn.tcgplayer.com/product/${tcgplayerId}_in_1000x1000.jpg`;
  }

  // Tier 3: pokemontcg.io standard scan (only for sets that exist on pokemontcg.io, not ME/30th)
  const setIdLower = String(detail.set?.id || '').toLowerCase();
  if (setIdLower && detail.localId && !setIdLower.startsWith('me0') && !setIdLower.startsWith('30th')) {
    const cleanNum = String(detail.localId).replace(/^0+/, '') || '1';
    return `https://images.pokemontcg.io/${setIdLower}/${cleanNum}.png`;
  }

  return '';
}

/**
 * Assigns a numeric priority score to a candidate card ID so newest expansions
 * (e.g. 2026 Megaevolução ME06 Reinado Delta, ME05, 30TH, SV10, SV09) appear first.
 */
function getCandidateRecencyScore(cardId: string): number {
  const idLower = (cardId || '').toLowerCase();
  const setPrefix = idLower.split('-')[0] || '';

  // Direct ME series (me06 > me05 > me04 > ...)
  const meMatch = setPrefix.match(/^me0?(\d+(?:\.\d+)?)$/);
  if (meMatch) {
    return 202600 + Math.round(parseFloat(meMatch[1]) * 10);
  }
  if (setPrefix.startsWith('30th')) {
    return 202605;
  }

  // Direct SV series (sv10 > sv09 > sv08.5 > ...)
  const svMatch = setPrefix.match(/^sv0?(\d+(?:\.\d+)?)/);
  if (svMatch) {
    return 202400 + Math.round(parseFloat(svMatch[1]) * 10);
  }

  // Direct SWSH series
  const swshMatch = setPrefix.match(/^swsh0?(\d+(?:\.\d+)?)/);
  if (swshMatch) {
    return 202100 + Math.round(parseFloat(swshMatch[1]) * 10);
  }

  const mappedCode = SET_ID_TO_CODE[setPrefix] || setPrefix.toUpperCase();
  const year = getSetReleaseYear(mappedCode);
  if (year) {
    return year * 100;
  }

  // De-prioritize TCG Pocket digital sets (A1, A2, B1, etc.) below physical sets
  if (/^[ab]\d/i.test(setPrefix)) {
    return 199000;
  }

  return 200000;
}

/**
 * Fetches full PT + EN details for a TCGdex card ID and converts to CardLookupResult.
 */
async function fetchCardDetailById(cardId: string, fallbackNumber?: string, fallbackTotal?: string): Promise<CardLookupResult | null> {
  try {
    let detail: any = null;
    let namePt = '';
    let nameEn = '';

    const [ptRes, enRes] = await Promise.all([
      fetch(`https://api.tcgdex.net/v2/pt/cards/${encodeURIComponent(cardId)}`).catch(() => null),
      fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`).catch(() => null)
    ]);

    if (ptRes && ptRes.ok) {
      try {
        detail = await ptRes.json();
        if (detail?.name) namePt = detail.name;
      } catch (_) {}
    }

    if (enRes && enRes.ok) {
      try {
        const enDetail = await enRes.json();
        if (enDetail?.name) nameEn = enDetail.name;
        if (!detail) {
          detail = enDetail;
        } else {
          // Merge thirdParty/pricing/image from EN if missing in PT
          if (!detail.image && enDetail.image) detail.image = enDetail.image;
          if (!detail.thirdParty && enDetail.thirdParty) detail.thirdParty = enDetail.thirdParty;
          if (!detail.pricing && enDetail.pricing) detail.pricing = enDetail.pricing;
        }
      } catch (_) {}
    }

    if (!detail) return null;

    if (!nameEn) nameEn = namePt || detail.name || '';
    if (!namePt || namePt === nameEn) {
      namePt = translateNameToPt(nameEn);
    }

    const setIdLower = (detail.set?.id || '').toLowerCase();
    const setCode = SET_ID_TO_CODE[setIdLower] || (detail.set?.id || 'IMP').toUpperCase();

    let setName = SET_OFFICIAL_NAMES_PT[setCode] || detail.set?.name || 'Pokémon TCG';
    if (setIdLower === '30th' || setCode === '30TH') {
      setName = 'Celebração de 30 Anos';
    } else if (setIdLower === '30th-c' || setCode === '30TH-C') {
      setName = 'Coleção Clássica de 30 Anos';
    }

    // Automatically register any newly discovered set in the app's set catalog
    ensureSetInCatalog(setCode, setName);

    const primaryTypeStr = (detail.types && detail.types[0]) ? detail.types[0].toLowerCase() : '';
    const typeInfo = TYPE_MAP[primaryTypeStr] || { code: 'C', name: 'Colorless' };

    let category: 'Pokémon' | 'Trainer' | 'Energy' = 'Pokémon';
    let colorCode = typeInfo.code;
    let colorName = typeInfo.name;

    if (detail.category === 'Treinador' || detail.category === 'Trainer') {
      category = 'Trainer';
      colorCode = '';
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
      : (fallbackTotal || '100');

    const imageUrl = extractBestCardImageUrl(detail);

    let rarityName = detail.rarity || 'Comum';
    if (rarityLower === 'futuristic rare') {
      rarityName = 'Rara Futurista';
    } else if (rarityLower === 'illustration rare') {
      rarityName = 'Ilustração Rara';
    } else if (rarityLower === 'special illustration rare') {
      rarityName = 'Ilustração Rara Especial';
    } else if (rarityLower === 'double rare') {
      rarityName = 'Dupla Rara';
    } else if (rarityLower === 'ultra rare') {
      rarityName = 'Ultra Rara';
    } else if (rarityLower === 'common') {
      rarityName = 'Comum';
    } else if (rarityLower === 'uncommon') {
      rarityName = 'Incomum';
    } else if (rarityLower === 'rare') {
      rarityName = 'Rara';
    }

    return {
      id: detail.id,
      namePt: namePt || detail.name,
      nameEn: nameEn || detail.name,
      setCode,
      setName,
      cardNumber: detail.localId || fallbackNumber || '1',
      totalInSet: totalOfficial,
      category,
      colorCode,
      colorName,
      rarityCode,
      rarityName,
      imageUrl,
      hp: detail.hp,
      types: detail.types
    };
  } catch (err) {
    console.warn('Error fetching card detail for', cardId, err);
    return null;
  }
}

/**
 * Queries TCGdex API (Portuguese first, merged with English fallback, plus direct set lookup)
 * to retrieve and format card candidates, automatically discovering new expansions like Reinado Delta (ME06).
 */
export async function lookupCardOnline(query: string): Promise<CardLookupResult[]> {
  const liveEntries = await getLiveSetSearchEntries();
  const parsed = parseCardQuery(query, liveEntries);

  if (!parsed.name && !parsed.setHint) return [];

  try {
    const seenIds = new Set<string>();
    const candidatesList: any[] = [];

    // Case 1: If a setHint was detected (e.g., "Reinado Delta", "ME06", "Magmortar Reinado Delta"),
    // fetch that set's card list directly so even brand-new sets or set-only searches work reliably!
    if (parsed.setHint) {
      const [setPtRes, setEnRes] = await Promise.all([
        fetch(`https://api.tcgdex.net/v2/pt/sets/${encodeURIComponent(parsed.setHint)}`).catch(() => null),
        fetch(`https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(parsed.setHint)}`).catch(() => null)
      ]);

      const setData = (setPtRes?.ok ? await setPtRes.json().catch(() => null) : null) ||
                      (setEnRes?.ok ? await setEnRes.json().catch(() => null) : null);

      if (setData?.cards && Array.isArray(setData.cards)) {
        const searchNameNorm = stripAccents((COMMON_TYPOS[parsed.name.toLowerCase()] || parsed.name).toLowerCase().trim());
        for (const c of setData.cards) {
          if (!c?.id) continue;
          const cardNameNorm = stripAccents(String(c.name || '').toLowerCase());
          const matchesName = !searchNameNorm || cardNameNorm.includes(searchNameNorm);
          if (matchesName && !seenIds.has(c.id)) {
            candidatesList.push(c);
            seenIds.add(c.id);
          }
        }
      }
    }

    // Case 2: Query Portuguese and English card endpoints by name
    if (parsed.name) {
      const rawNameLower = parsed.name.toLowerCase().trim();
      const searchName = COMMON_TYPOS[rawNameLower] || parsed.name;
      const englishSearchName = TRAINER_TRANSLATIONS_PT_TO_EN[rawNameLower] || searchName;

      const [ptRes, enRes] = await Promise.all([
        fetch(`https://api.tcgdex.net/v2/pt/cards?name=${encodeURIComponent(searchName)}`).catch(() => null),
        fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(englishSearchName)}`).catch(() => null)
      ]);

      let ptList: any[] = [];
      let enList: any[] = [];

      if (ptRes && ptRes.ok) {
        try {
          ptList = await ptRes.json();
        } catch (_) {}
      }
      if (enRes && enRes.ok) {
        try {
          enList = await enRes.json();
        } catch (_) {}
      }

      if (Array.isArray(ptList)) {
        for (const c of ptList) {
          if (c && c.id && !seenIds.has(c.id)) {
            candidatesList.push(c);
            seenIds.add(c.id);
          }
        }
      }

      if (Array.isArray(enList)) {
        for (const c of enList) {
          if (c && c.id && !seenIds.has(c.id)) {
            candidatesList.push(c);
            seenIds.add(c.id);
          }
        }
      }
    }

    if (candidatesList.length === 0) return [];

    // Sort all candidates by recency (newest sets like ME06 Reinado Delta first!)
    candidatesList.sort((a, b) => getCandidateRecencyScore(b.id) - getCandidateRecencyScore(a.id));

    let filtered = candidatesList;

    if (parsed.setHint) {
      const hintLower = parsed.setHint.toLowerCase();
      const hintMatches = filtered.filter(c => {
        const cardId = (c.id || '').toLowerCase();
        return cardId.startsWith(`${hintLower}-`) || cardId.startsWith(hintLower);
      });
      if (hintMatches.length > 0) {
        filtered = [...hintMatches, ...filtered.filter(c => !hintMatches.includes(c))];
      }
    }

    if (parsed.number) {
      const targetClean = parsed.number.replace(/^0+/, '') || '1';
      const exactNumMatches = filtered.filter(c => {
        const cClean = (c.localId || '').replace(/^0+/, '') || '1';
        return cClean === targetClean;
      });

      if (exactNumMatches.length > 0) {
        // Keep ALL exact number matches (sorted newest sets first!) — never discard cards
        // whose brief object lacks `c.image` because new sets (like ME06) store scans in `detail.thirdParty.tcgplayer`.
        const otherMatches = filtered.filter(c => !exactNumMatches.includes(c));
        filtered = [...exactNumMatches, ...otherMatches];
      } else {
        const nearMatches = filtered.filter(c => {
          const cNum = parseInt((c.localId || '').replace(/\D/g, ''), 10);
          const targetNum = parseInt(targetClean, 10);
          return !isNaN(cNum) && !isNaN(targetNum) && Math.abs(cNum - targetNum) <= 2;
        });
        if (nearMatches.length > 0) {
          filtered = [...nearMatches, ...filtered.filter(c => !nearMatches.includes(c))];
        }
      }
    }

    // Fetch details for top 12 candidates concurrently
    const topCandidates = filtered.slice(0, 12);

    const detailedResults = await Promise.all(
      topCandidates.map(brief => fetchCardDetailById(brief.id, parsed.number, parsed.total))
    );

    const validResults = detailedResults.filter((r): r is CardLookupResult => r !== null);

    // If totalInSet was specified in query (e.g. "Magmortar 21/103"), prioritize exact totalInSet matches
    if (parsed.total) {
      const cleanTotal = parsed.total.replace(/^0+/, '');
      validResults.sort((a, b) => {
        const aMatchesTotal = a.totalInSet.replace(/^0+/, '') === cleanTotal ? 1 : 0;
        const bMatchesTotal = b.totalInSet.replace(/^0+/, '') === cleanTotal ? 1 : 0;
        return bMatchesTotal - aMatchesTotal;
      });
    }

    return validResults;
  } catch (error) {
    console.error('Failed to lookup card online:', error);
    return [];
  }
}

const DYNAMIC_IMAGE_CACHE_KEY = 'pokedex_tcg_resolved_images_v1';
const memoryImageCache = new Map<string, string>();
const inFlightImageLookups = new Map<string, Promise<string | null>>();

function getCachedDynamicImage(cacheKey: string): string | null {
  if (memoryImageCache.has(cacheKey)) {
    return memoryImageCache.get(cacheKey) || null;
  }
  try {
    const raw = localStorage.getItem(DYNAMIC_IMAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed[cacheKey] === 'string' && parsed[cacheKey]) {
        memoryImageCache.set(cacheKey, parsed[cacheKey]);
        return parsed[cacheKey];
      }
    }
  } catch (_) {}
  return null;
}

function saveCachedDynamicImage(cacheKey: string, imageUrl: string) {
  memoryImageCache.set(cacheKey, imageUrl);
  try {
    const raw = localStorage.getItem(DYNAMIC_IMAGE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[cacheKey] = imageUrl;
    localStorage.setItem(DYNAMIC_IMAGE_CACHE_KEY, JSON.stringify(parsed));
  } catch (_) {}
}

/**
 * Dynamically resolves a working card scan URL from TCGdex / TCGPlayer for cards in the collection
 * whose static image URLs failed to load (e.g. cards from brand-new sets like Reinado Delta / ME06).
 */
export async function resolveDynamicCardImage(card: Pick<Card, 'id' | 'name_pt' | 'name_en' | 'set_code' | 'set_pt' | 'set_en' | 'card_number'>): Promise<string | null> {
  const cleanSet = (card.set_code || '').trim().toUpperCase();
  const cleanNum = (card.card_number || '').trim();
  const name = (card.name_pt || card.name_en || '').trim();
  const cacheKey = `${cleanSet}_${cleanNum}_${name}`.toLowerCase();

  const cached = getCachedDynamicImage(cacheKey);
  if (cached) return cached;

  if (inFlightImageLookups.has(cacheKey)) {
    return inFlightImageLookups.get(cacheKey)!;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      const entries = await getLiveSetSearchEntries();
      const numDigits = cleanNum.replace(/\D/g, '') || '1';
      const paddedNum = numDigits.padStart(3, '0');
      const unpaddedNum = numDigits.replace(/^0+/, '') || '1';

      // 1. Resolve TCGdex set ID from set_code, set_pt, or set_en
      let tcgdexSetId = SET_CODE_TO_TCGDEX_ID[cleanSet];
      if (!tcgdexSetId) {
        const hintFromSet = extractSetHintFromQuery(`${cleanSet} ${card.set_pt || ''} ${card.set_en || ''}`, entries);
        if (hintFromSet.setHint) {
          tcgdexSetId = hintFromSet.setHint;
        } else if (/^ME\d/i.test(cleanSet)) {
          tcgdexSetId = cleanSet.toLowerCase().replace(/^me(\d)$/, 'me0$1');
        }
      }

      // 2. Try direct TCGdex card detail lookup by ID (e.g. me06-021)
      if (tcgdexSetId) {
        for (const candidateNum of [paddedNum, unpaddedNum]) {
          const directId = `${tcgdexSetId}-${candidateNum}`;
          const res = await fetchCardDetailById(directId, cleanNum);
          if (res?.imageUrl) {
            saveCachedDynamicImage(cacheKey, res.imageUrl);
            return res.imageUrl;
          }
        }
      }

      // 3. Fallback: search by card name + number (+ set hint if known)
      if (name) {
        const queryWithSet = `${name} ${cleanNum} ${tcgdexSetId || card.set_pt || ''}`.trim();
        let results = await lookupCardOnline(queryWithSet);
        if (results.length === 0) {
          results = await lookupCardOnline(`${name} ${cleanNum}`.trim());
        }
        if (results.length === 0) {
          results = await lookupCardOnline(name);
        }

        const withImage = results.find(r => Boolean(r.imageUrl));
        if (withImage?.imageUrl) {
          saveCachedDynamicImage(cacheKey, withImage.imageUrl);
          return withImage.imageUrl;
        }
      }

      return null;
    } catch (_) {
      return null;
    } finally {
      inFlightImageLookups.delete(cacheKey);
    }
  })();

  inFlightImageLookups.set(cacheKey, promise);
  return promise;
}
