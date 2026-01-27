'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/monitoring/signages/attendances',
  baseData: '/base-data',
  statusPerCabang: '/status-per-cabang',
  trendPerMonth: '/trend-per-month',
  onTimeArea: '/on-time-area',
  lateVsHadir: '/late-vs-hadir',
  izinCutiSakit: '/izin-cuti-sakit',
  topKaryawan: '/top-karyawan',
  topAlpha: '/top-alpha',
  avgHadirCabang: '/avg-hadir-cabang',
  statusMix: '/status-mix',
  totalMarkedCabang: '/total-marked-cabang'
};

export const useGetAttendanceBaseData = (params) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${endpoints.key}${endpoints.baseData}${query}`;

  const { data, error, isLoading, mutate, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoized = useMemo(
    () => ({
      data: data?.rows || data?.data || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataMutate: mutate,
      dataEmpty: !isLoading && !((data?.rows || data?.data || data) || []).length
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoized;
};

const createHook = (path, mapFn) => (params) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${endpoints.key}${path}${query}`;
  const { data, error, isLoading, mutate, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });
  const mapped = mapFn ? mapFn(data) : data;
  return {
    data: mapped,
    dataLoading: isLoading,
    dataError: error,
    dataValidating: isValidating,
    dataMutate: mutate,
    dataEmpty: !isLoading && !(mapped && ((Array.isArray(mapped) && mapped.length) || (!Array.isArray(mapped) && Object.keys(mapped || {}).length)))
  };
};

export const useAttendanceStatusPerCabang = createHook(endpoints.statusPerCabang, (d) => d?.rows?.summaryByCabang || d?.rows || d);
export const useAttendanceTrendPerMonth = createHook(endpoints.trendPerMonth, (d) => d?.rows?.trendByMonth || d?.rows || d);
export const useAttendanceOnTimeArea = createHook(endpoints.onTimeArea, (d) => d?.rows?.onTimeByArea || d?.rows?.onTimeArea || d?.rows || d);
export const useAttendanceLateVsHadir = createHook(endpoints.lateVsHadir, (d) => d?.rows?.data || d?.rows || d);
export const useAttendanceIzinCutiSakit = createHook(endpoints.izinCutiSakit, (d) => d?.rows?.data || d?.rows || d);
export const useAttendanceTopKaryawan = createHook(endpoints.topKaryawan, (d) => d?.rows?.data || d?.rows || d);
export const useAttendanceTopAlpha = createHook(endpoints.topAlpha, (d) => d?.rows?.data || d?.rows || d);
export const useAttendanceAvgHadirCabang = createHook(endpoints.avgHadirCabang, (d) => d?.rows?.data || d?.rows || d);
export const useAttendanceStatusMix = createHook(endpoints.statusMix, (d) => d?.rows?.aggregate || d?.rows || d);
export const useAttendanceTotalMarkedCabang = createHook(endpoints.totalMarkedCabang, (d) => d?.rows?.data || d?.rows || d);
