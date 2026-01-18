import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/master/dom',
  list: '/list'
};

export const useDom = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  useOfflineStorage('dom', 'dom', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useShowDom = (id) => {
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
