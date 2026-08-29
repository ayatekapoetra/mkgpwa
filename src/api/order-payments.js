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
};

const permissionDefaults = {
  can_read: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_post: false,
  can_export: false,
};

const isOn = (v) =>
  v === true ||
  v === 1 ||
  ["Y", "1", "TRUE"].includes(String(v || "").toUpperCase());

const normalizePermissions = (p = {}) =>
  Object.fromEntries(
    Object.keys(permissionDefaults).map((k) => [k, isOn(p[k])]),
  );

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
