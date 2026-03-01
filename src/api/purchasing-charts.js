import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  trend: '/monitoring/signages/purchasing/trend',
  topBarang: '/monitoring/signages/purchasing/top-barang',
  prioritasDistribution: '/monitoring/signages/purchasing/prioritas-distribution',
  approvalDuration: '/monitoring/signages/purchasing/approval-duration',
  qtyComparison: '/monitoring/signages/purchasing/qty-comparison',
  spendingPerCabang: '/monitoring/signages/purchasing/spending-per-cabang',
  topPemasok: '/monitoring/signages/purchasing/top-pemasok',
  equipmentSpending: '/monitoring/signages/purchasing/equipment-spending',
  approvalRate: '/monitoring/signages/purchasing/approval-rate',
  metodeDistribution: '/monitoring/signages/purchasing/metode-distribution',
  statusDistribution: '/monitoring/signages/purchasing/status-distribution',
  topPrCreators: '/monitoring/signages/purchasing/top-pr-creators',
  prApprovalTrend: '/monitoring/signages/purchasing/pr-approval-trend',
  usiaBerkas: '/monitoring/signages/purchasing/usia-berkas'
};

// Debug helper
const logError = (endpoint, error, data) => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    if (error) {
      console.error(`❌ API Error [${endpoint}]:`, error);
    }
    if (data) {
      console.log(`✅ API Success [${endpoint}]:`, data);
    }
  }
};

// 1. Purchase Trend
export const useGetPurchaseTrend = (params) => {
  const url = params ? endpoints.trend + `?${new URLSearchParams(params)}` : endpoints.trend;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Log errors
  if (error) logError('Trend', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      meta: data?.meta || null,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 2. Top Barang
export const useGetTopBarang = (params) => {
  const url = params ? endpoints.topBarang + `?${new URLSearchParams(params)}` : endpoints.topBarang;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Top Barang', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 3. Prioritas Distribution
export const useGetPrioritasDistribution = (params) => {
  const url = params ? endpoints.prioritasDistribution + `?${new URLSearchParams(params)}` : endpoints.prioritasDistribution;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Prioritas Distribution', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 4. Approval Duration
export const useGetApprovalDuration = (params) => {
  const url = params ? endpoints.approvalDuration + `?${new URLSearchParams(params)}` : endpoints.approvalDuration;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Approval Duration', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 5. Qty Comparison
export const useGetQtyComparison = (params) => {
  const url = params ? endpoints.qtyComparison + `?${new URLSearchParams(params)}` : endpoints.qtyComparison;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Qty Comparison', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 6. Spending per Cabang
export const useGetSpendingPerCabang = (params) => {
  const url = params ? endpoints.spendingPerCabang + `?${new URLSearchParams(params)}` : endpoints.spendingPerCabang;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Spending per Cabang', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 7. Top Pemasok
export const useGetTopPemasok = (params) => {
  const url = params ? endpoints.topPemasok + `?${new URLSearchParams(params)}` : endpoints.topPemasok;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Top Pemasok', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 8. Equipment Spending
export const useGetEquipmentSpending = (params) => {
  const url = params ? endpoints.equipmentSpending + `?${new URLSearchParams(params)}` : endpoints.equipmentSpending;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Equipment Spending', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 9. Approval Rate
export const useGetApprovalRate = (params) => {
  const url = params ? endpoints.approvalRate + `?${new URLSearchParams(params)}` : endpoints.approvalRate;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Approval Rate', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 11. Status Distribution
export const useGetStatusDistribution = (params) => {
  const url = params ? endpoints.statusDistribution + `?${new URLSearchParams(params)}` : endpoints.statusDistribution;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Status Distribution', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      summary: data?.summary || null,
      meta: data?.meta || null,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 10. Metode Distribution
export const useGetMetodeDistribution = (params) => {
  const url = params ? endpoints.metodeDistribution + `?${new URLSearchParams(params)}` : endpoints.metodeDistribution;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Metode Distribution', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 12. Top 10 PR Creators
export const useGetTopPrCreators = (params) => {
  const url = params ? endpoints.topPrCreators + `?${new URLSearchParams(params)}` : endpoints.topPrCreators;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Top PR Creators', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      users: data?.users || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 13. PR Checked Trend
export const useGetPrCheckedTrend = (params) => {
  const url = params ? endpoints.prApprovalTrend + `?${new URLSearchParams(params)}` : endpoints.prApprovalTrend;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('PR Checked Trend', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

// 14. Usia Berkas
export const useGetUsiaBerkas = (params) => {
  const url = params ? endpoints.usiaBerkas + `?${new URLSearchParams(params)}` : endpoints.usiaBerkas;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) logError('Usia Berkas', error, data);

  const memoized = useMemo(
    () => ({
      data: data?.data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};
