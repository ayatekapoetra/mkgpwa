'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

export const monitoringSparepartStockEndpoint = '/laporan/monitoring-sparepart-stock';

export const buildMonitoringSparepartStockQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
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

export function useMonitoringSparepartStockAccess() {
  const { data, isLoading, error, mutate } = useSWR(
    [`${monitoringSparepartStockEndpoint}/access`, { skipOfflineQueue: true }],
    fetcher,
    swrOptions
  );
  return { canRead: Boolean(data?.rows?.can_read), loading: isLoading, error, retry: mutate };
}

export function useMonitoringSparepartStock(params, enabled) {
  const query = buildMonitoringSparepartStockQuery({
    bisnis_id: params.bisnis_id,
    gudang_id: params.gudang_id,
    rack_id: params.rack_id,
    kode: params.kode,
    numpart: params.numpart,
    nama: params.nama,
    stock_used_zero: params.stock_used_zero,
    page: params.page,
    perPage: params.perPage
  });
  const url = enabled ? `${monitoringSparepartStockEndpoint}/list${query ? `?${query}` : ''}` : null;
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
      page: Number(rows?.page || params.page || 1),
      perPage: Number(rows?.perPage || params.perPage || 25),
      lastPage: Math.max(1, Number(rows?.lastPage || 1)),
      generatedAt: rows?.generated_at || null,
      summary: rows?.summary || {},
      initialLoading: isLoading && !data,
      refreshing: isValidating && Boolean(data),
      error,
      retry: mutate
    }),
    [data, error, isLoading, isValidating, mutate, params.page, params.perPage, rows]
  );
}

export function useMonitoringSparepartStockOptions(type, enabled, params = {}) {
  const query = buildMonitoringSparepartStockQuery(params);
  const url = enabled ? `${monitoringSparepartStockEndpoint}/options/${type}${query ? `?${query}` : ''}` : null;
  const { data, isLoading, error } = useSWR(url ? [url, { skipOfflineQueue: true }] : null, fetcher, swrOptions);
  return { options: Array.isArray(data?.rows?.data) ? data.rows.data : [], loading: isLoading, error };
}

export function useMonitoringSparepartStockMovements(context, params) {
  const query = buildMonitoringSparepartStockQuery({
    bisnis_id: context?.business_id,
    gudang_id: context?.warehouse_id,
    rack_id: context?.rack_id,
    barang_id: context?.item_id,
    ...params
  });
  const enabled = Boolean(context?.warehouse_id && context?.rack_id && context?.item_id);
  const url = enabled ? `${monitoringSparepartStockEndpoint}/movements?${query}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url ? [url, { skipOfflineQueue: true }] : null,
    fetcher,
    { ...swrOptions, keepPreviousData: false }
  );
  const rows = data?.rows;
  return {
    data: rows?.data || [],
    total: Number(rows?.total || 0),
    page: Number(rows?.page || params.page || 1),
    perPage: Number(rows?.perPage || params.perPage || 25),
    lastPage: Math.max(1, Number(rows?.lastPage || 1)),
    loading: isLoading,
    refreshing: isValidating && Boolean(data),
    error,
    retry: mutate
  };
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
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = encoded || plain;
  if (encoded) {
    try {
      filename = decodeURIComponent(encoded);
    } catch {
      filename = encoded;
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

export async function downloadMonitoringSparepartStock(params, format) {
  const query = buildMonitoringSparepartStockQuery({ ...params, page: undefined, perPage: undefined });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const fallback = `monitoring-sparepart-stock.${extension}`;
  try {
    const response = await axiosServices.get(
      `${monitoringSparepartStockEndpoint}/download/${format}${query ? `?${query}` : ''}`,
      { responseType: 'blob', timeout: 300000, skipOfflineQueue: true }
    );
    const contentType = String(response.headers?.['content-type'] || response.data?.type || '').toLowerCase();
    if (contentType.includes('json')) throw new Error(await errorFromBlob(response.data, 'Gagal mengunduh laporan'));
    return { blob: response.data, filename: filenameFromDisposition(response.headers?.['content-disposition'], fallback) };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      throw new Error(await errorFromBlob(error.response.data, error.message || 'Gagal mengunduh laporan'));
    }
    throw error;
  }
}
