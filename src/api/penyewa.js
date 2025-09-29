import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const useGetPenyewa = (params) => {
  const url = params ? `/api/master/penyewa/list?${new URLSearchParams(params)}` : `/api/master/penyewa/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('penyewa', 'penyewa', data);

  return useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && data?.data?.length === 0
    }),
    [data, isLoading, error]
  );
};
