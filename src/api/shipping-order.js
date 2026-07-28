import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/scm/shipping-order',
  list: '/list',
  readyShip: '/ready-ship'
};

export const useGetShippingOrder = (params) => {
  const key = params ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}` : `${endpoints.key}${endpoints.list}`;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && (!data?.rows || data?.rows?.data?.length === 0)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useShowShippingOrder = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetReadyShip = (params, enabled = true) => {
  const key = enabled ? `${endpoints.key}${endpoints.readyShip}?${new URLSearchParams(params)}` : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.data || [],
      deliveryOrderOptions: data?.rows?.deliveryOrderOptions || [],
      page: data?.rows?.page || 1,
      perPage: data?.rows?.perPage || params?.perPage || 12,
      total: data?.rows?.total || 0,
      lastPage: data?.rows?.lastPage || 1,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.data?.length || 0)
    }),
    [data, error, isLoading, isValidating, params?.perPage]
  );

  return memoizedValue;
};
