import useSWR from 'swr';
import { useMemo } from 'react';
import axiosServices from 'utils/axios';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  public: '/api/public/cabang',
  key: '/api/master/cabang',
  list: '/list'
};

export const useCabang = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.list, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  useOfflineStorage('cabang', 'cabang', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const usePublicCabang = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.public + endpoints.list, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('cabang', 'public-cabang', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetCabang = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      cabang: data || { rows: [] },
      cabangLoading: isLoading,
      cabangError: error,
      cabangValidating: isValidating,
      cabangEmpty: !isLoading && (!data?.rows || data?.rows?.length === 0),
      cabangMutate: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export const useShowCabang = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? endpoints.key + `/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      cabang: data?.rows || null,
      cabangLoading: isLoading,
      cabangError: error,
      cabangValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const createCabang = async (data) => {
  const response = await axiosServices.post(endpoints.key, data);
  return response.data;
};

export const updateCabang = async (id, data) => {
  const response = await axiosServices.put(endpoints.key + `/${id}`, data);
  return response.data;
};

export const deleteCabang = async (id) => {
  const response = await axiosServices.delete(endpoints.key + `/${id}`);
  return response.data;
};
