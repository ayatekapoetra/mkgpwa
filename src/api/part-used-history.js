'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

export const partUsedHistoryEndpoint = '/laporan/equipment-partused-history';

const valueId = (value) => (typeof value === 'object' && value !== null ? value.id ?? value.value ?? '' : value);

export const buildPartUsedHistoryQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      const values = value.map(valueId).filter((item) => item !== undefined && item !== null && item !== '');
      if (values.length) query.set(key, values.join(','));
      return;
    }
    query.set(key, String(value));
  });

  return query.toString();
};

const swrOptions = {
  keepPreviousData: true,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: true
};

export function usePartUsedHistoryAccess() {
  const { data, isLoading, error, mutate } = useSWR(
    [`${partUsedHistoryEndpoint}/access`, { skipOfflineQueue: true }],
    fetcher,
    swrOptions
  );

  return {
    canRead: Boolean(data?.rows?.can_read),
    loading: isLoading,
    error,
    retry: mutate
  };
}

export function usePartUsedHistory(params, enabled = true) {
  const valid = enabled && Boolean(params?.date_from && params?.date_to);
  const query = buildPartUsedHistoryQuery(params);
  const url = valid ? `${partUsedHistoryEndpoint}/list${query ? `?${query}` : ''}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url ? [url, { skipOfflineQueue: true }] : null,
    fetcher,
    swrOptions
  );
  const rows = data?.rows;

  return useMemo(
    () => ({
      data: rows?.data || [],
      total: Number(rows?.total || 0),
      page: Number(rows?.page || params?.page || 1),
      perPage: Number(rows?.perPage || params?.perPage || 25),
      lastPage: Math.max(1, Number(rows?.lastPage || 1)),
      summary: rows?.summary || { total_records: 0, total_extended_price: 0 },
      initialLoading: isLoading && !data,
      refreshing: isValidating && Boolean(data),
      error,
      retry: mutate
    }),
    [data, error, isLoading, isValidating, mutate, params?.page, params?.perPage, rows]
  );
}

export function usePartUsedHistoryDetail(open, transactionId) {
  const url = open && transactionId ? `${partUsedHistoryEndpoint}/transactions/${encodeURIComponent(transactionId)}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url ? [url, { skipOfflineQueue: true }] : null,
    fetcher,
    { ...swrOptions, keepPreviousData: false }
  );

  return {
    data: data?.rows || null,
    loading: isLoading,
    refreshing: isValidating && Boolean(data),
    error,
    retry: mutate
  };
}

const optionRows = (payload) => {
  const value = payload?.rows?.data ?? payload?.rows ?? payload?.data?.rows ?? payload?.data ?? [];
  return Array.isArray(value) ? value : [];
};

export function usePartUsedHistoryOptions(type, enabled, params = {}) {
  const query = buildPartUsedHistoryQuery(params);
  const url = enabled ? `${partUsedHistoryEndpoint}/options/${type}${query ? `?${query}` : ''}` : null;
  const { data, isLoading, error } = useSWR(url ? [url, { skipOfflineQueue: true }] : null, fetcher, {
    ...swrOptions,
    keepPreviousData: true
  });

  return { options: optionRows(data), loading: isLoading, error };
}

const safeFilename = (filename, fallback) => {
  const cleaned = String(filename || '')
    .replace(/[\\/\u0000-\u001f\u007f]/g, '-')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 180);
  return cleaned || fallback;
};

const filenameFromDisposition = (disposition, fallback) => {
  if (!disposition) return fallback;
  const utf = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const ascii = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = utf || ascii;
  if (utf) {
    try {
      filename = decodeURIComponent(utf);
    } catch {
      filename = utf;
    }
  }
  return safeFilename(filename, fallback);
};

const errorFromBlob = async (blob, fallback) => {
  const text = await blob.text();
  if (!text) return fallback;
  try {
    const payload = JSON.parse(text);
    return payload?.diagnostic?.message || payload?.message || fallback;
  } catch {
    return text.slice(0, 300) || fallback;
  }
};

export async function downloadPartUsedHistory(params, format) {
  const query = buildPartUsedHistoryQuery({ ...params, page: undefined, perPage: undefined });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const fallback = `part-used-history-${params.date_from}-to-${params.date_to}.${extension}`;

  try {
    const response = await axiosServices.get(`${partUsedHistoryEndpoint}/download/${format}${query ? `?${query}` : ''}`, {
      responseType: 'blob',
      timeout: 300000,
      skipOfflineQueue: true
    });
    const contentType = String(response.headers?.['content-type'] || response.data?.type || '').toLowerCase();
    if (contentType.includes('json')) throw new Error(await errorFromBlob(response.data, 'Gagal mengunduh laporan'));

    return {
      blob: response.data,
      filename: filenameFromDisposition(response.headers?.['content-disposition'], fallback)
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      throw new Error(await errorFromBlob(error.response.data, error.message || 'Gagal mengunduh laporan'));
    }
    throw error;
  }
}
