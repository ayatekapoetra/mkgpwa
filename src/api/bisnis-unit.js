import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

export const endpoints = {
  key: '/api/master/bisnis-unit',
  list: '/list'
};

export const useGetBisnisUnit = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      bisnisUnit: data?.rows || [],
      bisnisUnitLoading: isLoading,
      bisnisUnitError: error,
      bisnisUnitValidating: isValidating,
      bisnisUnitEmpty: !isLoading && !data?.rows?.length,
      bisnisUnitMutate: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

export const useShowBisnisUnit = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? endpoints.key + `/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      bisnisUnit: data?.rows || null,
      bisnisUnitLoading: isLoading,
      bisnisUnitError: error,
      bisnisUnitValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const createBisnisUnit = async (data) => {
  const response = await axiosServices.post(endpoints.key, data);
  return response.data;
};

export const updateBisnisUnit = async (id, data) => {
  const response = await axiosServices.put(endpoints.key + `/${id}`, data);
  return response.data;
};

export const deleteBisnisUnit = async (id) => {
  const response = await axiosServices.delete(endpoints.key + `/${id}`);
  return response.data;
};
