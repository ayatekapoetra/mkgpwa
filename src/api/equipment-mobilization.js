import useSWR from 'swr';
import { useMemo } from 'react';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/operation/equipment-mobilization',
  list: '/list',
  access: '/access',
  create: '/create'
};

const buildQueryString = (params = {}) => new URLSearchParams(
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') acc[key] = value;
    return acc;
  }, {})
).toString();

const unwrapError = (error, fallback) => {
  const diagnostic = error?.response?.data?.diagnostic;
  if (typeof diagnostic?.message === 'string' && diagnostic.message) return diagnostic.message;
  if (typeof diagnostic?.error === 'string' && diagnostic.error) return diagnostic.error;
  return error?.response?.data?.message || error?.message || fallback;
};

const normalizeListResponse = (data) => {
  const rows = data?.rows;
  if (!rows) {
    return { data: [], total: 0, page: 1, lastPage: 1, perPage: 25 };
  }
  if (Array.isArray(rows)) {
    return { data: rows, total: rows.length, page: 1, lastPage: 1, perPage: rows.length || 25 };
  }
  return {
    data: Array.isArray(rows.data) ? rows.data : [],
    total: rows.total || 0,
    page: rows.page || 1,
    lastPage: rows.lastPage || 1,
    perPage: rows.perPage || rows.limit || 25
  };
};

export function useEquipmentMobilizationAccess() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    `${endpoints.key}${endpoints.access}`,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  return useMemo(() => {
    const payload = data?.rows || {};
    const permissions = payload.permissions || payload || {};
    return {
      permissions: {
        can_read: !!permissions.can_read,
        can_insert: !!permissions.can_insert,
        can_update: !!permissions.can_update,
        can_remove: !!permissions.can_remove,
        can_validate: !!permissions.can_validate,
        can_approve: !!permissions.can_approve,
        can_accept: !!permissions.can_accept
      },
      source: payload.source || null,
      accessLoading: isLoading,
      accessError: error,
      accessValidating: isValidating,
      mutateAccess: mutate
    };
  }, [data, error, isLoading, isValidating, mutate]);
}

export function useGetEquipmentMobilizations(params) {
  const query = buildQueryString(params);
  const qs = query ? `?${query}` : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    `${endpoints.key}${endpoints.list}${qs}`,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return useMemo(() => {
    const normalized = normalizeListResponse(data);
    return {
      data: normalized,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate]);
}

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

export async function downloadEquipmentMobilizations(params = {}, format) {
  const exportFilters = { ...params, page: undefined, limit: undefined };
  const query = buildQueryString(exportFilters);
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const fallback = `mobilisasi-equipment-${new Date().toISOString().slice(0, 10)}.${extension}`;

  try {
    const response = await axiosServices.get(`${endpoints.key}/download/${format}${query ? `?${query}` : ''}`, {
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
      throw new Error(await messageFromBlob(error.response.data, 'Gagal mengunduh laporan mobilisasi'));
    }
    throw new Error(unwrapError(error, 'Gagal mengunduh laporan mobilisasi'));
  }
}

export function useShowEquipmentMobilization(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? `${endpoints.key}/${id}` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false
    }
  );

  return useMemo(
    () => ({
      data: data?.rows || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export async function createEquipmentMobilization(payload) {
  try {
    const response = await axiosServices.post(`${endpoints.key}${endpoints.create}`, payload, {
      skipOfflineQueue: true
    });
    if (response.data?.diagnostic?.error) {
      throw new Error(response.data.diagnostic.message || response.data.diagnostic.error || 'Gagal membuat dokumen');
    }
    return response.data?.rows || null;
  } catch (error) {
    throw new Error(unwrapError(error, 'Gagal membuat dokumen mobilisasi'));
  }
}

export async function dispatchEquipmentMobilizationItem(id, itemId, payload) {
  try {
    const response = await axiosServices.post(
      `${endpoints.key}/${id}/items/${itemId}/dispatch`,
      payload,
      { skipOfflineQueue: true }
    );
    if (response.data?.diagnostic?.error) {
      throw new Error(response.data.diagnostic.message || 'Gagal dispatch');
    }
    return response.data?.rows || null;
  } catch (error) {
    throw new Error(unwrapError(error, 'Gagal mencatat dispatch'));
  }
}

export async function arriveEquipmentMobilizationItem(id, itemId, payload) {
  try {
    const response = await axiosServices.post(
      `${endpoints.key}/${id}/items/${itemId}/arrive`,
      payload,
      { skipOfflineQueue: true }
    );
    if (response.data?.diagnostic?.error) {
      throw new Error(response.data.diagnostic.message || 'Gagal arrival');
    }
    return response.data?.rows || null;
  } catch (error) {
    throw new Error(unwrapError(error, 'Gagal mencatat arrival'));
  }
}

export async function cancelEquipmentMobilizationItem(id, itemId, reason) {
  try {
    const response = await axiosServices.post(
      `${endpoints.key}/${id}/items/${itemId}/cancel`,
      { reason },
      { skipOfflineQueue: true }
    );
    if (response.data?.diagnostic?.error) {
      throw new Error(response.data.diagnostic.message || 'Gagal cancel item');
    }
    return response.data?.rows || null;
  } catch (error) {
    throw new Error(unwrapError(error, 'Gagal membatalkan item'));
  }
}

export async function cancelEquipmentMobilizationDocument(id, reason) {
  try {
    const response = await axiosServices.post(
      `${endpoints.key}/${id}/cancel`,
      { reason },
      { skipOfflineQueue: true }
    );
    if (response.data?.diagnostic?.error) {
      throw new Error(response.data.diagnostic.message || 'Gagal cancel dokumen');
    }
    return response.data?.rows || null;
  } catch (error) {
    throw new Error(unwrapError(error, 'Gagal membatalkan dokumen'));
  }
}

export const MOBILIZATION_STATUS_COLOR = {
  DRAFT: 'default',
  OPEN: 'info',
  IN_TRANSIT: 'warning',
  ARRIVED: 'success',
  CANCELLED: 'error'
};

export const MOBILIZATION_STATUS_LABEL = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  IN_TRANSIT: 'Dalam Pengiriman',
  ARRIVED: 'Tiba',
  CANCELLED: 'Dibatalkan'
};
