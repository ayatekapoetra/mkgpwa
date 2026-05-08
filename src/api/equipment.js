import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/master/equipment',
  list: '/list'
};

export const useGetEquipment = (params) => {
  const url = params ? `${endpoints.key}/list?${new URLSearchParams(params)}` : `${endpoints.key}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('equipment', 'equipment', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !(data?.rows?.data || []).length,
      page: data?.rows?.page || 1,
      perPage: data?.rows?.perPage || params?.perPages || 25,
      total: data?.rows?.total ?? (data?.rows?.data || []).length ?? 0,
      lastPage: data?.rows?.lastPage || 1
    }),
    [data, error, isLoading, params?.perPages]
  );

  return memoizedValue;
};

export const useShowEquipment = (id) => {
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
