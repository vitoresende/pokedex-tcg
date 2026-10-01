import { syncSetsMetadataToFirestore, loadSetsMetadataFromFirestore } from './firebase';
import { 
  registerDynamicSets, 
  getSetReleaseYear, 
  getSetRegulationMark, 
  normalizeSetCode,
  SET_RELEASE_YEARS,
  SET_REGULATION_MARKS,
  SET_OFFICIAL_NAMES_PT
} from '../utils/setMetadata';

export interface SyncedSetItem {
  id: string;
  code: string;
  namePt: string;
  nameEn?: string;
  year: number;
  mark?: string | null;
  symbolUrl?: string;
  logoUrl?: string;
  totalCards?: number;
  officialCards?: number;
  releaseDate?: string;
  serie?: string;
}

export interface SetsMetadataPayload {
  lastSyncedAt: string;
  totalSets: number;
  sets: Record<string, SyncedSetItem>;
  releaseYears: Record<string, number>;
  regulationMarks: Record<string, string>;
  officialNamesPt: Record<string, string>;
}

const STORAGE_KEY = 'pokedex_tcg_sets_metadata';

/**
 * Maps known TCGdex IDs to standard tournament codes
 */
const KNOWN_ID_TO_CODE: Record<string, string> = {
  'me01': 'ME01', 'me02': 'ME02', 'me02.5': 'ME02.5', 'me03': 'ME03',
  'me04': 'ME04', 'me05': 'ME05', 'me06': 'ME06', 'me07': 'ME07', 'me08': 'ME08',
  'mee': 'MEE', 'mep': 'MEP',
  'sv01': 'SVI', 'sv02': 'PAL', 'sv03': 'OBF', 'sv03.5': 'MEW',
  'sv04': 'PAR', 'sv04.5': 'PAF', 'sv05': 'TEF', 'sv06': 'TWM',
  'sv06.5': 'SFA', 'sv07': 'SCR', 'sv08': 'SSP', 'sv08.5': 'PRE',
  'sv09': 'JTG', 'sv10': 'DRI', 'sv10.5w': 'WHT', 'sv10.5b': 'BLK',
  'svp': 'SVP', 'sve': 'SVE',
  'swsh1': 'SSH', 'swsh2': 'RCL', 'swsh3': 'DAA', 'swsh3.5': 'CPA',
  'swsh4': 'VIV', 'swsh4.5': 'SHF', 'swsh5': 'BST', 'swsh6': 'CRE',
  'swsh7': 'EVS', 'swsh7.5': 'CEL', 'swsh8': 'FST', 'swsh9': 'BRS',
  'swsh10': 'ASR', 'swsh10.5': 'PGO', 'swsh11': 'LOR', 'swsh12': 'SIT',
  'swsh12.5': 'CRZ', 'swshp': 'SWSHP',
  'sm1': 'SUM', 'sm2': 'GRI', 'sm3': 'BUS', 'sm3.5': 'SLG',
  'sm4': 'CIN', 'sm5': 'UPR', 'sm6': 'FLI', 'sm7': 'CES',
  'sm7.5': 'DRM', 'sm8': 'LOT', 'sm9': 'TEU', 'sm10': 'UNB',
  'sm11': 'UNM', 'sm11.5': 'HIF', 'sm12': 'CEC', 'smp': 'SMP',
};

/**
 * Calculates regulation mark letter from release year
 */
function calculateRegulationMark(year: number): string | null {
  if (year >= 2027) return 'K';
  if (year === 2026) return 'J';
  if (year === 2025) return 'I';
  if (year === 2024) return 'H';
  if (year === 2023) return 'G';
  if (year === 2022) return 'F';
  if (year === 2021) return 'E';
  if (year === 2020) return 'D';
  return null;
}

/**
 * Fetches all official Pokémon TCG sets from the TCGdex API in Portuguese,
 * enriched with series metadata, release years, and regulation marks.
 */
export async function fetchSetsFromTCGdex(): Promise<SyncedSetItem[]> {
  const setsRes = await fetch('https://api.tcgdex.net/v2/pt/sets');
  if (!setsRes.ok) {
    throw new Error(`Failed to fetch sets from TCGdex: ${setsRes.statusText}`);
  }
  const rawSets: any[] = await setsRes.json();

  // Also query series 'me' and 'sv' to get release dates of recent sets
  const releaseDatesMap: Record<string, string> = {};

  try {
    const [meRes, svRes] = await Promise.all([
      fetch('https://api.tcgdex.net/v2/pt/series/me').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.tcgdex.net/v2/pt/series/sv').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (meRes?.sets && Array.isArray(meRes.sets)) {
      for (const s of meRes.sets) {
        if (s.id && s.releaseDate) releaseDatesMap[s.id.toLowerCase()] = s.releaseDate;
      }
    }
    if (svRes?.sets && Array.isArray(svRes.sets)) {
      for (const s of svRes.sets) {
        if (s.id && s.releaseDate) releaseDatesMap[s.id.toLowerCase()] = s.releaseDate;
      }
    }
  } catch (err) {
    console.warn('Could not fetch extra series release dates:', err);
  }

  const syncedSets: SyncedSetItem[] = [];

  for (const raw of rawSets) {
    const idLower = (raw.id || '').toLowerCase();
    const code = KNOWN_ID_TO_CODE[idLower] || raw.id.toUpperCase();
    const namePt = (raw.name || code).trim();
    
    // Resolve release date & year
    const releaseDate = releaseDatesMap[idLower] || raw.releaseDate || '';
    let year = 0;

    if (releaseDate) {
      const parsedYear = new Date(releaseDate).getFullYear();
      if (!isNaN(parsedYear) && parsedYear >= 1996) {
        year = parsedYear;
      }
    }

    if (!year) {
      year = getSetReleaseYear(code, namePt) || 0;
    }

    // Resolve regulation mark
    let mark: string | null = null;
    if (year >= 2020) {
      mark = calculateRegulationMark(year);
    } else {
      mark = getSetRegulationMark(code, namePt);
    }

    syncedSets.push({
      id: raw.id,
      code,
      namePt,
      year,
      mark,
      symbolUrl: raw.symbol || undefined,
      logoUrl: raw.logo || undefined,
      totalCards: raw.cardCount?.total || undefined,
      officialCards: raw.cardCount?.official || undefined,
      releaseDate: releaseDate || undefined,
    });
  }

  return syncedSets;
}

/**
 * Builds metadata payload from synced sets
 */
function buildPayloadFromSets(sets: SyncedSetItem[]): SetsMetadataPayload {
  const setsMap: Record<string, SyncedSetItem> = {};
  const releaseYears: Record<string, number> = {};
  const regulationMarks: Record<string, string> = {};
  const officialNamesPt: Record<string, string> = {};

  for (const item of sets) {
    setsMap[item.code] = item;
    if (item.id) {
      setsMap[item.id.toUpperCase()] = item;
    }

    if (item.year) {
      releaseYears[item.code] = item.year;
      releaseYears[item.id.toUpperCase()] = item.year;
      releaseYears[normalizeSetCode(item.code)] = item.year;
    }

    if (item.mark) {
      regulationMarks[item.code] = item.mark;
      regulationMarks[item.id.toUpperCase()] = item.mark;
      regulationMarks[normalizeSetCode(item.code)] = item.mark;
    }

    if (item.namePt) {
      officialNamesPt[item.code] = item.namePt;
      officialNamesPt[item.id.toUpperCase()] = item.namePt;
      officialNamesPt[normalizeSetCode(item.code)] = item.namePt;
    }
  }

  return {
    lastSyncedAt: new Date().toISOString(),
    totalSets: sets.length,
    sets: setsMap,
    releaseYears,
    regulationMarks,
    officialNamesPt
  };
}

let inMemorySetsList: SyncedSetItem[] = [];

/**
 * Applies a payload to local memory and registers dynamic sets
 */
function applyPayloadToMemory(payload: SetsMetadataPayload) {
  const dynamicEntries: Record<string, { year?: number; mark?: string; namePt?: string }> = {};
  const uniqueItemsMap = new Map<string, SyncedSetItem>();

  for (const [code, item] of Object.entries(payload.sets)) {
    dynamicEntries[code] = {
      year: item.year || payload.releaseYears[code],
      mark: item.mark || payload.regulationMarks[code] || undefined,
      namePt: item.namePt || payload.officialNamesPt[code]
    };

    if (item && item.code) {
      const canonicalKey = item.code.toUpperCase();
      if (!uniqueItemsMap.has(canonicalKey) || (item.symbolUrl && !uniqueItemsMap.get(canonicalKey)?.symbolUrl)) {
        uniqueItemsMap.set(canonicalKey, item);
      }
    }
  }

  inMemorySetsList = Array.from(uniqueItemsMap.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.code.localeCompare(b.code);
  });

  registerDynamicSets(dynamicEntries, payload.lastSyncedAt);
}

/**
 * Returns the complete list of known/synced Pokémon TCG expansions.
 * If not yet synced, builds a baseline list from built-in metadata.
 */
export function getCachedSetsList(): SyncedSetItem[] {
  if (inMemorySetsList.length > 0) {
    return inMemorySetsList;
  }

  // Baseline fallback list from built-in constants
  const fallbackList: SyncedSetItem[] = [];
  const processedCodes = new Set<string>();

  for (const [code, year] of Object.entries(SET_RELEASE_YEARS)) {
    const raw = code.trim().toUpperCase();
    if (processedCodes.has(raw)) continue;
    if (raw.includes('-')) continue;
    if (raw.length === 3 && raw.endsWith('1') && raw !== '151') continue;

    const namePt = SET_OFFICIAL_NAMES_PT[raw] || raw;
    const mark = SET_REGULATION_MARKS[raw] || null;

    fallbackList.push({
      id: raw.toLowerCase(),
      code: raw,
      namePt,
      year,
      mark
    });
    processedCodes.add(raw);
  }

  fallbackList.sort((a, b) => (b.year - a.year) || a.code.localeCompare(b.code));
  inMemorySetsList = fallbackList;
  return fallbackList;
}

/**
 * Full Sync: Fetches latest sets from TCGdex API, saves to Cloud Firestore (settings/sets_metadata),
 * caches in localStorage, and updates in-memory set metadata.
 */
export async function syncSetsToCloudAndLocal(): Promise<{
  success: boolean;
  total: number;
  lastSyncedAt: string;
  savedToFirestore: boolean;
}> {
  const sets = await fetchSetsFromTCGdex();
  const payload = buildPayloadFromSets(sets);

  // 1. Save to LocalStorage for instant access
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not cache sets metadata in localStorage:', e);
  }

  // 2. Apply in live memory
  applyPayloadToMemory(payload);

  // 3. Save to Cloud Firestore
  let savedToFirestore = false;
  try {
    savedToFirestore = await syncSetsMetadataToFirestore(payload);
  } catch (err) {
    console.warn('Could not save sets metadata to Firestore:', err);
  }

  return {
    success: true,
    total: sets.length,
    lastSyncedAt: payload.lastSyncedAt,
    savedToFirestore
  };
}

/**
 * Loads sets metadata on app start:
 * 1. Checks localStorage first (0ms latency)
 * 2. Checks Cloud Firestore settings/sets_metadata in background
 */
export async function loadAndApplySetsMetadata(): Promise<{
  loaded: boolean;
  total: number;
  lastSyncedAt: string | null;
}> {
  let appliedPayload: SetsMetadataPayload | null = null;

  // 1. Try LocalStorage
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed: SetsMetadataPayload = JSON.parse(cached);
      if (parsed && parsed.sets) {
        appliedPayload = parsed;
        applyPayloadToMemory(parsed);
      }
    }
  } catch (err) {
    console.warn('Error reading sets metadata from localStorage:', err);
  }

  // 2. Try Cloud Firestore
  try {
    const cloudData = await loadSetsMetadataFromFirestore();
    if (cloudData && cloudData.sets) {
      const cloudPayload = cloudData as SetsMetadataPayload;
      
      // If cloud has newer or we had no local cache, apply cloud
      if (!appliedPayload || (cloudPayload.lastSyncedAt && (!appliedPayload.lastSyncedAt || cloudPayload.lastSyncedAt > appliedPayload.lastSyncedAt))) {
        appliedPayload = cloudPayload;
        applyPayloadToMemory(cloudPayload);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudPayload));
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('Error loading sets metadata from Firestore:', err);
  }

  return {
    loaded: appliedPayload !== null,
    total: appliedPayload?.totalSets || 0,
    lastSyncedAt: appliedPayload?.lastSyncedAt || null
  };
}
