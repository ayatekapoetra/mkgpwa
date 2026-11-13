import useSWR from 'swr';
import axiosServices, { fetcher } from 'utils/axios';

export const endpoints = {
  preview: '/ritase/import/preview',
  rows: (batch_id) => `/ritase/import/${batch_id}/rows`,
  patchRow: (batch_id, row_no) => `/ritase/import/${batch_id}/rows/${row_no}`,
  bulkPatch: (batch_id) => `/ritase/import/${batch_id}/rows/bulk-patch`,
  commit: (batch_id) => `/ritase/import/${batch_id}/commit`,
  batches: '/ritase/import/batches',
  detail: (batch_id) => `/ritase/import/${batch_id}`
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

export async function uploadImportPreview(formData) {
  try {
    const res = await axiosServices.post(endpoints.preview, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal memproses file import');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.message || 'Gagal upload preview import';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    customError.status = error?.response?.status;
    throw customError;
  }
}

export function useGetImportRows(batchId, params = {}, enabled = true) {
  const isEnabled = enabled && Boolean(batchId);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    isEnabled ? `${endpoints.rows(batchId)}${buildQuery(params)}` : null,
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

export async function patchImportRow(batchId, rowNo, body) {
  try {
    const res = await axiosServices.patch(endpoints.patchRow(batchId, rowNo), body);
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal memperbarui baris');
      err.code = diag.code;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.message || 'Gagal memperbarui baris preview';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    throw customError;
  }
}

export async function bulkPatchImportRows(batchId, body) {
  try {
    const res = await axiosServices.post(endpoints.bulkPatch(batchId), body);
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal melakukan bulk patch');
      err.code = diag.code;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.message || 'Gagal bulk patch baris';
    const customError = new Error(msg);
    customError.code = diag?.code;
    throw customError;
  }
}

export async function commitImportBatch(batchId, body = { confirm_duplicate_file: false }) {
  try {
    const res = await axiosServices.post(endpoints.commit(batchId), body);
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      const err = new Error(diag.message || 'Gagal commit batch import');
      err.code = diag.code;
      err.details = diag.details;
      throw err;
    }
    return res?.data?.rows ?? res?.data;
  } catch (error) {
    const diag = error?.response?.data?.diagnostic || error?.diagnostic;
    const msg = diag?.message || error?.message || 'Gagal commit batch import';
    const customError = new Error(msg);
    customError.code = diag?.code;
    customError.details = diag?.details;
    customError.status = error?.response?.status;
    throw customError;
  }
}

export function useGetImportBatches(params = {}, enabled = true) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? `${endpoints.batches}${buildQuery(params)}` : null,
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
    batches: rows,
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

export function useGetImportBatchDetail(batchId, enabled = true) {
  const isEnabled = enabled && Boolean(batchId);
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? endpoints.detail(batchId) : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    batch: data?.rows ?? data?.data ?? null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}
