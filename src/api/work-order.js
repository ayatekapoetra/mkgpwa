import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const BASE = '/operation/work-order';

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
  show: '/show',
  update: '/update',
  addAction: '/actions',
  deleteAction: '/actions'
};

export const useWorkOrderList = (params, enabled = true) => {
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
      perPage: isPaginator ? rows?.perPage || 20 : 20,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !((isPaginator ? rows?.data : rows) || []).length,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

export const useWorkOrderDetail = (id, enabled = true) => {
  const url = id && enabled ? `${endpoints.key}/${id}${endpoints.show}` : null;
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

export async function updateWorkOrder(id, payload) {
  const response = await axiosServices.post(`${endpoints.key}/${id}${endpoints.update}`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function addWorkOrderAction(id, payload) {
  const response = await axiosServices.post(`${endpoints.key}/${id}${endpoints.addAction}`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function updateWorkOrderAction(actionId, payload) {
  const response = await axiosServices.post(`${endpoints.key}${endpoints.deleteAction}/${actionId}/update`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function deleteWorkOrderAction(actionId) {
  const response = await axiosServices.post(`${endpoints.key}${endpoints.deleteAction}/${actionId}/delete`, {}, { skipOfflineQueue: true });
  return response.data;
}

export async function getTeknisiOptions() {
  const response = await axiosServices.get('/master/karyawan');
  const data = response.data?.rows || response.data || [];
  if (!Array.isArray(data)) return [];

  const allowed = ['teknisi', 'mekanik', 'engineer', 'teknikal', 'service', 'services', 'svc', 'maintenance', 'maint', 'teknisi lapangan', 'field technician'];

  const filtered = data.filter((item) => {
    const fields = [
      item.section,
      item.section_name,
      item.jabatan,
      item.jabatan_name,
      item.departemen,
      item.role,
      item.position,
      item.position_name,
      item.usertype
    ]
      .filter(Boolean)
      .map((val) => val.toString().toLowerCase())
      .join(' ');
    return allowed.some((role) => fields.includes(role));
  });

  const listToUse = filtered.length > 0 ? filtered : data.filter((item) => (item.nama || item.name || '').toLowerCase().includes('teknisi') || (item.nama || item.name || '').toLowerCase().includes('mekanik'));

  return listToUse.map((item) => ({
    id: item.id,
    nama: item.nama || item.name || '-',
    subtitle: [item.jabatan || item.section || item.role || '', item.cabang?.nama || ''].filter(Boolean).join(' - ')
  }));
}