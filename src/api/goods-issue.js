'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/warehouse/goods-issues',
  access: '/warehouse/goods-issues/access',
  optionsItems: '/warehouse/goods-issues/options/items',
  optionsSourceRacks: '/warehouse/goods-issues/options/source-racks',
  optionsPrices: '/warehouse/goods-issues/options/prices',
  optionsEquipment: '/warehouse/goods-issues/options/equipment',
  optionsMaterialRequests: '/warehouse/goods-issues/options/material-requests',
  reportPdf: '/warehouse/goods-issues/reports/pdf',
  reportExcel: '/warehouse/goods-issues/reports/excel'
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
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

export function useGetGoodsIssuesAccess() {
  const { data, isLoading, error } = useSWR(endpoints.access, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      permissions: data?.data || null,
      loading: isLoading,
      error
    }),
    [data, error, isLoading]
  );
}

export function useGetGoodsIssues(params) {
  const query = buildQueryString(params);
  const url = query ? `${endpoints.key}?${query}` : endpoints.key;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipOfflineQueue: true }], fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.data || null,
      rows: data?.data?.rows || [],
      summary: data?.data?.summary || null,
      total: data?.data?.total || 0,
      page: data?.data?.page || 1,
      perPage: data?.data?.perPage || 25,
      lastPage: data?.data?.lastPage || 1,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useShowGoodsIssue(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetGoodsIssueAudit(id) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(id ? `${endpoints.key}/${id}/audit` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetGoodsIssueOption(url, enabled = true) {
  const { data, isLoading, error, isValidating } = useSWR(enabled && url ? url : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );
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
    return payload?.message || payload?.diagnostic?.message || fallback;
  } catch {
    return text;
  }
};

export async function downloadGoodsIssuePdf(id) {
  const fallback = `goods-issue-${id}.pdf`;
  try {
    const response = await axiosServices.get(`${endpoints.key}/${id}/pdf`, {
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
      throw new Error(await messageFromBlob(error.response.data, error.message || 'Gagal mengunduh PDF'));
    }
    throw error;
  }
}

export async function downloadGoodsIssueReport(params, format) {
  const query = buildQueryString({ ...params, page: undefined, perPage: undefined });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const fallback = `goods-issues-report.${extension}`;
  const url = format === 'pdf' ? endpoints.reportPdf : endpoints.reportExcel;

  try {
    const response = await axiosServices.get(`${url}${query ? `?${query}` : ''}`, {
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
}

export async function createGoodsIssueDraft(payload) {
  const response = await axiosServices.post(endpoints.key, payload, { skipOfflineQueue: true });
  return response.data;
}

export async function createGoodsIssueFromMaterialRequest(materialRequestId, payload = {}) {
  const response = await axiosServices.post(`${endpoints.key}/from-material-request/${materialRequestId}`, payload, {
    skipOfflineQueue: true
  });
  return response.data;
}

export async function updateGoodsIssueDraft(id, payload) {
  const response = await axiosServices.put(`${endpoints.key}/${id}`, payload, { skipOfflineQueue: true });
  return response.data;
}

export async function postGoodsIssue(id, payload = {}) {
  const response = await axiosServices.post(`${endpoints.key}/${id}/post`, payload, { skipOfflineQueue: true });
  return response.data;
}

export async function voidGoodsIssue(id, payload) {
  const response = await axiosServices.post(`${endpoints.key}/${id}/void`, payload, { skipOfflineQueue: true });
  return response.data;
}

export async function reviseGoodsIssue(id, payload) {
  const response = await axiosServices.post(`${endpoints.key}/${id}/revise`, payload, { skipOfflineQueue: true });
  return response.data;
}