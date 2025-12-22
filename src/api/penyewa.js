import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/api/master/penyewa',
  list: '/list',
  public: '/api/public/penyewa/list'
};

export const useGetPenyewa = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      penyewa: Array.isArray(data?.rows) ? data.rows : [],
      penyewaLoading: isLoading,
      penyewaError: error,
      penyewaValidating: isValidating,
      penyewaEmpty: !isLoading && !data?.rows?.length,
      penyewaMutate: mutate,
      page: data?.page || 1,
      perPage: data?.perPage || 25,
      total: data?.total || 0,
      lastPage: data?.lastPage || 1
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export const useShowPenyewa = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? endpoints.key + `/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      penyewa: data?.rows || null,
      penyewaLoading: isLoading,
      penyewaError: error,
      penyewaValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const usePublicPenyewa = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.public, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      penyewa: Array.isArray(data?.rows) ? data.rows : [],
      penyewaLoading: isLoading,
      penyewaError: error,
      penyewaValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const usePenyewa = usePublicPenyewa;
