import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/setting/options',
  list: '/list' // server URL
};

export const useSysOptions = (params) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.list + '?group=' + params, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('sysoptions', `sysoptions-${params}`, data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
