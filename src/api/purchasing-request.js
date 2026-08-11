import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import axiosServices, { fetcher } from "utils/axios";

/** Delays updating a value until the user stops typing for the given ms. */
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
  key: "/scm/purchase-request",
  access: "/scm/purchase-request/access",
  validate: "/scm/purchase-request/validate",
  updateItem: "/scm/purchase-request/update-item",
  approve: "/scm/purchase-request/approve",
  rollback: "/scm/purchase-request/rollback",
  supplierRecommendations: "/scm/purchase-request/supplier-recommendations",
  export: "/scm/purchase-request/export",
  detail: (id) => `/scm/purchase-request/${id}`,
  permissions: (id) => `/scm/purchase-request/${id}/permissions`,
  submit: (id) => `/scm/purchase-request/${id}/submit`,
  attachments: (id) => `/scm/purchase-request/${id}/attachments`,
  print: (id) => `/scm/purchase-request/${id}/print`,
  bisnis: "/master/bisnis-unit/list?my_units=true",
  cabang: "/master/cabang/list",
  gudang: "/master/gudang/list",
  barang: "/master/barang/list",
  pemasok: "/master/pemasok/list",
  equipment: "/master/equipment/list",
};

const permissionDefaults = {
  can_read: false,
  can_create: false,
  can_insert: false,
  can_update: false,
  can_delete: false,
  can_remove: false,
  can_submit: false,
  can_validate: false,
  can_approve: false,
  can_rollback: false,
  can_rollback_validation: false,
  can_rollback_approval: false,
  can_upload_attachment: false,
  can_print: false,
  can_export: false,
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

export const getPurchasingRequestError = (
  error,
  fallback = "Proses Purchasing Request gagal",
) => {
  // The shared Axios interceptor rejects with response.data directly, while
  // blob requests and network failures still use the native AxiosError shape.
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

  // Plain array response
  if (Array.isArray(rowsPayload)) return rowsPayload;

  // Lucid/Adonis paginator shapes: { data: [] } or { rows: [] }
  if (Array.isArray(rowsPayload?.data)) return rowsPayload.data;
  if (Array.isArray(rowsPayload?.rows)) return rowsPayload.rows;

  // Nested paginator sometimes returned as { rows: { data: [] } }
  if (Array.isArray(payload?.rows?.data)) return payload.rows.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  return [];
};

const normalizeList = (payload, params = {}) => {
  const rowsPayload = getRowsPayload(payload);
  const rows = normalizeRows(payload);
  const pagination = Array.isArray(rowsPayload)
    ? payload || {}
    : rowsPayload || {};

  return {
    rows,
    page: Number(
      pagination.page || pagination.current_page || params.page || 1,
    ),
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

export const usePurchasingRequestAccess = () => {
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

export const useGetPurchasingRequests = (params = {}, enabled = true) => {
  const listParams = {
    ...params,
    date_ro_start: params.date_ro_start || params.date_start,
    date_ro_end: params.date_ro_end || params.date_end,
  };
  delete listParams.date_start;
  delete listParams.date_end;
  const url = enabled ? `${endpoints.key}${toQueryString(listParams)}` : null;
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

export const useShowPurchasingRequest = (id, enabled = true) => {
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

export const usePurchasingRequestPermissions = (
  document = null,
  enabled = true,
) => {
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

const usePurchasingRequestOptions = (endpoint, params = {}, enabled = true) => {
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
      dataLoading: isLoading,
      error,
      dataError: error,
      validating: isValidating,
      dataValidating: isValidating,
      dataEmpty: !isLoading && rows.length === 0,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);
};

export const usePurchasingRequestBisnis = (params = {}, enabled = true) =>
  usePurchasingRequestOptions(endpoints.bisnis, params, enabled);
export const usePurchasingRequestCabang = (params = {}, enabled = true) =>
  usePurchasingRequestOptions(endpoints.cabang, params, enabled);
export const usePurchasingRequestGudang = (params = {}, enabled = true) =>
  usePurchasingRequestOptions(endpoints.gudang, params, enabled);
export const usePurchasingRequestBarang = (params = {}, enabled = true) =>
  usePurchasingRequestOptions(endpoints.barang, params, enabled);
export const usePurchasingRequestPemasok = (params = {}, enabled = true) =>
  usePurchasingRequestOptions(endpoints.pemasok, params, enabled);
export const usePurchasingRequestEquipment = (params = {}, enabled = true) =>
  usePurchasingRequestOptions(endpoints.equipment, params, enabled);

export const usePurchasingRequestSupplierRecommendations = (
  barangId,
  orderUnit,
  enabled = true,
) => {
  const url =
    enabled && barangId && String(orderUnit || "").trim()
      ? `${endpoints.supplierRecommendations}${toQueryString({
          barang_id: barangId,
          order_unit: String(orderUnit).trim(),
        })}`
      : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return useMemo(() => {
    const payload = normalizeDetail(data) || {};
    return {
      data: payload,
      rows: Array.isArray(payload.recommendations)
        ? payload.recommendations
        : [],
      loading: Boolean(url) && isLoading,
      error,
      validating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate, url]);
};

/** Debounced server-side search for spare parts by kode, nama, or num_part across all bisnis. */
export const usePurchasingRequestBarangSearch = (
  search,
  _bisnisId = "",
  debounceMs = 400,
) => {
  const debouncedSearch = useDebounce(search, debounceMs);
  const hasSearch = debouncedSearch.trim().length >= 2;

  // No bisnis_id filter — search across all business units.
  const params = { page: 1, perPages: 100 };
  if (debouncedSearch.trim()) params.kode = debouncedSearch.trim();

  const url = hasSearch ? `${endpoints.barang}${toQueryString(params)}` : null;
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return useMemo(() => {
    const rows = normalizeRows(data);
    return {
      rows: hasSearch ? rows : [],
      loading: hasSearch && isLoading,
      error,
    };
  }, [data, error, hasSearch, isLoading]);
};

const itemsPayload = (items) => ({
  items: Array.isArray(items) ? items : items?.items || [],
});

export const createPurchasingRequest = async (payload) => {
  const response = await axiosServices.post(endpoints.key, payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const updatePurchasingRequest = async (id, payload) => {
  const response = await axiosServices.put(endpoints.detail(id), payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const submitPurchasingRequest = async (id, payload = {}) => {
  const response = await axiosServices.post(endpoints.submit(id), payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const deletePurchasingRequest = async (id) => {
  const response = await axiosServices.delete(endpoints.detail(id), {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const validatePurchasingRequest = async (items) => {
  const response = await axiosServices.put(
    endpoints.validate,
    itemsPayload(items),
    { skipOfflineQueue: true },
  );
  return response.data;
};

export const updatePurchasingRequestItems = async (items) => {
  const response = await axiosServices.put(
    endpoints.updateItem,
    itemsPayload(items),
    { skipOfflineQueue: true },
  );
  return response.data;
};

export const approvePurchasingRequest = async (items) => {
  const values = Array.isArray(items) ? items : items?.items || [];
  const payload = {
    items: values.map((item) => ({
      id: typeof item === "object" ? item.id : item,
    })),
  };
  const response = await axiosServices.put(endpoints.approve, payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const rollbackPurchasingRequest = async (purchaseRequestId, reason) => {
  const payload = {
    purchase_request_id: purchaseRequestId,
    reason,
  };
  const response = await axiosServices.post(endpoints.rollback, payload, {
    skipOfflineQueue: true,
  });
  return response.data;
};

export const uploadPurchasingRequestAttachments = async (id, files) => {
  const formData = new FormData();
  Array.from(files || []).forEach((file) =>
    formData.append("attachments[]", file),
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

export const printPurchasingRequest = async (id) => {
  const response = await axiosServices.get(endpoints.print(id), {
    responseType: "blob",
    skipOfflineQueue: true,
  });
  return response.data;
};

export const exportPurchasingRequests = async (params = {}) => {
  const response = await axiosServices.get(
    `${endpoints.export}${toQueryString(params)}`,
    {
      responseType: "blob",
      skipOfflineQueue: true,
    },
  );
  return response.data;
};
