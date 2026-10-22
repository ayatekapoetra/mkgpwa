const MIGRATION_KEY = 'legacy-pwa-cleanup:v1';
let cleanupPromise = null;

const isLegacyPwaKey = (key) => ['workbox', 'pwa', 'sw-', 'next-pwa', 'precache'].some((prefix) => key.includes(prefix));

export function cleanupLegacyPwa() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    try {
      if (sessionStorage.getItem(MIGRATION_KEY)) return;
    } catch { /* Storage may be unavailable in private browsing. */ }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const names = await window.caches.keys();
      await Promise.all(names.filter(isLegacyPwaKey).map((name) => window.caches.delete(name)));
    }
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && isLegacyPwaKey(key)) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch { /* Do not block the application when localStorage is unavailable. */ }
    try {
      sessionStorage.setItem(MIGRATION_KEY, 'done');
    } catch { /* The module promise still prevents repeated work. */ }
  })().catch((error) => {
    cleanupPromise = null;
    throw error;
  });
  return cleanupPromise;
}
