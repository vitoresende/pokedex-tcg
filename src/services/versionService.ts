import localVersionData from '../version.json';

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  buildTime: string;
  env?: string;
}

export const CURRENT_VERSION_INFO: AppVersionInfo = localVersionData;

/**
 * Checks with the hosting server (cache-busted) whether a newer version or build was deployed.
 */
export async function checkForAppUpdate(): Promise<{
  hasUpdate: boolean;
  remoteInfo: AppVersionInfo | null;
  error?: string;
}> {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) {
      return { hasUpdate: false, remoteInfo: null, error: `HTTP ${res.status}` };
    }

    const remoteInfo: AppVersionInfo = await res.json();

    const isNewerVersion = remoteInfo.version !== CURRENT_VERSION_INFO.version;
    const isNewerBuild = remoteInfo.buildNumber > CURRENT_VERSION_INFO.buildNumber;
    const isNewerDate = new Date(remoteInfo.buildTime).getTime() > new Date(CURRENT_VERSION_INFO.buildTime).getTime();

    const hasUpdate = isNewerVersion || isNewerBuild || isNewerDate;

    return {
      hasUpdate,
      remoteInfo,
    };
  } catch (err: any) {
    return {
      hasUpdate: false,
      remoteInfo: null,
      error: err?.message || 'Falha ao verificar atualização',
    };
  }
}

/**
 * Thoroughly purges all client-side PWA caches, unregisters Service Workers,
 * and hard reloads the application to download the freshest HTML and bundles.
 */
export async function forceAppUpdateAndClearCache(): Promise<void> {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    // 2. Delete all caches in CacheStorage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // 3. Clear localStorage version marker & sessionStorage
    try {
      localStorage.removeItem('pokedex_installed_version');
      sessionStorage.clear();
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('[versionService] Cache clearing warning:', err);
  }

  // 4. Force browser hard navigation with cache-buster parameter using replace() to bypass bfcache
  const target = new URL(window.location.origin + window.location.pathname);
  target.searchParams.set('v_flush', String(Date.now()));
  window.location.replace(target.toString());
}
