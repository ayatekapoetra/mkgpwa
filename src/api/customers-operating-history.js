import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

const endpoint = '/customers/operating-history';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'penyewa_ids') return;

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

export const useGetCustomersOperatingHistory = (params) => {
  const query = buildQueryString(params || {});
  const url = params ? `${endpoint}/list${query ? `?${query}` : ''}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url ? [url, { skipOfflineQueue: true }] : null, fetcher, {
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
      pelangganId: data?.diagnostic?.pelanggan_id || null,
      pelangganNama: data?.diagnostic?.pelanggan_nama || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.data || []).length,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

const filenameFromDisposition = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || fallback;
};

export const downloadCustomersOperatingHistory = async (params, format = 'pdf') => {
  const query = buildQueryString({ ...params, page: undefined, perPage: undefined });
  const startdate = params?.startdate || 'start';
  const enddate = params?.enddate || 'end';
  const fallback = `report-operating-history-customers-${startdate}-to-${enddate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

  try {
    const response = await axiosServices.get(`${endpoint}/download/${format}${query ? `?${query}` : ''}`, {
      responseType: 'blob',
      timeout: 300000,
      skipOfflineQueue: true
    });

    return {
      blob: response.data,
      filename: filenameFromDisposition(response.headers?.['content-disposition'], fallback)
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const payload = JSON.parse(text);
        throw new Error(payload?.diagnostic?.message || payload?.message || 'Gagal mengunduh laporan');
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== text) throw parseError;
        throw new Error(text || error.message || 'Gagal mengunduh laporan');
      }
    }
    throw error;
  }
};
