import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/api/master/lokasi-kerja',
  list: '/list',
  public: '/api/public/lokasi-kerja/list'
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
      lokasiKerja: data?.rows || [],
      lokasiKerjaLoading: isLoading,
      lokasiKerjaError: error,
      lokasiKerjaValidating: isValidating,
      lokasiKerjaEmpty: !isLoading && !data?.rows?.length,
      lokasiKerjaMutate: mutate,
      page: data?.page,
      perPage: data?.perPage,
      total: data?.total,
      lastPage: data?.lastPage
    }),
    [data, error, isLoading, isValidating, mutate]
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