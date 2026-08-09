import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

export const endpoints = {
  key: '/operation/timesheet',
  list: '/list',
  show: '/show',
  exportAlatBerat: '/alat-berat/export-excel',
  exportDumptruck: '/dumptruck/export-excel',
  exportAll: '/all/export-excel',
  exportEvaluasi: '/evaluasi/export-excel',
  access: '/setting/akses-menu/list'
};

const TIMESHEET_SUBMENU_URL = '/timesheet';

const DENIED_PERMISSIONS = {
  can_read: false,
  can_insert: false,
  can_update: false,
  can_remove: false,
  can_approve: false,
  can_reject: false
};

const isPermissionEnabled = (value) =>
  value === true || value === 1 || ['1', 'Y', 'TRUE'].includes(String(value || '').trim().toUpperCase());

const extractAccessRows = (payload) => {
  if (Array.isArray(payload?.rows?.data)) return payload.rows.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const findTimesheetAccessRow = (rows = []) =>
  rows.find((row) => {
    const url = String(row?.submenu?.url || row?.url || '').trim();
    return url === TIMESHEET_SUBMENU_URL;
  }) || null;

const permissionsFromAccessRow = (row) => {
  const canApprove = isPermissionEnabled(row?.approve);
  return {
    can_read: isPermissionEnabled(row?.read),
    can_insert: isPermissionEnabled(row?.insert),
    can_update: isPermissionEnabled(row?.update),
    can_remove: isPermissionEnabled(row?.remove),
    can_approve: canApprove,
    can_reject: canApprove
  };
};

export const useTimesheetAccess = (userId, usertype) => {
  const isDeveloper = String(usertype || '').toLowerCase() === 'developer';
  const url =
    userId && !isDeveloper
      ? `${endpoints.access}?${new URLSearchParams({ user_id: userId, perPages: 100 })}`
      : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(() => {
    if (isDeveloper) {
      return {
        permissions: {
          can_read: true,
          can_insert: true,
          can_update: true,
          can_remove: true,
          can_approve: true,
          can_reject: true
        },
        loading: false,
        error: null,
        validating: false
      };
    }

    if (!userId) {
      return {
        permissions: DENIED_PERMISSIONS,
        loading: false,
        error: null,
        validating: false
      };
    }

    const accessRow = findTimesheetAccessRow(extractAccessRows(data));
    return {
      permissions: accessRow ? permissionsFromAccessRow(accessRow) : DENIED_PERMISSIONS,
      loading: isLoading,
      error,
      validating: isValidating
    };
  }, [data, error, isDeveloper, isLoading, isValidating, userId]);
};

/**
 * PARAMS
 * contoh data object
 * { type: 'DT' } atau { type: 'HE' }
 * **/

export const useGetDailyTimesheet = (params) => {
  const url = params ? endpoints.key + endpoints.list + `?${new URLSearchParams(params)}` : endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data?.rows || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data?.rows || data?.rows || data)?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useShowDailyTimesheet = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data || data?.rows || data)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetDTDailyTimesheet = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}` + endpoints.show, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data || data?.rows || data)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetHEDailyTimesheet = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}` + endpoints.show, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data?.rows || data?.rows || data,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.data?.rows || data?.rows || data)
    }),
    [data, error, isLoading, isValidating]
  );
  
  return memoizedValue;
};

export const exportTimesheetHeavyEquipment = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportAlatBerat + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportAlatBerat;

  return downloadTimesheetFile(url, 'Timesheet_HE.xlsx');
};

export const exportTimesheetDumptruck = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportDumptruck + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportDumptruck;

  return downloadTimesheetFile(url, 'Timesheet_DT.xlsx');
};

export const exportTimesheetAll = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportAll + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportAll;

  return downloadTimesheetFile(url, 'Timesheet_All.xlsx');
};

export const exportTimesheetEvaluasi = async (params) => {
  const url = params 
    ? endpoints.key + endpoints.exportEvaluasi + `?${new URLSearchParams(params)}`
    : endpoints.key + endpoints.exportEvaluasi;

  return downloadTimesheetFile(url, 'Timesheet_Evaluasi.xlsx');
};

const downloadTimesheetFile = async (url, fallbackFilename) => {
  try {
    const response = await axiosServices.get(url, {
      responseType: 'blob',
      timeout: 300000
    });

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers?.['content-disposition'], fallbackFilename)
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text();

      try {
        const payload = JSON.parse(text);
        const message = payload?.diagnostic?.message || payload?.message || 'Gagal download Excel';
        const nextError = new Error(message);
        nextError.response = { data: payload };
        throw nextError;
      } catch {
        throw new Error(text || error.message || 'Gagal download Excel');
      }
    }

    throw error;
  }
};

const getFilenameFromDisposition = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
};
