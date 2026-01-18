import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/master/mitra-bisnis',
  list: '/list' // server URL
};

export const useMitraBisnis = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.list, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
