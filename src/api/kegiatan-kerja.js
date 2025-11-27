import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/api/master/kegiatan-kerja',
  list: '/list',
  public: '/api/public/kegiatan/list'
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
      kegiatanKerja: data?.rows || [],
      kegiatanKerjaLoading: isLoading,
      kegiatanKerjaError: error,
      kegiatanKerjaValidating: isValidating,
      kegiatanKerjaEmpty: !isLoading && !data?.rows?.length,
      kegiatanKerjaMutate: mutate,
      page: data?.page,
      perPage: data?.perPage,
      total: data?.total,
      lastPage: data?.lastPage
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
