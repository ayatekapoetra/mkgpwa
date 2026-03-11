import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/operation/activity-plan',
  list: '/list'
};

export const useActivityPlan = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${endpoints.key}${endpoints.list}${qs}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(
    () => {
      // Backend response structure: { diagnostic: { ver: 3.0, error: false }, rows: data }
      const backendData = data?.rows || null;
      
      // Handle Lucid pagination structure: { data: [], total: 0, page: 1, lastPage: 1, perPage: 25 }
      if (backendData && typeof backendData === 'object') {
        return {
          data: {
            data: Array.isArray(backendData.data) ? backendData.data : (Array.isArray(backendData) ? backendData : []),
            total: backendData.total || 0,
            page: backendData.page || 1,
            lastPage: backendData.lastPage || 1,
            perPage: backendData.perPage || 25,
            meta: backendData.meta || {}
          },
          dataLoading: isLoading,
          dataError: error,
          dataValidating: isValidating,
          mutate
        };
      }
      
      return {
        data: {
          data: [],
          total: 0,
          page: 1,
          lastPage: 1,
          perPage: 25,
          meta: {}
        },
        dataLoading: isLoading,
        dataError: error,
        dataValidating: isValidating,
        mutate
      };
    },
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export const useShowActivityPlan = (id) => {
  const url = id ? `${endpoints.key}/${id}` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
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
