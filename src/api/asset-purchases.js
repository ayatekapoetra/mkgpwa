import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosServices, { fetcher } from 'utils/axios';
import { generateIdempotencyKey } from 'utils/idempotency';

export const assetEndpoints = {
  purchases: '/asset-purchases',
  purchase: (id) => `/asset-purchases/${id}`,
  approvalSteps: (id) => `/asset-purchases/${id}/approval-steps`,
  offers: (id) => `/asset-purchases/${id}/vendor-offers`,
  proposals: (id) => `/asset-purchases/${id}/financing-proposals`,
  receipts: (id) => `/asset-purchases/${id}/receipts`,
  units: (id) => `/asset-purchases/${id}/units`,
  contracts: '/asset-financing-contracts',
  contract: (id) => `/asset-financing-contracts/${id}`,
  payments: '/asset-payment-instructions',
  payment: (id) => `/asset-payment-instructions/${id}`,
  giros: '/asset-giros',
  giro: (id) => `/asset-giros/${id}`,
  providers: '/financing-providers',
  provider: (id) => `/financing-providers/${id}`,
  products: '/financing-products',
  product: (id) => `/financing-products/${id}`,
  approvalRules: '/asset-approval-rules',
  approvalRule: (id) => `/asset-approval-rules/${id}`,
  purchasePoPdf: (id) => `/asset-purchases/${id}/po-pdf`,
  paymentReverse: (id) => `/asset-purchases/payment-instructions/${id}/reverse`
};

const permissionNames = [
  'read', 'insert', 'update', 'remove', 'submit', 'approve', 'reject', 'return', 'procure', 'verify_budget',
  'verify_financing', 'verify_legal', 'receive', 'inspect', 'create_payment_instruction', 'approve_payment_instruction',
  'execute_payment', 'reverse_payment', 'manage_giro', 'clear_giro', 'manage_contract', 'capitalize_request', 'configure_approval_matrix',
  'configure_financing_master', 'import', 'view_audit'
];

const enabled = (value) => value === true || value === 1 || ['Y', '1', 'TRUE'].includes(String(value || '').toUpperCase());

export const normalizeAssetPermissions = (source = {}) => Object.fromEntries(permissionNames.map((name) => {
  const value = source[name] ?? source[`can_${name}`];
  return [`can_${name}`, enabled(value)];
}));

const payloadData = (payload) => payload?.data?.data ?? payload?.data ?? payload?.rows ?? payload;

export const normalizeAssetRows = (payload) => {
  const value = payloadData(payload);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

export const normalizeAssetDetail = (payload) => {
  const value = payloadData(payload);
  if (Array.isArray(value)) return value[0] || null;
  return value?.row ?? value?.item ?? value ?? null;
};

export const getAssetErrorMessage = (error, fallback = 'Proses gagal') => {
  const payload = error?.response?.data || error?.data || error || {};
  const candidate = payload?.diagnostic?.message || payload?.message || payload?.error || error?.message || fallback;
  return typeof candidate === 'string' ? candidate : candidate?.message || fallback;
};

export const isVersionConflict = (error) => {
  const code = error?.diagnostic?.code || error?.response?.data?.diagnostic?.code || error?.code;
  const status = error?.status || error?.response?.status;
  return code === 'VERSION_CONFLICT' || status === 409;
};

export const invalidateAssetCache = async () => {
  try {
    await mutate(
      (key) => typeof key === 'string' && (key.startsWith('/asset-') || key.startsWith('/financing-')),
      undefined,
      { revalidate: true }
    );
  } catch {
    // Abaikan kegagalan revalidasi cache agar tidak mengacaukan aliran data utama
  }
};

const queryString = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));
  const query = new URLSearchParams(clean).toString();
  return query ? `?${query}` : '';
};

const swrOptions = { revalidateOnFocus: false, revalidateIfStale: true, revalidateOnReconnect: true };

export function useAssetList(endpoint, params = {}, active = true) {
  const url = active ? `${endpoint}${queryString(params)}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  return useMemo(() => {
    const rows = normalizeAssetRows(data);
    const envelope = data?.pagination || data?.meta || data?.data?.pagination || data?.data?.meta || {};
    const rawPermissions = data?.permissions || data?.data?.permissions || {};
    return {
      rows,
      permissions: normalizeAssetPermissions(rawPermissions),
      summary: data?.summary || data?.data?.summary || {},
      pagination: {
        page: Number(envelope.page || envelope.current_page || params.page || 1),
        perPage: Number(envelope.per_page || envelope.perPage || params.per_page || 25),
        total: Number(envelope.total || rows.length),
        lastPage: Number(envelope.last_page || envelope.lastPage || 1)
      },
      loading: isLoading,
      validating: isValidating,
      error,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate, params.page, params.per_page]);
}

export function useAssetDetail(endpoint, active = true) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    active && endpoint ? endpoint : null,
    fetcher,
    { ...swrOptions, revalidateIfStale: true, revalidateOnMount: true }
  );
  return useMemo(() => {
    const row = normalizeAssetDetail(data);
    const rawPermissions = data?.permissions || data?.data?.permissions || row?.permissions || {};
    return { row, permissions: normalizeAssetPermissions(rawPermissions), loading: isLoading, validating: isValidating, error, mutate };
  }, [data, error, isLoading, isValidating, mutate]);
}

export const useAssetPurchases = (params, active = true) => useAssetList(assetEndpoints.purchases, params, active);
export const useAssetContract = (id, active = true) => useAssetDetail(id ? assetEndpoints.contract(id) : null, active);
export const useAssetContracts = (params, active = true) => useAssetList(assetEndpoints.contracts, params, active);
export const useAssetPurchase = (id, active = true) => useAssetDetail(id ? assetEndpoints.purchase(id) : null, active);
export const useAssetPayments = (params, active = true) => useAssetList(assetEndpoints.payments, params, active);
export const useAssetPayment = (id, active = true) => useAssetDetail(id ? assetEndpoints.payment(id) : null, active);
export const useAssetGiros = (params, active = true) => useAssetList(assetEndpoints.giros, params, active);
export const useAssetGiro = (id, active = true) => useAssetDetail(id ? assetEndpoints.giro(id) : null, active);

export async function assetMutation(method, endpoint, payload = {}, version = null) {
  const headers = { 'Idempotency-Key': generateIdempotencyKey() };
  if (version !== null && version !== undefined) headers['If-Match'] = String(version);
  const response = await axiosServices.request({ method, url: endpoint, data: payload, headers, skipOfflineQueue: true });
  await invalidateAssetCache();
  return response.data;
}

export const createAssetPurchase = (payload) => assetMutation('post', assetEndpoints.purchases, payload);
export const updateAssetPurchase = (id, payload, version) => assetMutation('put', assetEndpoints.purchase(id), payload, version);
export const runPurchaseAction = (id, action, payload, version) => assetMutation('post', `${assetEndpoints.purchase(id)}/${action}`, payload, version);
export const runApprovalAction = (id, stepId, action, payload, version) => assetMutation('post', `${assetEndpoints.approvalSteps(id)}/${stepId}/${action}`, payload, version);
export const runResourceAction = (endpoint, action, payload, version) => assetMutation('post', `${endpoint}/${action}`, payload, version);
export const saveAssetResource = (endpoint, payload, id = null, version = null) => assetMutation(id ? 'put' : 'post', id ? `${endpoint}/${id}` : endpoint, payload, version);
export const reversePaymentInstruction = (id, payload = {}, version = null) => assetMutation('post', assetEndpoints.paymentReverse(id), payload, version);
export const getAssetPurchasePoPdf = async (id) => axiosServices.get(assetEndpoints.purchasePoPdf(id), { responseType: 'blob', skipOfflineQueue: true });
export const runGiroBulkAction = (ids, action, payload = {}) => assetMutation('post', '/asset-giros/bulk-action', { ids, action, ...payload });
