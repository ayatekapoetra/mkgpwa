import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

export const dailyActivityEndpoints = {
  list: '/operation/daily-activity/items',
  access: '/operation/daily-activity/access',
  detail: (id) => `/operation/daily-activity/by-header/${id}`,
  download: (format) => `/operation/daily-activity/download/${format}`,
  create: '/operation/daily-activity-bulk',
  update: (id, status) => `/operation/daily-activity/${id}/status/${status}/update`,
  destroy: (id) => `/operation/daily-activity/${id}/destroy`
};

const onlineConfig = { skipOfflineQueue: true };

const compactParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const getPayload = (response) => response?.rows ?? response?.data ?? response ?? {};

const asBoolean = (value) => value === true || value === 1 || value === '1' || String(value).toUpperCase() === 'Y';

export function useDailyActivityAccess() {
  const { data, error, isLoading } = useSWR([dailyActivityEndpoints.access, onlineConfig], fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(() => {
    const payload = getPayload(data);
    const permissions = payload?.permissions || payload?.access || payload;
    return {
      permissions: {
        read: asBoolean(permissions?.read ?? permissions?.can_read),
        insert: asBoolean(permissions?.insert ?? permissions?.can_insert),
        update: asBoolean(permissions?.update ?? permissions?.can_update),
        remove: asBoolean(permissions?.remove ?? permissions?.can_remove)
      },
      accessLoading: isLoading,
      accessError: error
    };
  }, [data, error, isLoading]);
}

export function useDailyActivities(params = {}, enabled = true) {
  const query = new URLSearchParams(compactParams(params)).toString();
  const url = enabled ? `${dailyActivityEndpoints.list}${query ? `?${query}` : ''}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url ? [url, onlineConfig] : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  return useMemo(() => {
    const payload = getPayload(data);
    const page = payload?.data && !Array.isArray(payload) ? payload : null;
    const rows = Array.isArray(page?.data) ? page.data : Array.isArray(payload) ? payload : [];
    return {
      data: {
        data: rows,
        total: page?.total ?? rows.length,
        page: page?.page ?? 1,
        perPage: page?.perPage ?? page?.per_page ?? params.perPage ?? 25,
        lastPage: page?.lastPage ?? page?.last_page ?? 1
      },
      dataLoading: isLoading,
      dataValidating: isValidating,
      dataError: error,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate, params.perPage]);
}

export function useDailyActivity(id, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    id && enabled ? [dailyActivityEndpoints.detail(id), onlineConfig] : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );
  return { data: getPayload(data), dataLoading: isLoading, dataError: error, mutate };
}

export async function createDailyActivity(payload) {
  const response = await axiosServices.post(dailyActivityEndpoints.create, payload, onlineConfig);
  return getPayload(response.data);
}

export async function updateDailyActivityStatus(id, status, header, items) {
  const response = await axiosServices.post(dailyActivityEndpoints.update(id, status), { ...header, items }, onlineConfig);
  return getPayload(response.data);
}

export async function deleteDailyActivity(id) {
  const response = await axiosServices.post(dailyActivityEndpoints.destroy(id), null, onlineConfig);
  return getPayload(response.data);
}

const filenameFromDisposition = (value, fallback) => {
  const match = value?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
};

export async function downloadDailyActivities(params = {}, format = 'pdf') {
  const extension = format === 'excel' ? 'xlsx' : 'pdf';
  try {
    const response = await axiosServices.get(dailyActivityEndpoints.download(format), {
      ...onlineConfig,
      params: compactParams(params),
      responseType: 'blob',
      timeout: 300000
    });
    return {
      blob: response.data,
      filename: filenameFromDisposition(
        response.headers?.['content-disposition'],
        `daily-activity-detail-${new Date().toISOString().slice(0, 10)}.${extension}`
      )
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const payload = JSON.parse(text);
        throw new Error(payload?.message || 'Gagal mengunduh Daily Activity.');
      } catch (parseError) {
        if (parseError instanceof SyntaxError) throw new Error(text || 'Gagal mengunduh Daily Activity.');
        throw parseError;
      }
    }
    throw error;
  }
}

export async function getDailyActivityMasters() {
  const requests = [
    ['/public/penyewa/list', 'sites'],
    ['/master/lokasi-kerja/list', 'pits'],
    ['/public/equipment/list', 'equipments'],
    ['/master/karyawan/oprdrv', 'operators'],
    ['/master/karyawan/pengawas', 'supervisors'],
    ['/public/kegiatan/list', 'activities'],
    ['/master/material-ritase/list', 'materials'],
    ['/master/bisnis-unit/list', 'contractors']
  ];
  const responses = await Promise.all(requests.map(([url]) => axiosServices.get(url, onlineConfig)));
  return responses.reduce((result, response, index) => {
    const value = getPayload(response.data);
    result[requests[index][1]] = Array.isArray(value?.data) ? value.data : Array.isArray(value) ? value : [];
    return result;
  }, {});
}
