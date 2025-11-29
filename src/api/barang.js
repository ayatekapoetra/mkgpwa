import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/api/master/barang',
  list: '/list',
  test: 'http://localhost:3003/test/barang/list' // Temporary test endpoint with full URL
};

export const useGetBarang = (params) => {
  const url = params ? `${endpoints.key}/list?${new URLSearchParams(params)}` : `${endpoints.key}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onSuccess: (data) => {
      console.log('Barang API Success:', data);
    },
    onError: (error) => {
      console.log('Barang API Error:', error);
    }
  });

  useOfflineStorage('barang', 'barang', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.data || data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !data?.rows?.data?.length && !data?.rows?.length,
      pagination: {
        page: data?.rows?.page || 1,
        perPage: data?.rows?.perPage || 25,
        lastPage: data?.rows?.lastPage || 1,
        total: data?.rows?.total || 0
      }
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};

export const useShowBarang = (id) => {
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