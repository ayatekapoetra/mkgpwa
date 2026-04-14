import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/master/pemasok',
  list: '/list', // server URL
  prepOrder: '/list-prepare-delor'
};

export const useGetPemasok = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const { data, isLoading, error, isValidating, mutate } = useSWR(endpoints.key + endpoints.list + qs, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('pemasok', 'pemasok', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.length || 0),
      page: data?.page || 1,
      perPage: data?.perPage || params?.perPages || 25,
      total: data?.total || 0,
      lastPage: data?.lastPage || 1,
      dataMutate: mutate
    }),
    [data, error, isLoading, isValidating, mutate, params?.perPages]
  );

  return memoizedValue;
};

export const useShowPemasok = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      pemasok: data?.rows || null,
      pemasokLoading: isLoading,
      pemasokError: error,
      pemasokValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetPemasokDelor = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.prepOrder, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('pemasok', 'pemasok-delor', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.map((m) => ({ ...m, label: m?.nama })),
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
