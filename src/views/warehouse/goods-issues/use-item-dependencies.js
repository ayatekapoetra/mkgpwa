'use client';

import { useEffect, useRef, useState } from 'react';
import axiosServices from 'utils/axios';

const itemKey = (gudangId, barangId) => JSON.stringify([String(gudangId || ''), String(barangId || '')]);

export default function useItemDependencies(gudangId, items, setFieldValue) {
  const [results, setResults] = useState({});
  const requests = useRef(new Map());
  const latest = useRef({ gudangId, items });
  latest.current = { gudangId, items };
  // Qty, remark and SMU changes must not restart dependency requests.
  const selectionKey = JSON.stringify([String(gudangId || ''), items.map((item) => String(item.barang_id || ''))]);

  useEffect(() => () => {
    requests.current.forEach(({ controller }) => controller.abort());
    requests.current.clear();
  }, []);

  useEffect(() => {
    const [warehouse, barangIds] = JSON.parse(selectionKey);
    if (!warehouse) return;
    let active = true;

    for (const barangId of new Set(barangIds.filter(Boolean))) {
      const key = itemKey(warehouse, barangId);
      if (!requests.current.has(key)) {
        const controller = new AbortController();
        const query = new URLSearchParams({ gudang_id: warehouse, barang_id: barangId });
        const entry = { controller };
        entry.promise = Promise.all([
          axiosServices.get(`/warehouse/goods-issues/options/prices?${query}`, { signal: controller.signal }),
          axiosServices.get(`/warehouse/goods-issues/options/source-racks?${query}`, { signal: controller.signal })
        ]).then(([prices, racks]) => ({ prices: prices.data?.data || [], racks: racks.data?.data || [] }))
          .catch((error) => {
            if (requests.current.get(key) === entry) requests.current.delete(key);
            throw error;
          });
        requests.current.set(key, entry);
      }

      requests.current.get(key).promise.then((data) => {
        if (!active) return;
        setResults((prev) => prev[key] === data ? prev : { ...prev, [key]: data });
        // Use current row positions and preserve saved/manually selected values.
        if (String(latest.current.gudangId) !== warehouse) return;
        latest.current.items.forEach((item, index) => {
          if (String(item.barang_id) !== barangId) return;
          if (!item.hargabeli_id && data.prices.length === 1) {
            setFieldValue(`items.${index}.hargabeli_id`, String(data.prices[0].id), false);
          }
          if (!item.rack_id && data.racks.length === 1) {
            setFieldValue(`items.${index}.rack_id`, String(data.racks[0].id), false);
          }
        });
      }).catch(() => {
        if (active) setResults((prev) => ({ ...prev, [key]: { prices: [], racks: [] } }));
      });
    }

    return () => { active = false; };
  }, [selectionKey, setFieldValue]);

  const priceOptions = {};
  const rackOptions = {};
  const loadingDeps = {};
  items.forEach((item, index) => {
    const result = results[itemKey(gudangId, item.barang_id)];
    priceOptions[index] = result?.prices || [];
    rackOptions[index] = result?.racks || [];
    loadingDeps[index] = Boolean(gudangId && item.barang_id && !result);
  });
  return { priceOptions, rackOptions, loadingDeps };
}
