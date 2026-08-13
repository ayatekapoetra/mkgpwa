import { useMemo } from 'react';
import useSWR from 'swr';

import { fetcher } from 'utils/axios';

const endpoint = '/laporan/productivity';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      const ids = value
        .map((item) => (typeof item === 'object' && item !== null ? item.id ?? item.value ?? '' : item))
        .filter((item) => item !== undefined && item !== null && item !== '');

      if (ids.length) searchParams.set(key, ids.join(','));
      return;
    }

    searchParams.set(key, value);
  });

  return searchParams.toString();
};

export const useGetProductivityBase = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/base/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      total: data?.rows?.total || 0,
      page: data?.rows?.page || 1,
      perPage: data?.rows?.perPage || 25,
      lastPage: data?.rows?.lastPage || 1,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityHmkm = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/hmkm/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityStandby = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/standby/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityOpportunity = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/opportunity/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityOperating = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/operating/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityPa = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/pa/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityMa = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/ma/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityUa = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/ua/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityDetail = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/detail/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetProductivityEu = (params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}/metrics/eu/list${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};