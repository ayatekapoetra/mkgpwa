import { useMemo } from "react";
import useSWR from "swr";

import axiosServices, { fetcher } from "utils/axios";

export const endpoints = {
  key: "/scm/order-payments",
  access: "/scm/order-payments/access",
  summary: "/scm/order-payments/summary",
  cashAccounts: "/scm/order-payments/cash-accounts",
  wallets: "/scm/order-payments/wallets",
  outstanding: "/scm/order-payments/outstanding",
  detail: (id) => `/scm/order-payments/${id}`,
  post: (id) => `/scm/order-payments/${id}/post`,
  remove: (id) => `/scm/order-payments/${id}`,
  debitCoas: (id) => (id && id !== "debit-coas" ? `/scm/order-payments/${id}/debit-coas` : "/scm/order-payments/debit-coas"),
  items: (id) => `/scm/order-payments/${id}/items`,
  item: (id, itemId) => `/scm/order-payments/${id}/items/${itemId}`,
  print: (id) => `/scm/order-payments/${id}/print`,
  attachments: (id) => `/scm/order-payments/${id}/attachments`,
  attachment: (id, fileId) => `/scm/order-payments/${id}/attachments/${fileId}`,
  rescheduleDueDate: (id) => `/api/faktur-beli/${id}/reschedule-due-date`,
};

const permissionDefaults = {
  can_read: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_post: false,
  can_reschedule_due_date: false,
  can_export: false,
  can_upload_attachment: false,
  can_replace_attachment: false,
  can_remove_attachment: false,
};

const isOn = (v) =>
  v === true ||
  v === 1 ||
  ["Y", "1", "TRUE"].includes(String(v || "").toUpperCase());

const normalizePermissions = (p = {}) => {
  const norm = Object.fromEntries(
    Object.keys(permissionDefaults).map((k) => [k, isOn(p[k])]),
  );
  if (!norm.can_reschedule_due_date && (isOn(p.approval) || isOn(p.approve))) {
    norm.can_reschedule_due_date = true;
  }
  return norm;
};

function extractAccessPayload(data) {
  // Supports:
  // { rows: { permissions: {...}, can_read: true } }
  // { rows: { can_read: true } }
  // { data: {...} }
  const root = data?.rows ?? data?.data ?? data ?? {};
  if (!root || Array.isArray(root)) return {};
  if (root.permissions && typeof root.permissions === "object") {
    return { ...root.permissions, ...root };
  }
  return root;
}

export function useOrderPaymentAccess() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoints.access,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    },
  );

  return useMemo(() => {
    const payload = extractAccessPayload(data);
    const permissions = normalizePermissions(payload);
    return {
      permissions,
      source: payload.source || "",
      usertype: payload.usertype || "",
      loading: isLoading,
      error,
      validating: isValidating,
      refresh: mutate,
      raw: data,
    };
  }, [data, error, isLoading, isValidating, mutate]);
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function useGetOrderPayments(params = {}, enabled = true) {
  const key = enabled ? `${endpoints.key}${buildQuery(params)}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const rowsRaw = data?.rows ?? data?.data ?? [];
  const rows = Array.isArray(rowsRaw)
    ? rowsRaw
    : Array.isArray(rowsRaw?.data)
      ? rowsRaw.data
      : [];
  const meta = data?.meta || rowsRaw?.meta || {};

  return {
    rows,
    page: Number(meta.page) || Number(params.page) || 1,
    perPage: Number(meta.limit) || Number(params.limit) || 25,
    total: Number(meta.total) || rows.length,
    lastPage: Number(meta.total_pages) || 1,
    loading: isLoading,
    validating: isValidating,
    error,
    refresh: mutate,
  };
}

export function useOrderPaymentDetail(id, enabled = true) {
  const key = enabled && id ? endpoints.detail(id) : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });
  const row = data?.rows ?? data?.data ?? null;
  return {
    row: row && !Array.isArray(row) ? row : null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useOrderPaymentSummary(params = {}, enabled = true) {
  const key = enabled ? `${endpoints.summary}${buildQuery(params)}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
  });
  const summary = data?.rows ?? data?.data ?? { pending: 0, paid: 0 };
  return {
    summary:
      summary && !Array.isArray(summary)
        ? summary
        : { pending: 0, paid: 0 },
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export async function fetchCashAccounts(bisnisId) {
  const res = await axiosServices.get(endpoints.cashAccounts, {
    params: { bisnis_id: bisnisId },
  });
  const payload = res?.data;
  const rows = payload?.rows ?? payload?.data ?? [];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchWallets(bisnisId, type = "all") {
  const res = await axiosServices.get(endpoints.wallets, {
    params: { bisnis_id: bisnisId, type },
  });
  const rows = res?.data?.rows ?? res?.data?.data ?? [];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchOutstanding(params = {}) {
  const res = await axiosServices.get(endpoints.outstanding, { params });
  const rows = res?.data?.rows ?? res?.data?.data ?? [];
  const meta = res?.data?.meta || {};
  return {
    rows: Array.isArray(rows) ? rows : [],
    meta: {
      page: Number(meta.page) || Number(params.page) || 1,
      limit: Number(meta.limit) || Number(params.limit) || 25,
      total: Number(meta.total) || (Array.isArray(rows) ? rows.length : 0),
      total_pages:
        Number(meta.total_pages) ||
        Math.max(
          1,
          Math.ceil(
            (Number(meta.total) || (Array.isArray(rows) ? rows.length : 0)) /
              (Number(meta.limit) || Number(params.limit) || 25),
          ),
        ),
    },
  };
}

export async function createOrderPayment(body) {
  const res = await axiosServices.post(endpoints.key, body, {
    skipOfflineQueue: true,
  });
  const diag = res?.data?.diagnostic;
  if (diag?.error) {
    throw new Error(
      typeof diag.error === "string" ? diag.error : "Gagal membuat pembayaran",
    );
  }
  return res?.data?.rows ?? res?.data?.data ?? res?.data;
}

export async function postOrderPayment(id, body) {
  const res = await axiosServices.post(endpoints.post(id), body, {
    skipOfflineQueue: true,
  });
  const diag = res?.data?.diagnostic;
  if (diag?.error) {
    throw new Error(
      typeof diag.error === "string"
        ? diag.error
        : "Gagal memposting pembayaran",
    );
  }
  return res?.data?.rows ?? res?.data?.data ?? res?.data;
}

export async function removeOrderPayment(id) {
  const res = await axiosServices.delete(endpoints.remove(id), {
    skipOfflineQueue: true,
  });
  const diag = res?.data?.diagnostic;
  if (diag?.error) {
    throw new Error(
      typeof diag.error === "string"
        ? diag.error
        : "Gagal melakukan rollback pembayaran",
    );
  }
  return res?.data?.rows ?? res?.data?.data ?? res?.data;
}

const attachmentError = (error) => new Error(
  error?.diagnostic?.error || error?.response?.data?.diagnostic?.error || error?.message || 'Gagal menyimpan bukti pembayaran',
);

async function savePaymentAttachments(method, url, files, onUploadProgress) {
  const data = new FormData();
  Array.from(files || []).forEach((file) => data.append('attachments', file));
  try {
    const response = await axiosServices[method](url, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipOfflineQueue: true,
      skipRetry: true,
      timeout: 120000,
      onUploadProgress,
    });
    if (response.data?.diagnostic?.error) throw response.data;
    return response.data.rows;
  } catch (error) {
    throw attachmentError(error);
  }
}

export const uploadOrderPaymentAttachments = (id, files, onUploadProgress) =>
  savePaymentAttachments('post', endpoints.attachments(id), files, onUploadProgress);

export const replaceOrderPaymentAttachment = (id, fileId, file, onUploadProgress) =>
  savePaymentAttachments('put', endpoints.attachment(id, fileId), [file], onUploadProgress);

export async function deleteOrderPaymentAttachment(id, fileId) {
  try {
    const response = await axiosServices.delete(endpoints.attachment(id, fileId), { skipOfflineQueue: true, skipRetry: true });
    if (response.data?.diagnostic?.error) throw response.data;
    return response.data.rows;
  } catch (error) {
    throw attachmentError(error);
  }
}

export async function fetchDebitCoas(idOrParams, maybeParams = {}) {
  let url = endpoints.debitCoas();
  let params = {};
  if (typeof idOrParams === "object" && idOrParams !== null) {
    params = idOrParams;
  } else if (idOrParams) {
    url = endpoints.debitCoas(idOrParams);
    params = maybeParams;
  }
  const res = await axiosServices.get(url, { params, skipOfflineQueue: true });
  const payload = res?.data;
  if (payload?.diagnostic?.error) throw new Error(payload.diagnostic.error);
  return payload?.rows || payload?.data?.rows || (Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []));
}

export async function addOrderPaymentItem(id, body) {
  const res = await axiosServices.post(endpoints.items(id), body, { skipOfflineQueue: true, skipRetry: true });
  const payload = res?.data;
  if (payload?.diagnostic?.error) throw new Error(payload.diagnostic.error);
  return payload?.rows;
}

export async function deleteOrderPaymentItem(id, itemId) {
  const res = await axiosServices.delete(endpoints.item(id, itemId), { skipOfflineQueue: true, skipRetry: true });
  const payload = res?.data;
  if (payload?.diagnostic?.error) throw new Error(payload.diagnostic.error);
  return payload?.rows;
}

export async function fetchPrintDefinition(id) {
  const res = await axiosServices.get(endpoints.print(id), { skipOfflineQueue: true, skipRetry: true, timeout: 30000 });
  const payload = res?.data;
  if (payload?.diagnostic?.error) throw new Error(payload.diagnostic.error);
  return payload?.rows;
}

export async function rescheduleDueDate(fakturId, body) {
  if (!fakturId) throw new Error("ID Faktur tidak ditemukan");
  const payload = {
    new_due_date: body?.new_due_date,
    reason: body?.reason,
    termin_id: body?.termin_id ?? null,
  };
  try {
    const res = await axiosServices.post(
      endpoints.rescheduleDueDate(fakturId),
      payload,
      {
        skipOfflineQueue: true,
        skipRetry: true,
      }
    );
    const diag = res?.data?.diagnostic;
    if (diag?.error) {
      throw new Error(
        typeof diag.error === "string"
          ? diag.error
          : "Gagal menjadwalkan ulang jatuh tempo",
      );
    }
    return res?.data?.rows ?? res?.data?.data ?? res?.data;
  } catch (error) {
    const status = error?.response?.status || error?.status;
    if (status === 403) {
      const serverMsg =
        error?.response?.data?.diagnostic?.error ||
        error?.diagnostic?.error ||
        "Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo";
      const err = new Error(
        typeof serverMsg === "string"
          ? serverMsg
          : "Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo",
      );
      err.status = 403;
      throw err;
    }
    const message =
      error?.response?.data?.diagnostic?.error ||
      error?.diagnostic?.error ||
      error?.message ||
      "Gagal menjadwalkan ulang jatuh tempo";
    const err = new Error(
      typeof message === "string"
        ? message
        : "Gagal menjadwalkan ulang jatuh tempo",
    );
    err.status = status;
    throw err;
  }
}

