import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/master/material-ritase',
  list: '/list'
};

export const useMaterialMining = (params) => {
  const url = params
    ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}`
    : `${endpoints.key}${endpoints.list}`;

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

export const useShowMaterial = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      material: data?.rows || null,
      materialLoading: isLoading,
      materialError: error,
      materialValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const updateMaterial = async (id, payload) => {
  const response = await axiosServices.post(`${endpoints.key}/${id}/update`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

export const deleteMaterial = async (id) => {
  const response = await axiosServices.post(`${endpoints.key}/${id}/destroy`, null, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};
