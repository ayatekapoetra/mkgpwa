import useSWR from 'swr';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  list: '/ritase/ore-transport',
  detail: (id) => `/ritase/ore-transport/${id}`,
  create: '/ritase/ore-transport',
  update: (id) => `/ritase/ore-transport/${id}`,
  delete: (id) => `/ritase/ore-transport/${id}`
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

export function useGetOreTransport(params = {}, enabled = true) {
  const isEnabled = enabled && Boolean(params.start_date && params.end_date);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    isEnabled ? `${endpoints.list}${buildQuery(params)}` : null,
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

export async function createOreTransport(body) {
  try {
    const res = await axiosServices.post(endpoints.create, body);
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal menyimpan Ore Transport');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.response?.data?.message || error?.message || 'Gagal menyimpan Ore Transport';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    customError.status = error?.response?.status;
    throw customError;
  }
}

export async function updateOreTransport(id, body) {
  try {
    const res = await axiosServices.put(endpoints.update(id), body);
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal mengubah Ore Transport');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.response?.data?.message || error?.message || 'Gagal mengubah Ore Transport';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    customError.status = error?.response?.status;
    throw customError;
  }
}

export async function deleteOreTransport(id) {
  try {
    const res = await axiosServices.delete(endpoints.delete(id));
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal menghapus Ore Transport');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.response?.data?.message || error?.message || 'Gagal menghapus Ore Transport';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    customError.status = error?.response?.status;
    throw customError;
  }
}
