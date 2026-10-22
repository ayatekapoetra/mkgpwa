'use client';

import { useEffect, useState } from 'react';
import { getPurchaseOrderForPoll } from 'api/purchase-orders';
import { loadSelectedPollOrders, selectionSignature } from './polling';

export default function usePollDetails(selection, enabled) {
  const ids = selectionSignature(selection.data.items);
  const key = enabled && selection.ready ? JSON.stringify([selection.key, ids]) : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, rows: [], errors: {}, loading: false });

  useEffect(() => {
    if (!key) return;
    const [, serializedIds] = JSON.parse(key);
    const controller = new AbortController();
    setState({ key, rows: [], errors: {}, loading: true });
    loadSelectedPollOrders(JSON.parse(serializedIds), getPurchaseOrderForPoll, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setState({ key, ...result, loading: false });
      });
    return () => controller.abort();
  }, [key, attempt]);

  return {
    key,
    rows: key && state.key === key ? state.rows : [],
    errors: key && state.key === key ? state.errors : {},
    loading: Boolean(key && (state.key !== key || state.loading)),
    reload: () => setAttempt((value) => value + 1)
  };
}
