import useSWR from 'swr';
import { useMemo } from 'react';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/operation/rental-contract',
  access: '/access',
  list: '/list',
  summary: '/summary',
  detail: (id) => `/${id}`,
  audits: (id) => `/${id}/audits`,
  equipment: '/options/equipment'
};

const query = (params = {}) => {
  const values = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
  const result = new URLSearchParams(values).toString();
  return result ? `?${result}` : '';
};

export const getErrorMessage = (error, fallback = 'Terjadi kesalahan pada kontrak rental') =>
  error?.diagnostic?.message || error?.response?.data?.diagnostic?.message || error?.response?.data?.message || error?.message || fallback;

const unwrap = (data) => data?.rows ?? data?.data ?? data;

const normalizeList = (data) => {
  const rows = unwrap(data);
  if (Array.isArray(rows)) return { rows, total: rows.length, page: 1, lastPage: 1, perPage: rows.length || 25 };
  return { rows: rows?.data || [], total: rows?.total || 0, page: rows?.page || 1, lastPage: rows?.lastPage || 1, perPage: rows?.perPage || rows?.limit || 25 };
};

export function useRentalContractAccess() {
  const result = useSWR(`${endpoints.key}${endpoints.access}`, fetcher, { revalidateOnFocus: false });
  const permissions = result.data?.rows?.permissions || result.data?.permissions || result.data?.rows || {};
  return { permissions, accessLoading: result.isLoading, accessError: result.error, mutateAccess: result.mutate };
}

export function useRentalContracts(params) {
  const result = useSWR(`${endpoints.key}${endpoints.list}${query(params)}`, fetcher, { revalidateOnFocus: true });
  const normalized = normalizeList(result.data);
  return { ...normalized, loading: result.isLoading, error: result.error, validating: result.isValidating, mutate: result.mutate };
}

export function useRentalContract(id) {
  const result = useSWR(id ? `${endpoints.key}${endpoints.detail(id)}` : null, fetcher, { revalidateOnFocus: true });
  return { data: unwrap(result.data), loading: result.isLoading, error: result.error, mutate: result.mutate };
}

export function useRentalContractAudits(id) {
  const result = useSWR(id ? `${endpoints.key}${endpoints.audits(id)}` : null, fetcher, { revalidateOnFocus: true });
  const audits = unwrap(result.data);
  return { data: Array.isArray(audits) ? audits : audits?.data || [], loading: result.isLoading, error: result.error };
}

export function useRentalEquipmentOptions(params = { limit: 1000 }) {
  const result = useSWR(`${endpoints.key}${endpoints.equipment}${query(params)}`, fetcher, { revalidateOnFocus: false });
  const options = unwrap(result.data);
  return { data: Array.isArray(options) ? options : options?.data || [], loading: result.isLoading, error: result.error };
}

async function mutate(method, url, payload) {
  try {
    const response = method === 'delete'
      ? await axiosServices.delete(url, { data: payload, skipOfflineQueue: true, skipRetry: true })
      : await axiosServices.post(url, payload, { skipOfflineQueue: true, skipRetry: true });
    if (response.data?.diagnostic?.error) throw new Error(response.data.diagnostic.message || response.data.diagnostic.error);
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export const createRentalContract = (payload) => mutate('post', `${endpoints.key}/create`, payload);
export const updateRentalContract = (id, payload) => mutate('post', `${endpoints.key}/${id}/update`, payload);
export const requestRentalContractApproval = (id) => mutate('post', `${endpoints.key}/${id}/request-approval`, {});
export const approveRentalContract = (id) => mutate('post', `${endpoints.key}/${id}/approve`, {});
export const rejectRentalContract = (id, reason) => mutate('post', `${endpoints.key}/${id}/reject`, { reason });
export const cancelRentalContract = (id, reason) => mutate('post', `${endpoints.key}/${id}/cancel`, { reason });

export const statusLabel = { DRAFT: 'Draft', PENDING_APPROVAL: 'Menunggu Approval', APPROVED: 'Disetujui', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan' };
export const statusColor = { DRAFT: 'default', PENDING_APPROVAL: 'warning', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'default' };

export const useRentalContractSummary = (params) => {
  const result = useRentalContracts(params);
  return useMemo(() => result, [result]);
};

export function useRentalContractStats() {
  const result = useSWR(`${endpoints.key}${endpoints.summary}`, fetcher, { revalidateOnFocus: true });
  const data = result.data?.rows ?? result.data ?? {};
  return {
    totalActive: data.total_active ?? 0,
    totalMain: data.total_main ?? 0,
    totalBackup: data.total_backup ?? 0,
    nearestExpiry: data.nearest_expiry ?? null,
    loading: result.isLoading,
    error: result.error,
    mutate: result.mutate
  };
}
