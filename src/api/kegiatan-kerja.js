import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/master/kegiatan-kerja',
  list: '/list',
  public: '/public/kegiatan/list'
};

export const useGetKegiatanKerja = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      kegiatanKerja: data || { rows: [], page: 1, perPage: 25, total: 0, lastPage: 1 },
      kegiatanKerjaLoading: isLoading,
      kegiatanKerjaError: error,
      kegiatanKerjaValidating: isValidating,
      kegiatanKerjaEmpty: !isLoading && (!data?.rows || data?.rows?.length === 0),
      kegiatanKerjaMutate: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export const useShowKegiatanKerja = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? endpoints.key + `/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      kegiatanKerja: data?.rows || null,
      kegiatanKerjaLoading: isLoading,
      kegiatanKerjaError: error,
      kegiatanKerjaValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const usePublicKegiatanKerja = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.public, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      kegiatanKerja: data?.rows || [],
      kegiatanKerjaLoading: isLoading,
      kegiatanKerjaError: error,
      kegiatanKerjaValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useKegiatanKerja = usePublicKegiatanKerja;
