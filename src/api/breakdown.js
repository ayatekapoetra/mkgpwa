import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

export const endpoints = {
  key: '/maintenance/daily-breakdown',
  list: '/list',
  show: '/',
  create: '/create',
  update: '/update',
  destroy: '/destroy'
};

export const useGetBreakdownList = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.data || [],
      total: data?.rows?.total || 0,
      page: data?.rows?.page || 1,
      lastPage: data?.rows?.lastPage || 1,
      perPage: data?.rows?.perPage || 25,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.data || [])?.length,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export const useShowBreakdown = (id) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? endpoints.key + `/${id}` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export async function createBreakdown(payload) {
  try {
    const response = await axiosServices.post(endpoints.key + endpoints.create, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateBreakdown(id, payload) {
  try {
    const response = await axiosServices.post(endpoints.key + `/${id}` + endpoints.update, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteBreakdown(id) {
  try {
    const response = await axiosServices.post(endpoints.key + `/${id}` + endpoints.destroy);
    return response.data;
  } catch (error) {
    throw error;
  }
}
