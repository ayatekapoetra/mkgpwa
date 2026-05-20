import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  monitoring: '/public/ritase/signage/pit-circle-time-monitoring'
};

export const useGetProduksiPitCircleTimeMonitoring = (params, refreshInterval = 30000) => {
  const url = params ? `${endpoints.monitoring}?${new URLSearchParams(params)}` : endpoints.monitoring;
  const { data, isLoading, error, isValidating } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.rows || null,
      fleets: data?.rows?.fleets || [],
      filters: data?.rows?.filters || null,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );
};
