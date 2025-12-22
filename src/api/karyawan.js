import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  key: '/api/master/karyawan/list',
  section: '/api/master/karyawan/section',
  oprdrv: '/api/master/karyawan/oprdrv',
  assigner: '/api/master/karyawan/assigner'
};

export const useGetKaryawan = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('karyawan', 'karyawan', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetOprDrv = (params) => {
  const url = params ? endpoints.oprdrv + `?${new URLSearchParams(params)}` : endpoints.oprdrv;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('karyawan', 'oprdrv', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetKaryawanSection = (params) => {
  const url = params ? endpoints.section + `?${new URLSearchParams(params)}` : endpoints.key;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  useOfflineStorage('karyawan', 'karyawan-section', data);

  const memoizedValue = useMemo(
    () => ({
      data: Array.isArray(data?.rows) ? data.rows : [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetAssigner = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.assigner, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useOfflineStorage('karyawan', 'assigner', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
