import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import { endpoints, buildPartUsedChartUrl, buildCategoryRequests } from './part-used-chart-config';

export { endpoints } from './part-used-chart-config';

const usePartUsedChart = (endpoint, params, refreshInterval = 180000) => {
  const url = buildPartUsedChartUrl(endpoint, params);
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

export function useGetPartUsedEquipmentCategory(code, params, unitcabang) {
  const requests = useMemo(() => buildCategoryRequests(code, params, unitcabang), [code, params, unitcabang]);
  const topFrequency = usePartUsedChart(requests.topFrequency.endpoint, requests.topFrequency.params);
  const topValue = usePartUsedChart(requests.topValue.endpoint, requests.topValue.params);
  const byUnit = usePartUsedChart(requests.byUnit.endpoint, requests.byUnit.params);
  const byCategory = usePartUsedChart(requests.byCategory.endpoint, requests.byCategory.params);
  const cabang = usePartUsedChart(requests.cabang.endpoint, requests.cabang.params);
  const equipmentByCabang = usePartUsedChart(requests.equipmentByCabang.endpoint, requests.equipmentByCabang.params);
  return useMemo(() => ({ code, requests, topFrequency, topValue, byUnit, byCategory, cabang, equipmentByCabang }),
    [code, requests, topFrequency, topValue, byUnit, byCategory, cabang, equipmentByCabang]);
}

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
