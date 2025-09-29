import useSWR from 'swr';
import { useMemo } from 'react';
// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/api/laporan/pemakaian-barang',
  list: '/list'
};

export const useGetPemakaianBarang = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && data?.rows?.length <= 0
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
