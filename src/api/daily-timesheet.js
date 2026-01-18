import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

export const endpoints = {
  key: '/operation/timesheet',
  list: '/list',
  show: '/show',
  exportAlatBerat: '/alat-berat/export-excel',
  exportDumptruck: '/dumptruck/export-excel',
  exportAll: '/all/export-excel'
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

export const exportTimesheetHeavyEquipment = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportAlatBerat + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportAlatBerat;
  
  const response = await axiosServices.get(url);
  return response.data;
};

export const exportTimesheetDumptruck = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportDumptruck + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportDumptruck;
  
  const response = await axiosServices.get(url);
  return response.data;
};

export const exportTimesheetAll = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportAll + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportAll;
  
  const response = await axiosServices.get(url);
  return response.data;
};
