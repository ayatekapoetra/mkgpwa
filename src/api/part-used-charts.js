import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  topFrequencyHe: '/maintenance/signages/part-used/top-frequency-he',
  topFrequencyDt: '/maintenance/signages/part-used/top-frequency-dt',
  topValueHe: '/maintenance/signages/part-used/top-value-he',
  topValueDt: '/maintenance/signages/part-used/top-value-dt',
  dailyTrend: '/maintenance/signages/part-used/daily-trend',
  byUnit: '/maintenance/signages/part-used/by-unit',
  byCategory: '/maintenance/signages/part-used/by-category',
  gudangTopValue: '/maintenance/signages/part-used/gudang-top-value',
  gudangTopFrequency: '/maintenance/signages/part-used/gudang-top-frequency',
  gudangDailyTrend: '/maintenance/signages/part-used/gudang-daily-trend',
  gudangHeatmapCategory: '/maintenance/signages/part-used/gudang-heatmap-category',
  gudangTopSparepart: '/maintenance/signages/part-used/gudang-top-sparepart',
  cabangBubbleAll: '/maintenance/signages/part-used/cabang-bubble-all',
  cabangBubbleByUnit: '/maintenance/signages/part-used/cabang-bubble-by-unit',
  cabangBubbleByCtgUnit: '/maintenance/signages/part-used/cabang-bubble-by-ctgunit',
  cabangDtBar: '/maintenance/signages/part-used/cabang-dt-bar',
  cabangHeBar: '/maintenance/signages/part-used/cabang-he-bar',
  gudangRadarNullKdunit: '/maintenance/signages/part-used/gudang-radar-null-kdunit'
};

const usePartUsedChart = (endpoint, params, refreshInterval = 180000) => {
  const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.data || [],
      meta: data?.meta || null,
      average: data?.meta?.average || null,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, isLoading, error, isValidating]
  );
};

export const useGetPartUsedTopFrequencyHe = (params) => usePartUsedChart(endpoints.topFrequencyHe, params);
export const useGetPartUsedTopFrequencyDt = (params) => usePartUsedChart(endpoints.topFrequencyDt, params);
export const useGetPartUsedTopValueHe = (params) => usePartUsedChart(endpoints.topValueHe, params);
export const useGetPartUsedTopValueDt = (params) => usePartUsedChart(endpoints.topValueDt, params);
export const useGetPartUsedDailyTrend = (params) => usePartUsedChart(endpoints.dailyTrend, params, 30000);
export const useGetPartUsedByUnit = (params) => usePartUsedChart(endpoints.byUnit, params);
export const useGetPartUsedByCategory = (params) => usePartUsedChart(endpoints.byCategory, params);
export const useGetPartUsedGudangTopValue = (params) => usePartUsedChart(endpoints.gudangTopValue, params);
export const useGetPartUsedGudangTopFrequency = (params) => usePartUsedChart(endpoints.gudangTopFrequency, params);
export const useGetPartUsedGudangDailyTrend = (params) => usePartUsedChart(endpoints.gudangDailyTrend, params, 30000);
export const useGetPartUsedGudangHeatmapCategory = (params) => usePartUsedChart(endpoints.gudangHeatmapCategory, params);
export const useGetPartUsedGudangTopSparepart = (params) => usePartUsedChart(endpoints.gudangTopSparepart, params);
export const useGetPartUsedCabangBubbleAll = (params) => usePartUsedChart(endpoints.cabangBubbleAll, params);
export const useGetPartUsedCabangBubbleByUnit = (params) => usePartUsedChart(endpoints.cabangBubbleByUnit, params);
export const useGetPartUsedCabangBubbleByCtgUnit = (params) => usePartUsedChart(endpoints.cabangBubbleByCtgUnit, params);
export const useGetPartUsedCabangDtBar = (params) => usePartUsedChart(endpoints.cabangDtBar, params);
export const useGetPartUsedCabangHeBar = (params) => usePartUsedChart(endpoints.cabangHeBar, params);
export const useGetPartUsedGudangRadarNullKdunit = (params) => usePartUsedChart(endpoints.gudangRadarNullKdunit, params);
