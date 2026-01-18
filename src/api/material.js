import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const useMaterialMining = (params) => {
  const url = params ? `/master/material-ritase/list?${new URLSearchParams(params)}` : `/master/material-ritase/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('material', 'material-mining', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};
