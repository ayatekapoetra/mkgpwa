import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const BASE = '/operation/daily-breakdown';

const compactObject = (obj) => {
  const out = {};
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out;
};

export const endpoints = {
  key: BASE,
  list: '/list',
  my: '/my-list',
  today: '/today',
  statistics: '/statistics',
  show: '/',
  create: '/create',
  update: '/update',
  destroy: '/destroy',
  download: '/download'
};

export const useBreakdownList = (params, enabled = true) => {
  const query = new URLSearchParams(compactObject(params)).toString();
  const url = enabled ? `${endpoints.key}${endpoints.list}${query ? `?${query}` : ''}` : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(() => {
    const rows = data?.rows;
    const isPaginator = rows && !Array.isArray(rows);
    return {
      data: isPaginator ? rows?.data || [] : Array.isArray(rows) ? rows : [],
      total: isPaginator ? rows?.total || 0 : Array.isArray(rows) ? rows.length : 0,
      page: isPaginator ? rows?.page || 1 : 1,
      lastPage: isPaginator ? rows?.lastPage || 1 : 1,
      perPage: isPaginator ? rows?.perPage || 25 : 25,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !((isPaginator ? rows?.data : rows) || []).length,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

export const useBreakdownDetail = (id, enabled = true) => {
  const url = id && enabled ? `${endpoints.key}${endpoints.show}${id}` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

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
};

export const useBreakdownStatistics = (params, enabled = true) => {
  const query = new URLSearchParams(compactObject(params)).toString();
  const url = enabled ? `${endpoints.key}${endpoints.statistics}${query ? `?${query}` : ''}` : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

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
};

export async function createDailyBreakdown(payload) {
  const response = await axiosServices.post(`${endpoints.key}${endpoints.create}`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function updateDailyBreakdown(id, payload) {
  const response = await axiosServices.post(`${endpoints.key}/${id}${endpoints.update}`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function deleteDailyBreakdown(id) {
  const response = await axiosServices.post(`${endpoints.key}/${id}${endpoints.destroy}`, {}, { skipOfflineQueue: true });
  return response.data;
}

const parseFilename = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : fallback;
};

export async function downloadBreakdownPdf(params = {}) {
  const query = new URLSearchParams(compactObject(params)).toString();
  const url = `${endpoints.key}${endpoints.download}${query ? `?${query}` : ''}`;
  const response = await axiosServices.get(url, { responseType: 'blob' });
  const fallback = `laporan-breakdown-${params.startdate || ''}-${params.enddate || ''}.pdf`;
  return { blob: response.data, filename: parseFilename(response.headers['content-disposition'], fallback) };
}

export async function getBreakdownMasters() {
  const labels = ['cabangs', 'equipments', 'lokasis', 'penyewas', 'shifts', 'pengawases'];
  const requests = [
    axiosServices.get('/master/cabang/list'),
    axiosServices.get('/master/equipment/produksi'),
    axiosServices.get('/master/lokasi-kerja/list'),
    axiosServices.get('/master/penyewa/list'),
    axiosServices.get('/master/shift/list'),
    axiosServices.get('/master/karyawan/pengawas')
  ];

  const results = await Promise.allSettled(requests);
  const out = {};
  const _failed = [];
  results.forEach((result, index) => {
    const label = labels[index];
    if (result.status === 'fulfilled') {
      out[label] = result.value.data?.rows || result.value.data || [];
    } else {
      out[label] = [];
      _failed.push(label);
    }
  });
  return { ...out, _failed };
}