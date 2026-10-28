import { useState, useCallback, useRef, useEffect } from 'react';

function resolveDefaults(defaultFilters) {
  return typeof defaultFilters === 'function' ? defaultFilters() : defaultFilters;
}

/**
 * Hook untuk mengelola state filter halaman dengan persistensi sessionStorage (atau custom storage).
 * SSR-safe untuk Next.js 14 App Router.
 *
 * @param {string} storageKey - Key unik, contoh: 'mkg_filter_daily_breakdown'
 * @param {object|function} defaultFilters - Objek nilai default filter atau function factory
 * @param {object} [options] - Opsi konfigurasi (storage: 'session' | 'local')
 * @returns {[object, function, function]} [filters, setFilters, resetFilters]
 */
export function useFilterStorage(storageKey, defaultFilters, options = {}) {
  const defaultFiltersRef = useRef(defaultFilters);
  const storageType = options.storage || 'session';

  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      return storageType === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }, [storageType]);

  useEffect(() => {
    defaultFiltersRef.current = defaultFilters;
  }, [defaultFilters]);

  const [filters, setFiltersState] = useState(() => {
    const defaults = resolveDefaults(defaultFilters);
    if (typeof window === 'undefined') return defaults;
    try {
      const storage = storageType === 'local' ? window.localStorage : window.sessionStorage;
      const stored = storage ? storage.getItem(storageKey) : null;
      if (!stored) return defaults;
      const parsed = JSON.parse(stored);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });

  const setFilters = useCallback(
    (newFilters) => {
      setFiltersState((prev) => {
        const resolved = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
        const storage = getStorage();
        if (storage) {
          try {
            storage.setItem(storageKey, JSON.stringify(resolved));
          } catch (e) {
            console.warn(`[useFilterStorage] Gagal menyimpan ${storageKey}:`, e);
          }
        }
        return resolved;
      });
    },
    [storageKey, getStorage]
  );

  const resetFilters = useCallback(
    (customOverrides) => {
      const storage = getStorage();
      if (storage) {
        try {
          storage.removeItem(storageKey);
        } catch (e) {
          console.warn(`[useFilterStorage] Gagal menghapus ${storageKey}:`, e);
        }
      }
      const currentDefaults = resolveDefaults(defaultFiltersRef.current || defaultFilters);
      setFiltersState(customOverrides ? { ...currentDefaults, ...customOverrides } : currentDefaults);
    },
    [storageKey, defaultFilters, getStorage]
  );

  return [filters, setFilters, resetFilters];
}

export default useFilterStorage;
