import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import axiosServices, { fetcher } from "utils/axios";

const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
};

export const endpoints = {
  key: "/scm/purchase-orders",
  access: "/scm/purchase-orders/access",
  pendingCount: "/scm/purchase-orders/pending-count",
  export: "/scm/purchase-orders/export",
  detail: (id) => `/scm/purchase-orders/${id}`,
  permissions: (id) => `/scm/purchase-orders/${id}/permissions`,
  preparation: (id) => `/scm/purchase-orders/${id}/preparation`,
  submitVerification: (id) => `/scm/purchase-orders/${id}/submit-verification`,
  verify: (id) => `/scm/purchase-orders/${id}/verify`,
  return: (id) => `/scm/purchase-orders/${id}/return`,
  rollbackPreview: (id) => `/scm/purchase-orders/${id}/rollback-preview`,
  rollback: (id) => `/scm/purchase-orders/${id}/rollback`,
  cancel: (id) => `/scm/purchase-orders/${id}/cancel`,
  attachments: (id) => `/scm/purchase-orders/${id}/attachments`,
  attachment: (id, fileId) => `/scm/purchase-orders/${id}/attachments/${fileId}`,
  auditTrail: (id) => `/scm/purchase-orders/${id}/audit-trail`,
  print: (id) => `/scm/purchase-orders/${id}/print`,
  salesOrderCode: (id) => `/scm/purchase-orders/${id}/sales-order-code`,
  reconciliation: (id) => `/scm/purchase-orders/${id}/reconciliation`,
  bisnis: "/master/bisnis-unit/list?my_units=true",
  cabang: "/master/cabang/list",
  gudang: "/master/gudang/list",
  pemasok: "/master/pemasok/list",
};

const permissionDefaults = {
  can_read: false,
  can_create: false,
  can_insert: false,
  can_update: false,
  can_delete: false,
  can_remove: false,
  can_prepare: false,
  can_submit: false,
  can_verify: false,
  can_finalize: false,
  can_rollback: false,
  can_rollback_open: false,
  can_rollback_verify: false,
  can_cancel: false,
  can_attachment: false,
  can_upload_attachment: false,
  can_print: false,
  can_export: false,
  can_admin_override: false,
  can_return: false,
};

const isPermissionEnabled = (value) =>
  value === true ||
  value === 1 ||
  ["Y", "1", "TRUE"].includes(String(value || "").toUpperCase());
const normalizePermissions = (permissions = {}) =>
  Object.fromEntries(
    Object.keys(permissionDefaults).map((key) => [
      key,
      isPermissionEnabled(permissions[key]),
    ]),
  );

export const getPurchaseOrderError = (
  error,
  fallback = "Proses Purchase Order gagal",
) => {
  const payload = error?.response?.data || error?.data || error || {};
  const diagnostic = payload?.diagnostic || {};
  const legacyMessage =
    typeof diagnostic.error === "string" ? diagnostic.error : "";
  const fieldMessage = Array.isArray(payload?.errors)
    ? payload.errors.find((item) => item?.message)?.message
    : "";

  return {
    message:
      diagnostic.message ||
      legacyMessage ||
      payload.message ||
      fieldMessage ||
      error?.message ||
      fallback,
    code: diagnostic.code || null,
    requestId: diagnostic.request_id || null,
    errors: Array.isArray(payload?.errors) ? payload.errors : [],
  };
};

const toQueryString = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
  const query = new URLSearchParams(clean).toString();
  return query ? `?${query}` : "";
};

const getRowsPayload = (payload) =>
  payload?.rows ?? payload?.data?.rows ?? payload?.data ?? [];

const normalizeRows = (payload) => {
  const rowsPayload = getRowsPayload(payload);
  if (Array.isArray(rowsPayload)) return rowsPayload;
  if (Array.isArray(rowsPayload?.data)) return rowsPayload.data;
  if (Array.isArray(rowsPayload?.rows)) return rowsPayload.rows;
  if (Array.isArray(payload?.rows?.data)) return payload.rows.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeList = (payload, params = {}) => {
  const rowsPayload = getRowsPayload(payload);
  const rows = normalizeRows(payload);
  const pagination =
    payload?.pagination ||
    (Array.isArray(rowsPayload) ? {} : rowsPayload || {});

  return {
    rows,
    page: Number(pagination.page || params.page || 1),
    perPage: Number(
      pagination.perPage ||
        pagination.per_page ||
        params.limit ||
        rows.length ||
        25,
    ),
    total: Number(pagination.total || rows.length),
    lastPage: Number(
      pagination.lastPage || pagination.last_page || pagination.totalPages || 1,
    ),
  };
};

const normalizeDetail = (payload) => {
  const row = payload?.rows ?? payload?.data?.rows ?? payload?.data ?? null;
  if (Array.isArray(row)) return row[0] || null;
  return row;
};

export const usePurchaseOrderAccess = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoints.access,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const payload = normalizeDetail(data) || {};
    const permissions = normalizePermissions(payload.permissions);
    return {
      ...permissions,
      permissions,
      source: payload.source || "",
      loading: isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

export const useGetPurchaseOrders = (params = {}, enabled = true) => {
  const url = enabled ? `${endpoints.key}${toQueryString(params)}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const normalized = normalizeList(data, {
      page: params.page,
      limit: params.limit,
    });
    return {
      ...normalized,
      data: normalized.rows,
      pagination: {
        page: normalized.page,
        perPage: normalized.perPage,
        total: normalized.total,
        lastPage: normalized.lastPage,
      },
      loading: isLoading,
      dataLoading: isLoading,
      error,
      dataError: error,
      validating: isValidating,
      dataValidating: isValidating,
      dataEmpty: !isLoading && normalized.rows.length === 0,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate, params.limit, params.page]);
};

export const useShowPurchaseOrder = (id, enabled = true) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id && enabled ? endpoints.detail(id) : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return useMemo(() => {
    const row = normalizeDetail(data);
    return {
      row,
      data: row,
      loading: isLoading,
      rowLoading: isLoading,
      dataLoading: isLoading,
      error,
      rowError: error,
      dataError: error,
      validating: isValidating,
      rowValidating: isValidating,
      dataValidating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

export const usePurchaseOrderPermissions = (document = null, enabled = true) => {
  const id = typeof document === "object" ? document?.id : document;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id && enabled ? endpoints.permissions(id) : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const payload = normalizeDetail(data) || {};
    const permissions = normalizePermissions(payload.permissions);
    return {
      ...permissions,
      permissions,
      status: payload.status || document?.status || "",
      source: payload.source || "",
      loading: Boolean(id) && isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, document?.status, error, id, isLoading, isValidating, mutate]);
};

export const usePurchaseOrderPendingCount = (enabled = true) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? endpoints.pendingCount : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const payload = normalizeDetail(data) || {};
    return {
      verify: Number(payload.verify || 0),
      finalize: Number(payload.finalize || 0),
      total: Number(payload.total || 0),
      loading: isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

const useOptions = (endpoint, params = {}, enabled = true) => {
  const separator = endpoint.includes("?") ? "&" : "?";
  const query = toQueryString(params).slice(1);
  const url = enabled
    ? `${endpoint}${query ? `${separator}${query}` : ""}`
    : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const rows = normalizeRows(data);
    return {
      rows,
      data: rows,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

export const usePurchaseOrderBisnis = (params = {}, enabled = true) =>
  useOptions(endpoints.bisnis, params, enabled);
export const usePurchaseOrderCabang = (params = {}, enabled = true) =>
  useOptions(endpoints.cabang, params, enabled);
export const usePurchaseOrderGudang = (params = {}, enabled = true) =>
  useOptions(endpoints.gudang, params, enabled);
export const usePurchaseOrderPemasok = (params = {}, enabled = true) =>
  useOptions(endpoints.pemasok, params, enabled);

export const usePurchaseOrderRollbackPreview = (id, enabled = true) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id && enabled ? endpoints.rollbackPreview(id) : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return useMemo(() => {
    const row = normalizeDetail(data);
    return {
      data: row,
      loading: Boolean(id) && isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, id, isLoading, isValidating, mutate]);
};

export const usePurchaseOrderReconciliation = (id, enabled = true) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id && enabled ? endpoints.reconciliation(id) : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const row = normalizeDetail(data);
    return {
      data: row,
      loading: Boolean(id) && isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, id, isLoading, isValidating, mutate]);
};

export const usePurchaseOrderAuditTrail = (id, enabled = true) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id && enabled ? endpoints.auditTrail(id) : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return useMemo(() => {
    const payload = normalizeDetail(data);
    return {
      rows: Array.isArray(payload) ? payload : [],
      loading: Boolean(id) && isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, id, isLoading, isValidating, mutate]);
};

export const savePreparation = async (id, payload) => {
  const response = await axiosServices.put(endpoints.preparation(id), payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const submitVerification = async (id, payload = {}) => {
  const response = await axiosServices.post(
    endpoints.submitVerification(id),
    payload,
    { skipOfflineQueue: true },
  );
  return response.data;
};

export const verifyPurchaseOrder = async (id, payload = {}) => {
  const response = await axiosServices.post(endpoints.verify(id), payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const returnPurchaseOrder = async (id, payload = {}) => {
  const response = await axiosServices.post(endpoints.return(id), payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const rollbackPurchaseOrder = async (id, reason) => {
  const response = await axiosServices.post(
    endpoints.rollback(id),
    { reason },
    { skipOfflineQueue: true },
  );
  return response.data;
};

export const cancelPurchaseOrder = async (id, reason) => {
  const response = await axiosServices.post(
    endpoints.cancel(id),
    { reason },
    { skipOfflineQueue: true },
  );
  return response.data;
};

export const uploadAttachments = async (id, files) => {
  const formData = new FormData();
  Array.from(files || []).forEach((file) =>
    formData.append("attachments", file),
  );
  const response = await axiosServices.post(
    endpoints.attachments(id),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      skipOfflineQueue: true,
    },
  );
  return response.data;
};

export const deleteAttachment = async (id, fileId) => {
  const response = await axiosServices.delete(endpoints.attachment(id, fileId), {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const printPurchaseOrder = async (id) => {
  const response = await axiosServices.get(endpoints.print(id), {
    responseType: "blob",
    skipOfflineQueue: true,
  });
  return response.data;
};

export const exportPurchaseOrders = async (params = {}) => {
  const response = await axiosServices.get(
    `${endpoints.export}${toQueryString(params)}`,
    {
      responseType: "blob",
      skipOfflineQueue: true,
    },
  );
  return response.data;
};

export const updateSalesOrderCode = async (id, kdso) => {
  const response = await axiosServices.patch(
    endpoints.salesOrderCode(id),
    { kdso },
    { skipOfflineQueue: true },
  );
  return response.data;
};

export { useDebounce };