import { useState, useCallback, useRef, useEffect } from 'react';

function resolveDefaults(defaultFilters) {
  return typeof defaultFilters === 'function' ? defaultFilters() : defaultFilters;
}

/**
 * Hook untuk mengelola state filter halaman dengan persistensi localStorage.
 * SSR-safe untuk Next.js 14 App Router.
 *
 * @param {string} storageKey - Key unik, contoh: 'mkg_filter_scm_po'
 * @param {object|function} defaultFilters - Objek nilai default filter atau function factory
 * @returns {[object, function, function]} [filters, setFilters, resetFilters]
 */
export function useFilterStorage(storageKey, defaultFilters) {
  const defaultFiltersRef = useRef(defaultFilters);
  useEffect(() => {
    defaultFiltersRef.current = defaultFilters;
  }, [defaultFilters]);

  const [filters, setFiltersState] = useState(() => {
    const defaults = resolveDefaults(defaultFilters);
    if (typeof window === 'undefined') return defaults;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaults;
      const parsed = JSON.parse(stored);
      // Merge dengan defaults agar field baru di masa depan tidak undefined
      return { ...defaults, ...parsed, page: 1 };
    } catch {
      return defaults;
    }
  });

  const setFilters = useCallback((newFilters) => {
    setFiltersState((prev) => {
      const resolved = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      if (typeof window !== 'undefined') {
        try {
          // Selalu reset page ke 1 saat filter berubah
          const toStore = { ...resolved };
          delete toStore.page;
          localStorage.setItem(storageKey, JSON.stringify(toStore));
        } catch (e) {
          console.warn(`[useFilterStorage] Gagal menyimpan ${storageKey}:`, e);
        }
      }
      return resolved;
    });
  }, [storageKey]);

  const resetFilters = useCallback((customOverrides) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn(`[useFilterStorage] Gagal menghapus ${storageKey}:`, e);
      }
    }
    const currentDefaults = resolveDefaults(defaultFiltersRef.current || defaultFilters);
    setFiltersState(customOverrides ? { ...currentDefaults, ...customOverrides, page: 1 } : currentDefaults);
  }, [storageKey, defaultFilters]);

  return [filters, setFilters, resetFilters];
}

export default useFilterStorage;
