import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  production: '/public/ritase/signage/site-monitoring/production',
  heStatus: '/public/signage/site-monitoring/he-status',
  standbyHeDetail: '/public/signage/site-monitoring/standby-he-detail',
  dumpTruckStatus: '/public/signage/site-monitoring/dump-truck-status',
  standbyDtDetail: '/public/signage/site-monitoring/standby-dt-detail',
  prStatus: '/public/signage/site-monitoring/pr-status',
  poStockStatus: '/public/signage/site-monitoring/po-stock-status',
  manPower: '/public/signage/site-monitoring/man-power',
  dailyAttendance: '/public/signage/site-monitoring/daily-attendance',
  penyewa: '/public/penyewa/list',
  shifts: '/public/shift/list',
  cabang: '/public/cabang/list'
};

export const useGetSiteMonitoringProduction = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = query ? `${endpoints.production}?${query}` : endpoints.production;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      production: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringHeStatus = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = query ? `${endpoints.heStatus}?${query}` : endpoints.heStatus;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      heStatus: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringStandbyHeDetail = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = query ? `${endpoints.standbyHeDetail}?${query}` : endpoints.standbyHeDetail;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      standbyHeDetail: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringDumpTruckStatus = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = query ? `${endpoints.dumpTruckStatus}?${query}` : endpoints.dumpTruckStatus;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      dumpTruckStatus: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringStandbyDtDetail = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = query ? `${endpoints.standbyDtDetail}?${query}` : endpoints.standbyDtDetail;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      standbyDtDetail: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringPrStatus = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops, cabang_id: params?.cabang_id }).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ).toString();
  const url = query ? `${endpoints.prStatus}?${query}` : endpoints.prStatus;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      prStatus: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringPoStockStatus = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops, cabang_id: params?.cabang_id }).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ).toString();
  const url = query ? `${endpoints.poStockStatus}?${query}` : endpoints.poStockStatus;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      poStockStatus: data?.rows || null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export const useGetSiteMonitoringFilterOptions = () => {
  const swrOptions = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  };
  const { data: penyewaData, isLoading: penyewaLoading } = useSWR([endpoints.penyewa, { skipAuthRedirect: true }], fetcher, swrOptions);
  const { data: shiftData, isLoading: shiftsLoading } = useSWR([endpoints.shifts, { skipAuthRedirect: true }], fetcher, swrOptions);
  const { data: cabangData, isLoading: cabangLoading } = useSWR([endpoints.cabang, { skipAuthRedirect: true }], fetcher, swrOptions);

  return useMemo(
    () => ({
      penyewa: Array.isArray(penyewaData?.rows) ? penyewaData.rows : [],
      shifts: Array.isArray(shiftData?.rows) ? shiftData.rows : [],
      cabang: Array.isArray(cabangData?.rows) ? cabangData.rows : [],
      loading: penyewaLoading || shiftsLoading || cabangLoading
    }),
    [penyewaData, shiftData, cabangData, penyewaLoading, shiftsLoading, cabangLoading]
  );
};

export const useGetManPowerPerSite = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops, cabang_id: params?.cabang_id }).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ).toString();
  const url = query ? `${endpoints.manPower}?${query}` : endpoints.manPower;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(() => {
    const rows = data?.rows;
    return {
      manPower: rows
        ? {
            total: Number(rows.total || 0),
            unit: rows.unit || 'Person',
            siteGroups: Array.isArray(rows.siteGroups) ? rows.siteGroups : []
          }
        : null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    };
  }, [data, isLoading, error, isValidating, mutate]);
};

export const useGetDailyAttendance = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops, cabang_id: params?.cabang_id }).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ).toString();
  const url = query ? `${endpoints.dailyAttendance}?${query}` : endpoints.dailyAttendance;
  const { data, isLoading, error, isValidating, mutate } = useSWR([url, { skipAuthRedirect: true }], fetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(() => {
    const rows = data?.rows;
    return {
      dailyAttendance: rows ? (Array.isArray(rows.items) ? rows.items : []) : null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    };
  }, [data, isLoading, error, isValidating, mutate]);
};
