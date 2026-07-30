'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import {
  useAttendanceStatusMix,
  useAttendanceStatusPerCabang,
  useAttendanceTrendPerMonth,
  useAttendanceLateVsHadir
} from 'api/attendance-analytics';
import {
  useGetBreakdownChartPolar,
  useGetBreakdownTrendMonthly,
  useGetBreakdownActiveDurationStack
} from 'api/breakdown-charts';
import {
  useGetStatusDistribution,
  useGetApprovalRate,
  useGetApprovalDuration,
  useGetSpendingPerCabang,
  useGetUsiaBerkas,
  useGetTopPemasok
} from 'api/purchasing-charts';
import {
  useGetPartUsedDailyTrend,
  useGetPartUsedTopValueHe,
  useGetPartUsedTopValueDt,
  useGetPartUsedByCategory,
  useGetPartUsedGudangTopValue
} from 'api/part-used-charts';
import { useGetPengajuanDana, usePengajuanDanaApprovalCount } from 'api/pengajuan-dana';
import { useGetSummaryBreakdown } from 'api/summary-breakdown';

const toQuery = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const q = new URLSearchParams(clean).toString();
  return q ? `?${q}` : '';
};

const useDashboardSWR = (url, options = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    ...options
  });

  return { data, error, isLoading, isValidating, mutate };
};

export const useRitaseSummary = (params = {}) => {
  const url = `/public/ritase/signage/summary${toQuery(params)}`;
  const { data, error, isLoading, isValidating } = useDashboardSWR([url, { skipAuthRedirect: true }], {
    refreshInterval: 30000
  });

  return useMemo(
    () => ({
      data: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );
};

export const useCrewApprovalCount = () => {
  const { data, error, isLoading } = useDashboardSWR('/operation/crew-work-hours/approval-count', {
    refreshInterval: 60000
  });

  return useMemo(
    () => ({
      count: Number(data?.rows?.count ?? data?.count ?? 0),
      loading: isLoading,
      error
    }),
    [data, error, isLoading]
  );
};

export const useCrewOvertimeSummary = (params = {}) => {
  const { data, error, isLoading } = useDashboardSWR(
    `/operation/crew-work-hours/overtime-summary${toQuery(params)}`,
    { refreshInterval: 180000 }
  );

  return useMemo(
    () => ({
      data: data?.rows || null,
      loading: isLoading,
      error
    }),
    [data, error, isLoading]
  );
};

export const useCrewByCabang = (params = {}) => {
  const { data, error, isLoading } = useDashboardSWR(
    `/operation/crew-work-hours/by-cabang${toQuery(params)}`,
    { refreshInterval: 180000 }
  );

  return useMemo(
    () => ({
      data: Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.rows?.data) ? data.rows.data : [],
      loading: isLoading,
      error
    }),
    [data, error, isLoading]
  );
};

/** Aggregate hook for home dashboard sections */
export function useHomeDashboard(filters = {}) {
  const {
    date_ops,
    cabang_id,
    startmonth,
    endmonth,
    start_date,
    end_date
  } = filters;

  const ritaseParams = useMemo(
    () => ({
      date_ops,
      ...(cabang_id ? { cabang_id } : {})
    }),
    [date_ops, cabang_id]
  );

  const attendanceParams = useMemo(
    () => ({
      startmonth,
      endmonth,
      ...(cabang_id ? { cabang_id } : {})
    }),
    [startmonth, endmonth, cabang_id]
  );

  const rangeParams = useMemo(
    () => ({
      ...(cabang_id ? { cabang_id } : {}),
      ...(start_date ? { start_date, start: start_date } : {}),
      ...(end_date ? { end_date, end: end_date } : {})
    }),
    [cabang_id, start_date, end_date]
  );

  const breakdownParams = useMemo(
    () => ({
      ...(cabang_id ? { cabang_id } : {})
    }),
    [cabang_id]
  );

  const summaryBreakdownParams = useMemo(
    () => ({
      page: 1,
      perPage: 5,
      ...(cabang_id ? { cabang_id } : {}),
      ...(start_date ? { date_start: start_date } : {}),
      ...(end_date ? { date_end: end_date } : {})
    }),
    [cabang_id, start_date, end_date]
  );

  const ritase = useRitaseSummary(ritaseParams);
  const polar = useGetBreakdownChartPolar(breakdownParams);
  const trendMonthly = useGetBreakdownTrendMonthly(breakdownParams);
  const activeStack = useGetBreakdownActiveDurationStack(breakdownParams);
  const summaryBreakdown = useGetSummaryBreakdown(summaryBreakdownParams);

  const statusMix = useAttendanceStatusMix(attendanceParams);
  const statusCabang = useAttendanceStatusPerCabang(attendanceParams);
  const trendMonth = useAttendanceTrendPerMonth(attendanceParams);
  const lateHadir = useAttendanceLateVsHadir(attendanceParams);

  const prStatus = useGetStatusDistribution(rangeParams);
  const prApprovalRate = useGetApprovalRate(rangeParams);
  const prApprovalDuration = useGetApprovalDuration(rangeParams);
  const prSpending = useGetSpendingPerCabang(rangeParams);
  const prAging = useGetUsiaBerkas(rangeParams);
  const prTopPemasok = useGetTopPemasok(rangeParams);

  const partTrend = useGetPartUsedDailyTrend(rangeParams);
  const partTopHe = useGetPartUsedTopValueHe({ ...rangeParams, limit: 5 });
  const partTopDt = useGetPartUsedTopValueDt({ ...rangeParams, limit: 5 });
  const partCategory = useGetPartUsedByCategory(rangeParams);
  const partGudang = useGetPartUsedGudangTopValue({ ...rangeParams, limit: 5 });

  const pengajuan = useGetPengajuanDana({ page: 1, limit: 5 });
  const pengajuanApproval = usePengajuanDanaApprovalCount(true);

  const crewApproval = useCrewApprovalCount();
  const crewOvertime = useCrewOvertimeSummary({ start_date, end_date });
  const crewByCabang = useCrewByCabang({ start_date, end_date });

  return {
    filters,
    ritase,
    maintenance: {
      polar,
      trendMonthly,
      activeStack,
      summaryBreakdown
    },
    attendance: {
      statusMix,
      statusCabang,
      trendMonth,
      lateHadir
    },
    purchasing: {
      prStatus,
      prApprovalRate,
      prApprovalDuration,
      prSpending,
      prAging,
      prTopPemasok
    },
    sparepart: {
      partTrend,
      partTopHe,
      partTopDt,
      partCategory,
      partGudang
    },
    finance: {
      pengajuan,
      pengajuanApproval
    },
    crew: {
      crewApproval,
      crewOvertime,
      crewByCabang
    }
  };
}
