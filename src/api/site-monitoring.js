import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher } from 'utils/axios';

export const endpoints = {
  production: '/public/ritase/signage/site-monitoring/production',
  heStatus: '/public/signage/site-monitoring/he-status',
  standbyHeDetail: '/public/signage/site-monitoring/standby-he-detail',
  dumpTruckStatus: '/public/signage/site-monitoring/dump-truck-status',
  standbyDtDetail: '/public/signage/site-monitoring/standby-dt-detail',
  prStatus: '/public/signage/site-monitoring/pr-status',
  poStockStatus: '/public/signage/site-monitoring/po-stock-status',
  penyewa: '/public/penyewa/list',
  shifts: '/public/shift/list'
};

const HRIS_BASE_URL =
  process.env.NEXT_PUBLIC_HRIS_API_URL || process.env.NEXT_APP_HRIS_API_URL || 'https://apihris.makkuragatama.id';

const hrisFetcher = (url) =>
  axios
    .get(`${HRIS_BASE_URL}${url}`, { timeout: 30000, headers: { 'Content-Type': 'application/json' } })
    .then((res) => res.data);

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
  // PR Status sengaja tidak mengikuti filter penyewa/shift header.
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops }).filter(([, value]) => value !== undefined && value !== null && value !== '')
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
  // PO/Stock sengaja tidak mengikuti filter penyewa/shift header.
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops }).filter(([, value]) => value !== undefined && value !== null && value !== '')
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

  return useMemo(
    () => ({
      penyewa: Array.isArray(penyewaData?.rows) ? penyewaData.rows : [],
      shifts: Array.isArray(shiftData?.rows) ? shiftData.rows : [],
      loading: penyewaLoading || shiftsLoading
    }),
    [penyewaData, shiftData, penyewaLoading, shiftsLoading]
  );
};

const MANPOWER_TONES = ['info', 'success', 'warning', 'error', 'primary'];

export const useGetManPowerPerSite = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops }).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = `/api-public/karyawan/total-per-site${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, hrisFetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(() => {
    const rows = data?.rows;
    const items = Array.isArray(rows?.items)
      ? rows.items.map((item, index) => ({
          label: item.site_name || `Site ${item.site_id}`,
          value: Number(item.total || 0),
          tone: MANPOWER_TONES[index % MANPOWER_TONES.length],
          site_id: item.site_id
        }))
      : [];
    const total = Number(rows?.total || 0);

    return {
      manPower: rows
        ? {
            total,
            unit: 'Person',
            siteGroups: items
          }
        : null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    };
  }, [data, isLoading, error, isValidating, mutate]);
};

const ATTENDANCE_TONE_MAP = {
  finger: 'info',
  sakit: 'error',
  izin: 'warning',
  cuti: 'primary',
  tanpa_status: 'error'
};

const ATTENDANCE_DETAIL_MAP = {
  finger: 'Recorded',
  sakit: 'Person',
  izin: 'Person',
  cuti: 'Person',
  tanpa_status: 'Need update'
};

export const useGetDailyAttendance = (params, refreshInterval = 3 * 60 * 1000) => {
  const query = new URLSearchParams(
    Object.entries({ date_ops: params?.date_ops }).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const url = `/api-public/karyawan/daily-attendance${query ? `?${query}` : ''}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, hrisFetcher, {
    refreshInterval,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(() => {
    const rows = data?.rows;
    const liveItems = Array.isArray(rows?.items)
      ? rows.items.map((item) => ({
          label: item.label || item.key,
          value: Number(item.value || 0),
          detail: item.detail || ATTENDANCE_DETAIL_MAP[item.key] || '',
          tone: ATTENDANCE_TONE_MAP[item.key] || 'info',
          key: item.key
        }))
      : [];

    return {
      dailyAttendance: rows ? liveItems : null,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    };
  }, [data, isLoading, error, isValidating, mutate]);
};
