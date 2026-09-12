import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as mutateCache } from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

export const fleetAssignmentEndpoints = {
  access: '/operation/fleet-assignment/access',
  matrix: '/operation/fleet-assignment/matrix',
  summary: '/operation/fleet-assignment/summary',
  status: '/operation/fleet-assignment/status',
  kegiatanOptions: '/operation/fleet-assignment/kegiatan-options',
  materialOptions: '/operation/fleet-assignment/material-options',
  audit: (equipmentId) => `/operation/fleet-assignment/${equipmentId}/audit`
};

const onlineConfig = { skipOfflineQueue: true };

const compactParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

export const unwrapFleetResponse = (value) => value?.rows ?? value?.data?.rows ?? value?.data ?? value ?? null;

const asBoolean = (value) => value === true || value === 1 || value === '1' || String(value || '').toUpperCase() === 'Y';

const permissionKeys = ['read', 'insert', 'update', 'remove'];

export const normalizeFleetPermissions = (value) => {
  const payload = unwrapFleetResponse(value);
  const source = payload?.permissions || payload?.access || payload;
  return permissionKeys.reduce((permissions, key) => ({ ...permissions, [key]: asBoolean(source?.[key] ?? source?.[`can_${key}`]) }), {
    business_ids: Array.isArray(source?.business_ids) ? source.business_ids.map(String) : [],
    branch_ids: Array.isArray(source?.branch_ids) ? source.branch_ids.map(String) : []
  });
};

export const normalizeFleetMatrix = (value, fallbackPerPage = 25) => {
  const payload = unwrapFleetResponse(value) || {};
  const data = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : Array.isArray(payload.rows) ? payload.rows : [];
  return {
    data,
    total: Number(payload.total ?? data.length),
    page: Number(payload.page ?? 1),
    perPage: Number(payload.perPage ?? payload.per_page ?? fallbackPerPage),
    lastPage: Number(payload.lastPage ?? payload.last_page ?? 1)
  };
};

export const normalizeFleetSummary = (value) => {
  const payload = unwrapFleetResponse(value) || {};
  return {
    beroperasi: Number(payload.beroperasi ?? payload.working ?? 0),
    standby: Number(payload.standby ?? 0),
    breakdown: Number(payload.breakdown ?? 0),
    total: Number(payload.total ?? (payload.beroperasi ?? payload.working ?? 0) + (payload.standby ?? 0) + (payload.breakdown ?? 0))
  };
};

export const fleetErrorMessage = (error, fallback = 'Permintaan Fleet Assignment gagal.') =>
  error?.diagnostic?.message || error?.response?.data?.diagnostic?.message || error?.message || fallback;

const makeQuery = (endpoint, params) => {
  const query = new URLSearchParams(compactParams(params)).toString();
  return `${endpoint}${query ? `?${query}` : ''}`;
};

const useOnlinePolling = (enabled) => {
  const [interval, setIntervalValue] = useState(15000);
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    const update = () => setIntervalValue(document.hidden ? 60000 : 15000);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [enabled]);
  return enabled ? interval : 0;
};

const useFleetGet = (endpoint, params, enabled = true, polling = false) => {
  const url = enabled && endpoint ? makeQuery(endpoint, params) : null;
  const refreshInterval = useOnlinePolling(Boolean(url && polling));
  return useSWR(url ? [url, onlineConfig] : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval
  });
};

export function useFleetAssignmentAccess() {
  const { data, error, isLoading, mutate } = useFleetGet(fleetAssignmentEndpoints.access);
  return useMemo(() => ({
    permissions: data && !error ? normalizeFleetPermissions(data) : normalizeFleetPermissions(null),
    accessLoading: isLoading,
    accessError: error,
    mutate
  }), [data, error, isLoading, mutate]);
}

export function useFleetMatrix(params = {}, enabled = true) {
  const swr = useFleetGet(fleetAssignmentEndpoints.matrix, params, enabled, true);
  return useMemo(() => ({
    matrix: normalizeFleetMatrix(swr.data, params.perPage),
    ...swr
  }), [params.perPage, swr]);
}

export function useFleetSummary(params = {}, enabled = true) {
  const swr = useFleetGet(fleetAssignmentEndpoints.summary, params, enabled, true);
  return useMemo(() => ({
    summary: normalizeFleetSummary(swr.data),
    ...swr
  }), [swr]);
}

export async function revalidateFleetData() {
  await Promise.all([
    mutateCache((key) => Array.isArray(key) && String(key[0]).startsWith(fleetAssignmentEndpoints.matrix)),
    mutateCache((key) => Array.isArray(key) && String(key[0]).startsWith(fleetAssignmentEndpoints.summary))
  ]);
}

export function useFleetEquipmentAudit(equipmentId, params = {}, enabled = true) {
  const swr = useFleetGet(
    equipmentId ? fleetAssignmentEndpoints.audit(equipmentId) : null,
    params,
    enabled
  );
  const payload = unwrapFleetResponse(swr.data);
  return {
    audit: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    total: Number(payload?.total ?? 0),
    ...swr
  };
}

export async function updateEquipmentStatus(itemId, status, reason, extra = {}) {
  const response = await axiosServices.post(
    fleetAssignmentEndpoints.status,
    {
      item_id: String(itemId),
      equipment_id: extra.equipment_id ? String(extra.equipment_id) : null,
      status,
      reason: reason || null,
      kegiatan_id: extra.kegiatan_id || null,
      kegiatan_name: extra.kegiatan_name || null,
      material_id: extra.material_id || null,
      material_name: extra.material_name || null,
    },
    onlineConfig
  );
  return unwrapFleetResponse(response.data);
}

export function useFleetKegiatanOptions(params = {}, enabled = true) {
  const swr = useFleetGet(fleetAssignmentEndpoints.kegiatanOptions, params, enabled);
  const payload = unwrapFleetResponse(swr.data);
  return useMemo(() => ({
    options: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    ...swr
  }), [payload, swr]);
}

export function useFleetMaterialOptions(enabled = true) {
  const swr = useFleetGet(fleetAssignmentEndpoints.materialOptions, {}, enabled);
  const payload = unwrapFleetResponse(swr.data);
  return useMemo(() => ({
    options: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    ...swr
  }), [payload, swr]);
}
