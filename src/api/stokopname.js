'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/warehouse/stokopnames',
  access: '/warehouse/stokopnames/access',
  optionsItems: '/warehouse/stokopnames/options/items',
  optionsRacks: '/warehouse/stokopnames/options/racks',
  optionsUsers: '/warehouse/stokopnames/options/users'
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, value);
  });
  return searchParams.toString();
};

export function useGetStokopnameAccess() {
  const { data, isLoading, error } = useSWR(endpoints.access, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      permissions: data?.data || null,
      loading: isLoading,
      error
    }),
    [data, error, isLoading]
  );
}

export function useGetStokopnames(params) {
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
      summary: data?.data?.summary || null,
      total: data?.data?.total || 0,
      page: data?.data?.page || 1,
      perPage: data?.data?.perPage || 25,
      lastPage: data?.data?.lastPage || 1,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useShowStokopname(id) {
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

export function useGetStokopnameRekap(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? `${endpoints.key}/${id}/rekap` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false
    }
  );

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

export function useGetStokopnameAudit(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? `${endpoints.key}/${id}/audit` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

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

export async function createStokopnameDraft(payload) {
  const response = await axiosServices.post(endpoints.key, payload, { skipOfflineQueue: true });
  return response.data;
}

export async function updateStokopnameDraft(id, payload) {
  const response = await axiosServices.put(`${endpoints.key}/${id}`, payload, { skipOfflineQueue: true });
  return response.data;
}

export async function requestApprovalStokopname(id) {
  const response = await axiosServices.post(`${endpoints.key}/${id}/request-approval`, {}, { skipOfflineQueue: true });
  return response.data;
}

export async function approveStokopname(id) {
  const response = await axiosServices.post(`${endpoints.key}/${id}/approve`, {}, { skipOfflineQueue: true });
  return response.data;
}

export async function closeStokopname(id) {
  const response = await axiosServices.post(`${endpoints.key}/${id}/close`, {}, { skipOfflineQueue: true });
  return response.data;
}
