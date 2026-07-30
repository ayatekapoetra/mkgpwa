import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/warehouse/transfers',
  optionsBarang: '/warehouse/transfers/options/barang',
  optionsPrices: '/warehouse/transfers/options/prices',
  optionsSourceRacks: '/warehouse/transfers/options/source-racks',
  optionsTargetRacks: '/warehouse/transfers/options/target-racks'
};

export function useGetWarehouseTransfers(params) {
  const key = params ? `${endpoints.key}?${new URLSearchParams(params)}` : endpoints.key;
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useShowWarehouseTransfer(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetWarehouseTransferAudit(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(id ? `${endpoints.key}/${id}/audit` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetWarehouseTransferOption(url, enabled = true) {
  const { data, isLoading, error, isValidating } = useSWR(enabled && url ? url : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );
}
