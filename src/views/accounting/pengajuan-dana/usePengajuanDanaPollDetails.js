'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPengajuanDanaForPoll } from 'api/pengajuan-dana';

export default function usePengajuanDanaPollDetails(selectionOrIds = [], enabled = true) {
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  let rawIds = [];
  if (Array.isArray(selectionOrIds)) {
    rawIds = selectionOrIds;
  } else if (selectionOrIds?.data?.items) {
    rawIds = selectionOrIds.data.items.map((i) => i.id);
  } else if (selectionOrIds?.selectedIds) {
    rawIds = selectionOrIds.selectedIds;
  }

  const numericIds = rawIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);

  const idsKey = numericIds.join(',');

  useEffect(() => {
    if (!enabled || numericIds.length === 0) {
      setData([]);
      setErrors({});
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled(numericIds.map((id) => getPengajuanDanaForPoll(id)))
      .then((results) => {
        if (!isMounted) return;
        const nextData = [];
        const nextErrors = {};

        results.forEach((res, index) => {
          const id = numericIds[index];
          if (res.status === 'fulfilled') {
            nextData.push(res.value);
          } else {
            nextErrors[id] = res.reason?.message || 'Gagal memuat detail Pengajuan Dana.';
          }
        });

        setData(nextData);
        setErrors(nextErrors);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idsKey, enabled, reloadKey]);

  return {
    data,
    rows: data,
    errors,
    loading: isLoading,
    isLoading,
    reload,
    mutate: reload
  };
}

export const usePollDetails = usePengajuanDanaPollDetails;
