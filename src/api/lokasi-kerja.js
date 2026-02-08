import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/master/lokasi-kerja',
  list: '/list',
  public: '/public/lokasi-kerja/list'
};

export const useGetLokasiKerja = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      lokasiKerja: Array.isArray(data?.rows) ? data.rows : [],
      lokasiKerjaLoading: isLoading,
      lokasiKerjaError: error,
      lokasiKerjaValidating: isValidating,
      lokasiKerjaEmpty: !isLoading && (!data?.rows || data?.rows?.length === 0),
      lokasiKerjaMutate: mutate,
      page: data?.page || 1,
      perPage: data?.perPage || params?.perPages || 25,
      total: data?.total ?? data?.rows?.length ?? 0,
      lastPage: data?.lastPage || 1
    }),
    [data, error, isLoading, isValidating, mutate, params?.perPages]
  );

  return memoizedValue;
};

export const useShowLokasiKerja = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? endpoints.key + `/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      lokasiKerja: data?.rows || null,
      lokasiKerjaLoading: isLoading,
      lokasiKerjaError: error,
      lokasiKerjaValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const usePublicLokasiKerja = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.public, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      lokasiKerja: data?.rows || [],
      lokasiKerjaLoading: isLoading,
      lokasiKerjaError: error,
      lokasiKerjaValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useLokasiKerja = usePublicLokasiKerja;
