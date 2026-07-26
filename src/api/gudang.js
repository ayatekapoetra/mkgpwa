import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/master/gudang',
  list: '/list'
};

export const useGetGudang = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.list, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.length || 0)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
