import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      const mapped = value
        .map((item) => {
          if (typeof item !== 'object' || item === null) return item;
          return item.id ?? item.value ?? item.label ?? '';
        })
        .filter((item) => item !== undefined && item !== null && item !== '');

      if (mapped.length > 0) searchParams.set(key, mapped.join(','));
      return;
    }

    searchParams.set(key, value);
  });

  return searchParams.toString();
};

const endpointFor = (detail = false) => `/laporan/${detail ? 'operating-history-detail' : 'operating-history'}`;

const useGetHistory = (params, detail) => {
  const query = buildQueryString(params || {});
  const endpoint = endpointFor(detail);
  const url = params ? `${endpoint}/list${query ? `?${query}` : ''}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
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
      dataEmpty: !isLoading && !(data?.rows?.data || []).length,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetOperatingHistory = (params) => useGetHistory(params, false);

export const useGetOperatingHistoryDetail = (params) => useGetHistory(params, true);

const filenameFromDisposition = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || fallback;
};

const downloadReport = async (params, { detail, format }) => {
  const endpoint = endpointFor(detail);
  const query = buildQueryString({ ...params, page: undefined, perPage: undefined });
  const startdate = params?.startdate || 'start';
  const enddate = params?.enddate || 'end';
  const detailSuffix = detail ? '-detail' : '';
  const fallback = `report-operating-history${detailSuffix}-${startdate}-to-${enddate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

  try {
    const response = await axiosServices.get(`${endpoint}/download/${format}${query ? `?${query}` : ''}`, {
      responseType: 'blob',
      timeout: 300000
    });

    return {
      blob: response.data,
      filename: filenameFromDisposition(response.headers?.['content-disposition'], fallback)
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      let payload;

      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(text || error.message || 'Gagal mengunduh laporan');
      }

      throw new Error(payload?.diagnostic?.message || payload?.message || 'Gagal mengunduh laporan');
    }

    throw error;
  }
};

export const downloadOperatingHistory = (params, format = 'pdf') => downloadReport(params, { detail: false, format });

export const downloadOperatingHistoryDetail = (params, format = 'pdf') => downloadReport(params, { detail: true, format });
