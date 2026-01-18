import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/maintenance/signages/list'
};

export const useGetSignages = (params) => {
  const url = params ? endpoints.key + `?${new URLSearchParams(params)}` : endpoints.key;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 31000,
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
