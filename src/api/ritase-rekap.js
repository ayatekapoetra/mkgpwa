import { useMemo } from 'react';
import useSWR from 'swr';
import axiosServices, { fetcher } from 'utils/axios';
import { getCachedSession } from 'utils/session-cache';

export const endpoints = {
  list: '/ritase/rekap',
  defaults: '/ritase/rekap/defaults',
  detail: '/ritase/rekap/detail',
  create: '/ritase/rekap',
  access: '/ritase/rekap/access'
};

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useRitaseRekapAccess() {
  const { data, error, isLoading, mutate } = useSWR(endpoints.access, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return useMemo(() => {
    // Normalisasi izin: backend kontrak §2
    // ritase-rekap.view, ritase-rekap.create, ritase-rekap.backdate
    const raw = data?.rows || data?.data || data || {};
    const permissions = {
      can_view: raw['ritase-rekap.view'] ?? raw.can_view ?? true,
      can_create: raw['ritase-rekap.create'] ?? raw.can_create ?? true,
      can_backdate: raw['ritase-rekap.backdate'] ?? raw.can_backdate ?? false
    };

    return {
      permissions,
      loading: isLoading,
      error,
      refresh: mutate
    };
  }, [data, error, isLoading, mutate]);
}

export function useGetRekapRitase(params = {}, enabled = true) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? `${endpoints.list}${buildQuery(params)}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const rowsRaw = data?.rows ?? data?.data ?? [];
  const rows = Array.isArray(rowsRaw)
    ? rowsRaw
    : Array.isArray(rowsRaw?.data)
      ? rowsRaw.data
      : [];
  const meta = data?.meta || rowsRaw?.meta || (data?.total !== undefined ? data : {});

  return {
    rows,
    page: Number(meta.page) || Number(params.page) || 1,
    perPage: Number(meta.perPage || meta.limit) || Number(params.perPage) || 25,
    total: Number(meta.total) || rows.length,
    lastPage: Number(meta.lastPage || meta.total_pages) || 1,
    loading: isLoading,
    validating: isValidating,
    error,
    refresh: mutate
  };
}

export function useGetRekapDefaults(params = {}, enabled = true) {
  const isEnabled = enabled && Boolean(params.date_ops && params.bisnis_id);
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? `${endpoints.defaults}${buildQuery(params)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const defaults = data?.rows ?? data?.data ?? null;

  return {
    defaults,
    distance_km: defaults?.distance_km ?? null,
    distance_source: defaults?.distance_source ?? '',
    truck_factor: defaults?.truck_factor ?? null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

export async function fetchRekapDefaults(params = {}) {
  try {
    const res = await axiosServices.get(`${endpoints.defaults}${buildQuery(params)}`);
    return res?.data?.rows ?? res?.data?.data ?? null;
  } catch (err) {
    const diag = err?.response?.data?.diagnostic || err?.diagnostic;
    const msg = diag?.message || err?.message || 'Gagal memuat default rekap ritase';
    const error = new Error(msg);
    error.code = diag?.code;
    error.diagnostic = diag;
    throw error;
  }
}

export function useGetRekapDetail(params = {}, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled && Object.keys(params).length > 0 ? `${endpoints.detail}${buildQuery(params)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const detail = data?.rows ?? data?.data ?? null;

  return {
    detail,
    header: detail?.header || null,
    items: detail?.items || [],
    loading: isLoading,
    error,
    refresh: mutate
  };
}

export async function createRekapRitase(body) {
  try {
    const res = await axiosServices.post(endpoints.create, body, {
      headers: { 'Content-Type': 'application/json' }
    });
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal menyimpan rekap ritase');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.message || 'Gagal menyimpan rekap ritase';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    customError.status = error?.response?.status;
    throw customError;
  }
}
