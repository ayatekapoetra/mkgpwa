import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/api/master/lokasi-kerja',
  list: '/list'
};

export const useGetLokasiKerja = (params) => {
  const url = params ? `${endpoints.key}/list?${new URLSearchParams(params)}` : `${endpoints.key}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('lokasi-kerja', 'lokasi-kerja', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !data?.rows?.length
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};

export const useShowLokasiKerja = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(`${endpoints.key}/${id}/show`, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || {},
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};