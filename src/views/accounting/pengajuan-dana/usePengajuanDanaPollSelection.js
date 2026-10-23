'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  STORAGE_KEY,
  emptyPollSelection,
  normalizePollSelection,
  readPollSelection,
  selectPollRows,
  selectionSignature,
  validPengajuanDanaId
} from './polling';

const CHANGE_EVENT = 'mkg-pengajuan-dana-poll-selection-changed';

export { STORAGE_KEY };
export const pollStorageKey = () => STORAGE_KEY;

export const readStoredPollSelection = (key = STORAGE_KEY) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key || STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => /^[1-9]\d*$/.test(String(id))).map((id) => Number(id));
    }
    if (parsed && Array.isArray(parsed.items)) {
      return parsed.items.filter((item) => validPengajuanDanaId(item?.id)).map((item) => Number(item.id));
    }
    return [];
  } catch (_) {
    return [];
  }
};

export const writeStoredPollSelection = (keyOrIds, maybeIds) => {
  const key = typeof keyOrIds === 'string' ? keyOrIds : STORAGE_KEY;
  const ids = Array.isArray(keyOrIds) ? keyOrIds : (Array.isArray(maybeIds) ? maybeIds : []);
  if (typeof window === 'undefined') return;
  try {
    const normalized = Array.from(new Set(ids))
      .filter((id) => /^[1-9]\d*$/.test(String(id)))
      .map((id) => Number(id));
    if (normalized.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    const current = readPollSelection(window.localStorage, key);
    const updated = {
      ...current,
      items: normalized.map((id) => {
        const existing = current.items.find((it) => String(it.id) === String(id));
        return existing || { id: String(id), kode: String(id) };
      })
    };
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch (_) {}
};

export default function usePengajuanDanaPollSelection() {
  const { data: session } = useSession();
  const key = STORAGE_KEY;
  const [state, setState] = useState(() => ({ key, data: emptyPollSelection(), error: '' }));
  const [ready, setReady] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    try {
      const data = readPollSelection(window.localStorage, key);
      setState({ key, data, error: '' });
    } catch (err) {
      setState({ key, data: emptyPollSelection(), error: err?.message || 'Gagal memuat pilihan Pengajuan Dana.' });
    } finally {
      setReady(true);
    }
  }, [key]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setState({ key, data: normalizePollSelection(JSON.parse(event.newValue)), error: '' });
        } catch (_) {}
      }
    };
    const onCustom = (event) => {
      if (event.detail === key) {
        try {
          setState({ key, data: readPollSelection(window.localStorage, key), error: '' });
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHANGE_EVENT, onCustom);
    };
  }, [key]);

  const commit = useCallback((transform, reset = false) => {
    try {
      const current = reset ? emptyPollSelection() : transform(readPollSelection(window.localStorage, key));
      if (reset) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(current));
      }
      setState({ key, data: current, error: '' });
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
      return true;
    } catch (err) {
      setState((prev) => ({ ...prev, error: err?.message || 'Pilihan Pengajuan Dana gagal disimpan.' }));
      return false;
    }
  }, [key]);

  const selectRows = useCallback((rows, checked) => {
    return commit((data) => selectPollRows(data, rows, checked));
  }, [commit]);

  const isSelected = useCallback((id) => {
    if (!validPengajuanDanaId(id)) return false;
    const strId = String(id);
    return state.data.items.some((item) => String(item.id) === strId);
  }, [state.data.items]);

  const toggleSelect = useCallback((id, kode) => {
    if (!validPengajuanDanaId(id)) return;
    const strId = String(id);
    commit((data) => {
      const exists = data.items.some((item) => String(item.id) === strId);
      const items = exists
        ? data.items.filter((item) => String(item.id) !== strId)
        : [...data.items, { id: strId, kode: String(kode || strId) }];
      return { ...data, items };
    });
  }, [commit]);

  const selectAll = useCallback((itemsOrIds) => {
    if (!Array.isArray(itemsOrIds)) return;
    const rows = itemsOrIds.map((item) => {
      if (typeof item === 'object' && item !== null) return item;
      return { id: item, kode: String(item) };
    });
    selectRows(rows, true);
  }, [selectRows]);

  const deselectAll = useCallback((itemsOrIds) => {
    if (!Array.isArray(itemsOrIds)) return;
    const rows = itemsOrIds.map((item) => {
      if (typeof item === 'object' && item !== null) return item;
      return { id: item, kode: String(item) };
    });
    selectRows(rows, false);
  }, [selectRows]);

  const clearSelection = useCallback(() => {
    commit(null, true);
  }, [commit]);

  const reset = useCallback(() => {
    return commit(null, true);
  }, [commit]);

  const savePhones = useCallback((phones) => {
    return commit((data) => ({ ...data, ...phones }));
  }, [commit]);

  const savePrepared = useCallback((prepared, phones, expectedSelection) => {
    return commit((data) => {
      if (selectionSignature(data.items) !== expectedSelection) {
        throw new Error('Pilihan Pengajuan Dana berubah. Periksa preview lalu coba lagi.');
      }
      return { ...data, ...phones, prepared };
    });
  }, [commit]);

  const toggleSelectingMode = useCallback(() => {
    setIsSelecting((prev) => !prev);
  }, []);

  const selectedIds = useMemo(() => {
    return state.data.items.map((item) => Number(item.id)).filter((id) => Number.isFinite(id) && id > 0);
  }, [state.data.items]);

  const count = state.data.items.length;

  return {
    key,
    ready,
    hydrated: ready,
    data: ready ? state.data : emptyPollSelection(),
    error: ready ? state.error : '',
    selectedIds,
    count,
    isSelecting,
    setIsSelecting,
    toggleSelectingMode,
    isSelected,
    toggleSelect,
    selectRows,
    selectAll,
    deselectAll,
    clearSelection,
    reset,
    savePhones,
    savePrepared
  };
}

export const usePollSelection = usePengajuanDanaPollSelection;
