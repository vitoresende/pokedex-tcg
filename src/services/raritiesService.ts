import { CardRarityInfo } from '../types';
import defaultRarities from '../data/rarities.json';
import { syncRaritiesMetadataToFirestore, loadRaritiesMetadataFromFirestore } from './firebase';

const STORAGE_KEY = 'pokedex_tcg_rarities_metadata';

export interface RaritiesMetadataPayload {
  lastSyncedAt: string;
  totalRarities: number;
  rarities: CardRarityInfo[];
}

let inMemoryRaritiesList: CardRarityInfo[] | null = null;

/**
 * Helper to ensure new baseline rarities are always included even if older cache exists
 */
function mergeWithBaseline(list: CardRarityInfo[]): CardRarityInfo[] {
  const defaults = defaultRarities as CardRarityInfo[];
  const existingIds = new Set(list.map((r) => r.id));
  const missing = defaults.filter((d) => !existingIds.has(d.id));
  if (missing.length === 0) return list;
  return [...list, ...missing];
}

/**
 * Returns the active list of rarities from memory, localStorage, or fallback baseline JSON
 */
export function getCachedRaritiesList(): CardRarityInfo[] {
  if (inMemoryRaritiesList && inMemoryRaritiesList.length > 0) {
    return inMemoryRaritiesList;
  }

  // Try LocalStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: RaritiesMetadataPayload = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rarities) && parsed.rarities.length > 0) {
        inMemoryRaritiesList = mergeWithBaseline(parsed.rarities);
        return inMemoryRaritiesList;
      }
    }
  } catch (err) {
    console.warn('Could not parse rarities metadata from localStorage:', err);
  }

  // Fallback to baseline
  inMemoryRaritiesList = defaultRarities as CardRarityInfo[];
  return inMemoryRaritiesList;
}

/**
 * Full Sync: Saves rarities metadata to Cloud Firestore (settings/rarities_metadata),
 * caches in localStorage, and updates in-memory cache.
 */
export async function syncRaritiesToCloudAndLocal(customRarities?: CardRarityInfo[]): Promise<{
  success: boolean;
  total: number;
  lastSyncedAt: string;
  savedToFirestore: boolean;
}> {
  const raritiesToSave = customRarities && customRarities.length > 0 
    ? customRarities 
    : (defaultRarities as CardRarityInfo[]);

  const payload: RaritiesMetadataPayload = {
    lastSyncedAt: new Date().toISOString(),
    totalRarities: raritiesToSave.length,
    rarities: raritiesToSave
  };

  // 1. Save in live memory
  inMemoryRaritiesList = raritiesToSave;

  // 2. Save in localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not cache rarities metadata in localStorage:', e);
  }

  // 3. Save to Cloud Firestore
  let savedToFirestore = false;
  try {
    savedToFirestore = await syncRaritiesMetadataToFirestore(payload);
  } catch (err) {
    console.warn('Could not save rarities metadata to Firestore:', err);
  }

  return {
    success: true,
    total: raritiesToSave.length,
    lastSyncedAt: payload.lastSyncedAt,
    savedToFirestore
  };
}

/**
 * Loads metadata from Firestore or LocalStorage on app startup
 */
export async function loadAndApplyRaritiesMetadata(): Promise<CardRarityInfo[]> {
  try {
    const cloudData = await loadRaritiesMetadataFromFirestore();
    if (cloudData && Array.isArray(cloudData.rarities) && cloudData.rarities.length > 0) {
      inMemoryRaritiesList = mergeWithBaseline(cloudData.rarities);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...cloudData,
          rarities: inMemoryRaritiesList,
          totalRarities: inMemoryRaritiesList.length
        }));
      } catch (e) {
        // ignore
      }
      return inMemoryRaritiesList!;
    }
  } catch (e) {
    console.warn('Could not load rarities from Firestore, checking localStorage:', e);
  }

  return getCachedRaritiesList();
}
