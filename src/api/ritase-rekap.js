import { useMemo } from 'react';
import useSWR from 'swr';
import axiosServices, { fetcher } from 'utils/axios';
import { getCachedSession } from 'utils/session-cache';

export const endpoints = {
  list: '/ritase/rekap',
  defaults: '/ritase/rekap/defaults',
  detail: '/ritase/rekap/detail',
  create: '/ritase/rekap',
  createBulk: '/ritase/rekap/bulk',
  update: '/ritase/rekap/update',
  access: '/ritase/rekap/access',
  pull: '/ritase/rekap/pull',
  pullPreview: '/ritase/rekap/pull/preview',
  validate: (groupKey) => `/ritase/rekap/${encodeURIComponent(groupKey)}/validate`,
  revert: (groupKey) => `/ritase/rekap/${encodeURIComponent(groupKey)}/revert`
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

export function buildGroupKey(rowOrParams = {}) {
  if (typeof rowOrParams === 'string') return rowOrParams;
  if (rowOrParams?.group_key) return String(rowOrParams.group_key);
  const arr = [
    rowOrParams.date_ops ? String(rowOrParams.date_ops) : null,
    rowOrParams.shift_id != null && rowOrParams.shift_id !== '' ? Number(rowOrParams.shift_id) : null,
    rowOrParams.bisnis_id != null && rowOrParams.bisnis_id !== '' ? Number(rowOrParams.bisnis_id) : null,
    rowOrParams.penyewa_id != null && rowOrParams.penyewa_id !== '' ? Number(rowOrParams.penyewa_id) : null,
    rowOrParams.excavator_id != null && rowOrParams.excavator_id !== '' ? Number(rowOrParams.excavator_id) : null,
    rowOrParams.startpit_id != null && rowOrParams.startpit_id !== '' ? Number(rowOrParams.startpit_id) : null,
    rowOrParams.material_id != null && rowOrParams.material_id !== '' ? Number(rowOrParams.material_id) : null
  ];
  try {
    const jsonStr = JSON.stringify(arr);
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return window.btoa(jsonStr);
    }
    return Buffer.from(jsonStr).toString('base64');
  } catch (_) {
    return arr.join(':');
  }
}

export function useRitaseRekapAccess() {
  const { data, error, isLoading, mutate } = useSWR(endpoints.access, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return useMemo(() => {
    // Normalisasi izin: backend kontrak §2 & PRD BR-12
    // ritase-rekap.view, ritase-rekap.create, ritase-rekap.update, ritase-rekap.backdate
    const raw = data?.rows || data?.data || data || {};
    const permissions = {
      can_view: raw['ritase-rekap.view'] ?? raw.can_view ?? true,
      can_create: raw['ritase-rekap.create'] ?? raw.can_create ?? true,
      can_update: raw['ritase-rekap.update'] ?? raw.can_update ?? raw['ritase-rekap.create'] ?? true,
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
    hourly: detail?.hourly || [],
    doms: detail?.doms || [],
    diagnostic: detail?.diagnostic || null,
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

/**
 * Simpan N baris dump truck sekaligus secara ATOMIK.
 * Backend membungkus semua baris dalam satu transaksi: semua berhasil
 * atau tidak ada yang tersimpan.
 */
export async function createRekapRitaseBulk(items) {
  try {
    const res = await axiosServices.post(
      endpoints.createBulk,
      { items },
      { headers: { 'Content-Type': 'application/json' } }
    );
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
    const err = new Error(msg);
    err.code = diag?.code || error?.code;
    err.details = diag?.details;
    throw err;
  }
}

/**
 * Ganti seluruh isi satu grup rekap (tanggal + shift + excavator + PIT +
 * material). Backend menghapus baris grup lama lalu menulis ulang semuanya
 * dalam satu transaksi.
 */
export async function updateRekapRitaseGroup(group, items) {
  try {
    const res = await axiosServices.post(
      endpoints.update,
      { group, items },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal memperbarui rekap ritase');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.message || 'Gagal memperbarui rekap ritase';
    const err = new Error(msg);
    err.code = diag?.code || error?.code;
    err.details = diag?.details;
    throw err;
  }
}

/**
 * Preview data checker sebelum Tarik Data
 * GET /api/ritase/rekap/pull/preview?date_ops=&shift_id=
 */
export async function fetchPullPreview(params = {}) {
  try {
    const res = await axiosServices.get(`${endpoints.pullPreview}${buildQuery(params)}`);
    return res?.data?.rows ?? res?.data?.data ?? res?.data ?? null;
  } catch (err) {
    const diag = err?.response?.data?.diagnostic || err?.diagnostic;
    const msg = diag?.message || err?.message || 'Gagal memeriksa preview data';
    const error = new Error(msg);
    error.code = diag?.code || err?.response?.data?.code;
    error.isTimeout = err?.isTimeout || false;
    throw error;
  }
}

/**
 * Tarik Data checker menjadi draft rekap
 * POST /api/ritase/rekap/pull
 * body: { date_ops, shift_id }
 */
export async function pullRekapRitase({ date_ops, shift_id }) {
  try {
    const res = await axiosServices.post(
      endpoints.pull,
      { date_ops, shift_id: Number(shift_id) },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal menarik data rekap');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data ?? {};
  } catch (error) {
    const resData = error?.response?.data;
    const diag = resData?.diagnostic || error?.diagnostic;
    const code = diag?.code || resData?.code || error?.code;
    let msg = diag?.message || resData?.message || error?.message || 'Gagal menarik data rekap';
    if (code === 'DATE_LOCKED') {
      msg = 'Tanggal melebihi batas 90 hari';
    } else if (code === 'SHIFT_REQUIRED') {
      msg = 'Shift wajib dipilih';
    }
    const customError = new Error(msg);
    customError.code = code;
    customError.status = error?.response?.status;
    customError.details = diag?.details || resData?.details;
    customError.isTimeout = error?.isTimeout || false;
    throw customError;
  }
}

/**
 * Validasi grup draft rekap
 * POST /api/ritase/rekap/:group_key/validate
 */
export async function validateRekapGroup(groupKey) {
  try {
    const key = typeof groupKey === 'object' && groupKey !== null ? buildGroupKey(groupKey) : String(groupKey);
    const url = typeof endpoints.validate === 'function' ? endpoints.validate(key) : `/ritase/rekap/${encodeURIComponent(key)}/validate`;
    const res = await axiosServices.post(url, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal memvalidasi rekap ritase');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data ?? {};
  } catch (error) {
    const resData = error?.response?.data;
    const diag = resData?.diagnostic || error?.diagnostic;
    const code = diag?.code || resData?.code || error?.code;
    const msg = diag?.message || resData?.message || error?.message || 'Gagal memvalidasi rekap ritase';
    const customError = new Error(msg);
    customError.code = code;
    customError.status = error?.response?.status;
    customError.incomplete_rows = resData?.incomplete_rows || resData?.rows || diag?.incomplete_rows || diag?.details || [];
    customError.details = diag?.details || resData?.details;
    customError.isTimeout = error?.isTimeout || false;
    throw customError;
  }
}

/**
 * Batalkan validasi grup rekap (kembalikan ke draft)
 * POST /api/ritase/rekap/:group_key/revert
 * body: { reason }
 */
export async function revertRekapGroup(groupKey, reason) {
  if (!reason || !String(reason).trim()) {
    const err = new Error('Alasan pembatalan validasi wajib diisi');
    err.code = 'REASON_REQUIRED';
    err.status = 422;
    throw err;
  }
  try {
    const key = typeof groupKey === 'object' && groupKey !== null ? buildGroupKey(groupKey) : String(groupKey);
    const url = typeof endpoints.revert === 'function' ? endpoints.revert(key) : `/ritase/rekap/${encodeURIComponent(key)}/revert`;
    const res = await axiosServices.post(url, { reason: String(reason).trim() }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal membatalkan validasi rekap');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data ?? {};
  } catch (error) {
    const resData = error?.response?.data;
    const diag = resData?.diagnostic || error?.diagnostic;
    const code = diag?.code || resData?.code || error?.code;
    const msg = diag?.message || resData?.message || error?.message || 'Gagal membatalkan validasi rekap';
    const customError = new Error(msg);
    customError.code = code;
    customError.status = error?.response?.status;
    customError.details = diag?.details || resData?.details;
    customError.isTimeout = error?.isTimeout || false;
    throw customError;
  }
}
