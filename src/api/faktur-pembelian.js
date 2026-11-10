import { useMemo } from "react";
import useSWR from "swr";

import axiosServices, { fetcher } from "utils/axios";

export const endpoints = {
  key: "/scm/faktur-pembelian",
  access: "/scm/faktur-pembelian/access",
  summary: "/scm/faktur-pembelian/summary",
  unpaid: "/scm/faktur-pembelian/unpaid",
  plans: "/scm/faktur-pembelian/plans",
  detail: (id) => `/scm/faktur-pembelian/${id}`,
};

const permissionDefaults = {
  can_read: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_export: false,
  can_reschedule_due_date: false,
  can_upload_attachment: false,
  can_replace_attachment: false,
  can_remove_attachment: false,
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
  const root = data?.rows ?? data?.data ?? data ?? {};
  if (!root || Array.isArray(root)) return {};
  if (root.permissions && typeof root.permissions === "object") {
    return { ...root.permissions, ...root };
  }
  return root;
}

export function useFakturPembelianAccess() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoints.access,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    },
  );

  return useMemo(() => {
    const payload = extractAccessPayload(data);
    return {
      permissions: normalizePermissions(payload),
      source: payload.source || "",
      usertype: payload.usertype || "",
      loading: isLoading,
      error,
      validating: isValidating,
      refresh: mutate,
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

function useList(url, params, enabled) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? `${url}${buildQuery(params)}` : null,
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
    perPage: Number(meta.perPage || meta.limit) || Number(params.perPage) || 25,
    total: Number(meta.total) || rows.length,
    lastPage: Number(meta.total_pages || meta.lastPage) || 1,
    loading: isLoading,
    validating: isValidating,
    error,
    refresh: mutate,
  };
}

export function useGetFakturPembelian(params = {}, enabled = true) {
  return useList(endpoints.key, params, enabled);
}

export function useGetFakturPembelianUnpaid(params = {}, enabled = true) {
  return useList(endpoints.unpaid, params, enabled);
}

export function useFakturPembelianSummary(params = {}, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? `${endpoints.summary}${buildQuery(params)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const summary = data?.rows ?? data?.data ?? {};
  return {
    summary: summary && !Array.isArray(summary) ? summary : {},
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useFakturPembelianDetail(id, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled && id ? endpoints.detail(id) : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    row: data?.rows ?? data?.data ?? null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

const planError = (error) =>
  new Error(
    error?.diagnostic?.error ||
      error?.response?.data?.diagnostic?.error ||
      error?.message ||
      "Gagal membuat rencana pembayaran",
  );

export async function createPaymentPlans(body) {
  try {
    const res = await axiosServices.post(endpoints.plans, body, {
      skipOfflineQueue: true,
      skipRetry: true,
    });
    const diag = res?.data?.diagnostic;
    if (diag?.error) throw new Error(diag.error);
    return res?.data?.rows ?? { created: [], failed: [] };
  } catch (error) {
    const err = planError(error);
    err.payload = error?.response?.data?.rows || error?.rows || null;
    throw err;
  }
}
