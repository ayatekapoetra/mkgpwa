import { useMemo } from 'react';
import useSWR from 'swr';

import { fetcher } from 'utils/axios';

export const useGetCustomersDashboardCharts = () => {
  const url = '/customers/dashboard/charts';
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows || null,
      pelangganId: data?.diagnostic?.pelanggan_id || null,
      pelangganNama: data?.diagnostic?.pelanggan_nama || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};
