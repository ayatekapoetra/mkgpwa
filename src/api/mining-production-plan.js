import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const endpoints = {
  key: '/mining-plan'
};

export const useGetMiningProductionPlan = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${endpoints.key}?${query}` : endpoints.key;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows || [],
      page: data?.page || Number(params.page || 1),
      perPage: data?.perPage || Number(params.perPage || params.per_page || 25),
      total: data?.total || 0,
      lastPage: data?.lastPage || 1,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.length || 0),
      mutate
    }),
    [data, error, isLoading, isValidating, mutate, params.page, params.perPage, params.per_page]
  );
};

export const useShowMiningProductionPlan = (id) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      row: data?.rows || null,
      rowLoading: isLoading,
      rowError: error,
      rowValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const createMiningProductionPlan = async (payload) => {
  const res = await axiosServices.post(endpoints.key, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export const updateMiningProductionPlan = async (id, payload) => {
  const res = await axiosServices.post(`${endpoints.key}/${id}`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export const deleteMiningProductionPlan = async (id) => {
  const res = await axiosServices.delete(`${endpoints.key}/${id}`);
  return res.data;
};

export const reactivateMiningProductionPlan = async (id) => {
  const res = await axiosServices.post(`${endpoints.key}/${id}/reactivate`, null, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};
