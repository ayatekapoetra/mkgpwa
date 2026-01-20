import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  chart: '/maintenance/signages/breakdown/chart',
  chartPolar: '/maintenance/signages/breakdown/chart-polar',
  chartLineDuration: '/maintenance/signages/breakdown/chart-line-duration-breakdown',
  breakdownTrendMonthly: '/maintenance/signages/breakdown/breakdown-trend-monthly',
  repairTimeDistribution: '/maintenance/signages/breakdown/repair-time-distribution',
  equipmentPerformanceMatrix: '/maintenance/signages/breakdown/equipment-performance-matrix'
};

export const useGetBreakdownCharts = (params) => {
  const url = params ? endpoints.chart + `?${new URLSearchParams(params)}` : endpoints.chart;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      data: data?.rows,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

export const useGetBreakdownChartPolar = (params) => {
  const url = params ? endpoints.chartPolar + `?${new URLSearchParams(params)}` : endpoints.chartPolar;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      data: data || [],
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

export const useGetBreakdownChartLineDuration = (params) => {
  const url = params ? endpoints.chartLineDuration + `?${new URLSearchParams(params)}` : endpoints.chartLineDuration;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      data: data || null,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

export const useGetBreakdownTrendMonthly = (params) => {
  const url = params ? endpoints.breakdownTrendMonthly + `?${new URLSearchParams(params)}` : endpoints.breakdownTrendMonthly;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      data: data || null, // Return full data object, not just rows
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

export const useGetRepairTimeDistribution = (params) => {
  const url = params ? endpoints.repairTimeDistribution + `?${new URLSearchParams(params)}` : endpoints.repairTimeDistribution;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      data: data || null, // Return full data object, not just rows
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};

export const useGetEquipmentPerformanceMatrix = (params) => {
  const url = params ? endpoints.equipmentPerformanceMatrix + `?${new URLSearchParams(params)}` : endpoints.equipmentPerformanceMatrix;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      data: data || null, // Return full data object, not just rows
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );

  return memoized;
};
