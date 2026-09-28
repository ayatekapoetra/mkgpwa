import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { fetcher } from 'utils/axios';

export const operatorDriverMonitoringEndpoints = {
  index: '/operation/operator-driver-monitoring'
};

const onlineConfig = { skipOfflineQueue: true };

const compactParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const unwrapResponse = (value) => value?.rows ?? value?.data?.rows ?? value?.data ?? value ?? null;

const makeQuery = (endpoint, params) => {
  const query = new URLSearchParams(compactParams(params)).toString();
  return `${endpoint}${query ? `?${query}` : ''}`;
};

const useOnlinePolling = (enabled, pollingInterval = 15000) => {
  const [interval, setIntervalValue] = useState(pollingInterval);
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    const update = () => setIntervalValue(document.hidden ? Math.max(60000, pollingInterval) : pollingInterval);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [enabled, pollingInterval]);
  return enabled ? interval : 0;
};

const useMonitoringGet = (endpoint, params, enabled = true, polling = false) => {
  const url = enabled && endpoint ? makeQuery(endpoint, params) : null;
  const pollingInterval = typeof polling === 'number' ? polling : 15000;
  const refreshInterval = useOnlinePolling(Boolean(url && polling), pollingInterval);
  return useSWR(url ? [url, onlineConfig] : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval
  });
};

export const normalizeOperatorDriverMonitoring = (value) => {
  const payload = unwrapResponse(value) || {};
  const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
  const summary = payload.summary || {};
  return {
    data,
    summary: {
      beroperasi: Number(summary.beroperasi ?? 0),
      standby: Number(summary.standby ?? 0),
      breakdown: Number(summary.breakdown ?? 0),
      nostatus: Number(summary.nostatus ?? 0),
      total: Number(summary.total ?? data.length)
    },
    total: Number(payload.total ?? data.length)
  };
};

export const operatorDriverErrorMessage = (error, fallback = 'Permintaan Operator Driver Monitoring gagal.') =>
  error?.diagnostic?.message || error?.response?.data?.diagnostic?.message || error?.message || fallback;

export function useOperatorDriverMonitoring(params = {}, enabled = true, pollingInterval = 15000) {
  const swr = useMonitoringGet(operatorDriverMonitoringEndpoints.index, params, enabled, pollingInterval);
  return useMemo(() => ({
    monitoring: normalizeOperatorDriverMonitoring(swr.data),
    ...swr
  }), [swr]);
}