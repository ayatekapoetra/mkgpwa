import useSWR from 'swr';
import { useMemo, useEffect, useState } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { createLocalStore, getCachedData, setCachedData } from 'utils/localStorage';

const kegiatanKerjaStore = createLocalStore('kegiatan-mining');

/**
 * PARAMS
 * contoh data object
 * { type: 'DT' } atau { type: 'HE' }
 * **/
export const endpoints = {
  option: '/public/kegiatan/list',
}

export const useGetKegiatanKerja = (params) => {
  const url = params ? endpoints.option + `?${new URLSearchParams(params)}` : endpoints.option

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  const [localData, setLocalData] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setCachedData(kegiatanKerjaStore, 'kegiatan-kerja', data);
    }
  }, [data]);

  useEffect(() => {
    const checkOffline = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine && !data) {
        setLocalLoading(true);
        const cached = await getCachedData(kegiatanKerjaStore, 'kegiatan-kerja');
        setLocalData(cached);
        setLocalLoading(false);
      }
    };
    checkOffline();
  }, [data]);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || localData?.rows,
      dataLoading: isLoading || localLoading,
      dataError: error,
      dataEmpty: !isLoading && !localLoading && !data?.rows?.length && !localData?.rows?.length
    }),
    [data, error, isLoading, localData, localLoading]
  );

  return memoizedValue;
};
