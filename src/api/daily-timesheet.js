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
  exportAll: '/all/export-excel',
  exportEvaluasi: '/evaluasi/export-excel'
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

  return downloadTimesheetFile(url, 'Timesheet_HE.xlsx');
};

export const exportTimesheetDumptruck = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportDumptruck + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportDumptruck;

  return downloadTimesheetFile(url, 'Timesheet_DT.xlsx');
};

export const exportTimesheetAll = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportAll + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportAll;

  return downloadTimesheetFile(url, 'Timesheet_All.xlsx');
};

export const exportTimesheetEvaluasi = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportEvaluasi + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportEvaluasi;

  return downloadTimesheetFile(url, 'Timesheet_Evaluasi.xlsx');
};

const downloadTimesheetFile = async (url, fallbackFilename) => {
  try {
    const response = await axiosServices.get(url, {
      responseType: 'blob',
      timeout: 300000
    });

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers?.['content-disposition'], fallbackFilename)
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text();

      try {
        const payload = JSON.parse(text);
        const message = payload?.diagnostic?.message || payload?.message || 'Gagal download Excel';
        const nextError = new Error(message);
        nextError.response = { data: payload };
        throw nextError;
      } catch {
        throw new Error(text || error.message || 'Gagal download Excel');
      }
    }

    throw error;
  }
};

const getFilenameFromDisposition = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
};
