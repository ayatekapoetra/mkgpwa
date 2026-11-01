import { useState, useCallback, useRef, useEffect } from 'react';

function resolveDefaults(defaultFilters) {
  return typeof defaultFilters === 'function' ? defaultFilters() : defaultFilters;
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function withoutPagination(filters) {
  const stored = { ...filters };
  delete stored.page;
  delete stored.offset;
  return stored;
}

/**
 * Tab-scoped filter persistence. Never reads legacy localStorage values.
 * Pagination is transient except for Breakdown's approved BD-001 contract.
 */
export function useFilterStorage(storageKey, defaultFilters, options = {}) {
  const defaultFiltersRef = useRef(defaultFilters);
  const preservePagination = options.preservePagination === true;
  useEffect(() => {
    defaultFiltersRef.current = defaultFilters;
  }, [defaultFilters]);

  const [filters, setFiltersState] = useState(() => {
    const defaults = resolveDefaults(defaultFilters);
    try {
      const stored = getStorage()?.getItem(storageKey);
      if (!stored) return defaults;
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
      return { ...defaults, ...(preservePagination ? parsed : withoutPagination(parsed)) };
    } catch {
      return defaults;
    }
  });

  const setFilters = useCallback((newFilters) => {
    setFiltersState((prev) => {
      const resolved = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      // A mount-time/no-op sync must not recreate a key removed by Reset.
      if (resolved === prev || JSON.stringify(resolved) === JSON.stringify(prev)) return prev;
      try {
        getStorage()?.setItem(storageKey, JSON.stringify(preservePagination ? resolved : withoutPagination(resolved)));
      } catch (e) {
        console.warn(`[useFilterStorage] Gagal menyimpan ${storageKey}:`, e);
      }
      return resolved;
    });
  }, [storageKey, preservePagination]);

  const resetFilters = useCallback((customOverrides) => {
    try {
      getStorage()?.removeItem(storageKey);
    } catch (e) {
      console.warn(`[useFilterStorage] Gagal menghapus ${storageKey}:`, e);
    }
    const defaults = resolveDefaults(defaultFiltersRef.current);
    setFiltersState(customOverrides ? { ...defaults, ...customOverrides, page: 1 } : defaults);
  }, [storageKey]);

  return [filters, setFilters, resetFilters];
}

export default useFilterStorage;
