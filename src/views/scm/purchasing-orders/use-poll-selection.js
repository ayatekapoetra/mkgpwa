'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { emptyPollSelection, pollStorageKey, readPollSelection, selectPollRows, selectionSignature } from './polling';

const CHANGE_EVENT = 'purchase-order-poll-selection-changed';

export default function usePollSelection() {
  const { data: session, status } = useSession();
  const key = status === 'authenticated' && session?.id != null ? pollStorageKey(session.id) : null;
  const [state, setState] = useState({ key: null, data: emptyPollSelection(), error: '' });

  useEffect(() => {
    if (!key) return;
    const reload = () => {
      try {
        setState({ key, data: readPollSelection(window.localStorage, key), error: '' });
      } catch {
        setState({ key, data: emptyPollSelection(), error: 'Pilihan PO tidak dapat dibaca dari localStorage. Periksa izin penyimpanan atau gunakan Reset.' });
      }
    };
    const onStorage = (event) => {
      if (event.key === null || event.key === key) reload();
    };
    const onChange = (event) => { if (event.detail === key) reload(); };
    reload();
    window.addEventListener('storage', onStorage);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, [key]);

  const ready = Boolean(key && state.key === key);
  const commit = useCallback((transform, reset = false) => {
    if (!key || state.key !== key) return false;
    try {
      const data = reset ? emptyPollSelection() : transform(readPollSelection(window.localStorage, key));
      if (reset) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(data));
      setState({ key, data, error: '' });
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
      return true;
    } catch (error) {
      setState((current) => ({ ...current, error: error?.message || 'Pilihan PO gagal disimpan.' }));
      return false;
    }
  }, [key, state.key]);

  const selectRows = useCallback((rows, checked) => commit((data) => selectPollRows(data, rows, checked)), [commit]);
  const savePhones = useCallback((phones) => commit((data) => ({ ...data, ...phones })), [commit]);
  const savePrepared = useCallback((prepared, phones, expectedSelection) => commit((data) => {
    if (selectionSignature(data.items) !== expectedSelection) throw new Error('Pilihan PO berubah. Periksa preview lalu coba lagi.');
    return { ...data, ...phones, prepared };
  }), [commit]);
  const reset = useCallback(() => commit(null, true), [commit]);

  return {
    key,
    ready,
    data: ready ? state.data : emptyPollSelection(),
    error: ready ? state.error : '',
    selectRows,
    savePhones,
    savePrepared,
    reset
  };
}
