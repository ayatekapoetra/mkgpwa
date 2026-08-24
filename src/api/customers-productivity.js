import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

const endpoint = '/customers/productivity';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'penyewa_ids') return;

    if (Array.isArray(value)) {
      const ids = value
        .map((item) => (typeof item === 'object' && item !== null ? item.id ?? item.value ?? '' : item))
        .filter((item) => item !== undefined && item !== null && item !== '');

      if (ids.length) searchParams.set(key, ids.join(','));
      return;
    }

    searchParams.set(key, value);
  });

  return searchParams.toString();
};

const useMetric = (path, params) => {
  const query = buildQueryString(params);
  const url = `${endpoint}${path}${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
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
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const useGetCustomersProductivityBase = (params) => useMetric('/base/list', params);
export const useGetCustomersProductivityHmkm = (params) => useMetric('/metrics/hmkm/list', params);
export const useGetCustomersProductivityStandby = (params) => useMetric('/metrics/standby/list', params);
export const useGetCustomersProductivityOpportunity = (params) => useMetric('/metrics/opportunity/list', params);
export const useGetCustomersProductivityOperating = (params) => useMetric('/metrics/operating/list', params);
export const useGetCustomersProductivityPa = (params) => useMetric('/metrics/pa/list', params);
export const useGetCustomersProductivityMa = (params) => useMetric('/metrics/ma/list', params);
export const useGetCustomersProductivityUa = (params) => useMetric('/metrics/ua/list', params);
export const useGetCustomersProductivityEu = (params) => useMetric('/metrics/eu/list', params);
export const useGetCustomersProductivityMttfs = (params) => useMetric('/metrics/mttfs/list', params);
export const useGetCustomersProductivityMttr = (params) => useMetric('/metrics/mttr/list', params);
export const useGetCustomersProductivityMtbs = (params) => useMetric('/metrics/mtbs/list', params);

export const useGetCustomersProductivityDetail = (params) => {
  const safeParams = params || {};
  const query = buildQueryString(safeParams);
  const ready = Boolean(safeParams.type && safeParams.equipment_id && safeParams.startdate && safeParams.enddate);
  const url = ready ? `${endpoint}/detail/list${query ? `?${query}` : ''}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url ? [url, { skipOfflineQueue: true }] : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows || null,
      pelangganId: data?.diagnostic?.pelanggan_id || null,
      pelangganNama: data?.diagnostic?.pelanggan_nama || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

const filenameFromDisposition = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
};

const messageFromBlob = async (blob, fallback) => {
  const text = await blob.text();
  if (!text) return fallback;
  try {
    const payload = JSON.parse(text);
    return payload?.diagnostic?.message || payload?.message || fallback;
  } catch {
    return text;
  }
};

export const downloadCustomersProductivity = async (params, format) => {
  const query = buildQueryString({ ...params, page: undefined, perPage: undefined });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const fallback = `report-productivity-customers-${params.startdate}-to-${params.enddate}.${extension}`;

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
      throw new Error(await messageFromBlob(error.response.data, error.message || 'Gagal mengunduh laporan'));
    }
    throw error;
  }
};
