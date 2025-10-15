import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/api/operation/timesheet',
  list: '/list',
  show: '/show'
};

/**
 * PARAMS
 * contoh data object
 * { type: 'DT' } atau { type: 'HE' }
 * **/

export const useGetDailyTimesheet = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data?.rows || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data?.rows || data?.rows || data)?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useShowDailyTimesheet = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data || data?.rows || data)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetDTDailyTimesheet = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}` + endpoints.show, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data || data?.rows || data)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetHEDailyTimesheet = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}` + endpoints.show, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data?.rows || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data?.rows || data?.rows || data)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
