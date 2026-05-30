import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/operation/crew-worksheet',
  list: '/operation/crew-worksheet/list',
  stats: '/operation/crew-worksheet/stats'
};

const toQueryString = (params = {}) => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const query = new URLSearchParams(cleanParams).toString();
  return query ? `?${query}` : '';
};

const normalizeRows = (rows, params = {}) => {
  if (rows && Array.isArray(rows.data)) {
    return {
      data: rows.data,
      page: Number(rows.page || params.page || 1),
      perPage: Number(rows.perPage || rows.per_page || params.perPages || 25),
      total: Number(rows.total || rows.data.length || 0),
      lastPage: Number(rows.lastPage || rows.last_page || 1)
    };
  }

  const data = Array.isArray(rows) ? rows : [];
  return {
    data,
    page: Number(params.page || 1),
    perPage: Number(params.perPages || 25),
    total: data.length,
    lastPage: 1
  };
};

export const useCrewWorkActivity = (params) => {
  const url = `${endpoints.list}${toQueryString(params)}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(() => {
    const normalized = normalizeRows(data?.rows, params);
    return {
      rows: normalized.data,
      page: normalized.page,
      perPage: normalized.perPage,
      total: normalized.total,
      lastPage: normalized.lastPage,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate, params]);
};

export const useCrewWorkActivityStats = (params) => {
  const { page, perPages, ...filterParams } = params || {};
  const url = `${endpoints.stats}${toQueryString(filterParams)}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      stats: data?.rows || {},
      statsLoading: isLoading,
      statsError: error,
      statsValidating: isValidating,
      statsMutate: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useShowCrewWorkActivity = (id) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      row: data?.rows || {},
      rowLoading: isLoading,
      rowError: error,
      rowValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};
