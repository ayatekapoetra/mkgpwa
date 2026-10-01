'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/warehouse/racks'
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, value);
  });
  return searchParams.toString();
};

export function useGetRacks(params) {
  const query = buildQueryString(params);
  const url = query ? `${endpoints.key}?${query}` : endpoints.key;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.data || null,
      rows: data?.data?.rows || [],
      total: data?.data?.total || 0,
      page: data?.data?.page || 1,
      perPage: data?.data?.perPage || 25,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export async function updateRackCycleTime(id, payload) {
  const response = await axiosServices.put(`${endpoints.key}/${id}/cycle-time`, payload, { skipOfflineQueue: true });
  return response.data;
}
