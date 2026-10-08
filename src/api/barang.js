import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/master/barang',
  list: '/list',
  test: 'http://localhost:3003/test/barang/list' // Temporary test endpoint with full URL
};

export const useGetBarang = (params) => {
  const query = params
    ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
    : null;
  const queryString = query?.toString();
  const url = queryString ? `${endpoints.key}/list?${queryString}` : `${endpoints.key}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    keepPreviousData: true
  });

  useOfflineStorage('barang', 'barang', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading && !data,
      dataError: error,
      dataEmpty: !isLoading && !data?.rows?.length,
      pagination: {
        page: Number(data?.page) || 1,
        perPage: Number(data?.perPage) || Number(params?.perPages) || 30,
        lastPage: Number(data?.lastPage) || 1,
        total: Number(data?.total) || 0
      }
    }),
    [data, error, isLoading, params?.perPages]
  );

  return memoizedValue;
};

export const useBarangFilterOptions = (enabled = true) => {
  const { data, error, isLoading } = useSWR(enabled ? `${endpoints.key}/options` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return {
    options: data?.rows || {},
    optionsLoading: isLoading,
    optionsError: error
  };
};

export const useShowBarang = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
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

// Temporary test hook without authentication
export const useGetBarangTest = (params) => {
  const url = params ? `${endpoints.test}?${new URLSearchParams(params)}` : endpoints.test;

  const { data, error, isLoading } = useSWR(url, async (url) => {
    console.log('Fetching from URL:', url);
    const response = await fetch(url);
    const result = await response.json();
    console.log('Raw API response:', result);
    return result;
  }, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onSuccess: (data) => {
      console.log('Barang Test API Success:', data);
    },
    onError: (error) => {
      console.log('Barang Test API Error:', error);
    }
  });

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
