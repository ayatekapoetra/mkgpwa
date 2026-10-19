'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import { buildHomeDashboardRequests } from './home-dashboard-config';

const useDashboardSWR = (key, refreshInterval = 180000) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });
  return { data, error, loading: isLoading, validating: isValidating, mutate };
};

/** Fetch only the resources shown in the eight home KPIs. */
export function useHomeDashboard(filters = {}) {
  const requests = useMemo(() => buildHomeDashboardRequests(filters), [filters]);
  const ritase = useDashboardSWR([requests.ritase, { skipAuthRedirect: true }], 30000);
  const polar = useDashboardSWR(requests.polar);
  const trendMonthly = useDashboardSWR(requests.trendMonthly);
  const prAging = useDashboardSWR(requests.prAging);
  const payments = useDashboardSWR([requests.payments, { skipAuthRedirect: true, skipOfflineQueue: true }], 60000);
  const partTopHe = useDashboardSWR(requests.partTopHe);
  const partTopDt = useDashboardSWR(requests.partTopDt);
  const partTopMd = useDashboardSWR(requests.partTopMd);
  const partTopAd = useDashboardSWR(requests.partTopAd);
  const resources = [ritase, polar, trendMonthly, prAging, payments, partTopHe, partTopDt, partTopMd, partTopAd];
  const partResource = (resource) => ({ ...resource, data: resource.data?.data || [] });

  return {
    refresh: async () => {
      const results = await Promise.allSettled(resources.map((resource) => resource.mutate()));
      return results.every((result) => result.status === 'fulfilled');
    },
    ritase: { ...ritase, data: ritase.data?.rows || null },
    maintenance: {
      polar: { ...polar, data: polar.data || [] },
      trendMonthly: { ...trendMonthly, data: trendMonthly.data?.rows || trendMonthly.data || null }
    },
    purchasing: { prAging: { ...prAging, data: prAging.data?.data || [], meta: prAging.data?.meta } },
    finance: { payments: { ...payments, summary: payments.data?.rows || null } },
    sparepart: {
      partTopHe: partResource(partTopHe),
      partTopDt: partResource(partTopDt),
      partTopMd: partResource(partTopMd),
      partTopAd: partResource(partTopAd)
    }
  };
}
