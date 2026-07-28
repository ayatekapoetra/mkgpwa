import useSWR from 'swr';
import { useMemo } from 'react';

import axiosServices, { fetcher } from 'utils/axios';

const endpoints = {
  key: '/pengajuan-dana',
  approvalCount: '/pengajuan-dana/approval-count',
  export: '/pengajuan-dana/export',
  coas: '/pengajuan-dana/options/coas',
  detail: (id) => `/pengajuan-dana/${id}`,
  permissions: (id) => `/pengajuan-dana/${id}/permissions`,
  approve: (id) => `/pengajuan-dana/${id}/approve`,
  reject: (id) => `/pengajuan-dana/${id}/reject`,
  return: (id) => `/pengajuan-dana/${id}/return`,
  verify: (id) => `/pengajuan-dana/${id}/verify`,
  destroy: (id) => `/pengajuan-dana/${id}`,
  destroyItem: (id, itemId) => `/pengajuan-dana/${id}/items/${itemId}`
};

const toQueryString = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const query = new URLSearchParams(clean).toString();
  return query ? `?${query}` : '';
};

const normalizeList = (payload, params = {}) => {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.pagination || {};

  return {
    rows,
    page: Number(pagination.page || params.page || 1),
    perPage: Number(pagination.perPage || params.limit || 25),
    total: Number(pagination.total || rows.length || 0),
    lastPage: Number(pagination.lastPage || 1),
    summary: payload?.summary || {
      total_all: 0,
      open: 0,
      approval: 0,
      verified: 0,
      rejected: 0
    }
  };
};

export const useGetPengajuanDana = (params = {}) => {
  const url = `${endpoints.key}${toQueryString(params)}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(() => {
    const normalized = normalizeList(data, params);
    return {
      rows: normalized.rows,
      page: normalized.page,
      perPage: normalized.perPage,
      total: normalized.total,
      lastPage: normalized.lastPage,
      summary: normalized.summary,
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate, params]);
};

export const useShowPengajuanDana = (id) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(id ? endpoints.detail(id) : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      row: data?.data || null,
      rowLoading: isLoading,
      rowError: error,
      rowValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const usePengajuanDanaPermissions = (id) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(id ? endpoints.permissions(id) : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      permissions: data?.data?.permissions || {
        can_approve: false,
        can_verify: false,
        can_reject: false,
        can_return: false
      },
      status: data?.data?.status || '',
      userRole: data?.data?.user_role || '',
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const usePengajuanDanaApprovalCount = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(endpoints.approvalCount, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      count: Number(data?.count || 0),
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const usePengajuanDanaCoas = (params = {}) => {
  const url = `${endpoints.coas}${toQueryString(params)}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      rows: Array.isArray(data?.data) ? data.data : [],
      loading: isLoading,
      error,
      validating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

const createOptionHook = (urlBuilder) => {
  return (params = {}) => {
    const url = urlBuilder(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    });

    return useMemo(
      () => ({
        rows: Array.isArray(data?.data) ? data.data : [],
        loading: isLoading,
        error,
        validating: isValidating,
        mutate
      }),
      [data, error, isLoading, isValidating, mutate]
    );
  };
};

export const usePengajuanDanaPemasoks = createOptionHook((params) => `${endpoints.key}/options/pemasoks${toQueryString(params)}`);
export const usePengajuanDanaKaryawans = createOptionHook((params) => `${endpoints.key}/options/karyawans${toQueryString(params)}`);
export const usePengajuanDanaBarangs = createOptionHook((params) => `${endpoints.key}/options/barangs${toQueryString(params)}`);
export const usePengajuanDanaGudangs = createOptionHook((params) => `${endpoints.key}/options/gudangs${toQueryString(params)}`);
export const usePengajuanDanaBanks = createOptionHook((params) => `${endpoints.key}/options/banks${toQueryString(params)}`);
export const usePengajuanDanaSatuans = createOptionHook((params) => `${endpoints.key}/options/satuans${toQueryString(params)}`);

const buildMultipartPayload = (payload) => {
  const formData = new FormData();
  const { lampiran = [], ...jsonPayload } = payload || {};

  formData.append('json', JSON.stringify(jsonPayload));

  const files = Array.isArray(lampiran) ? lampiran : lampiran ? [lampiran] : [];
  files.forEach((file) => {
    if (file instanceof File) {
      formData.append('lampiran', file);
    }
  });

  return formData;
};

export const createPengajuanDana = async (payload) => {
  const formData = buildMultipartPayload(payload);
  const response = await axiosServices.post(endpoints.key, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipOfflineQueue: true
  });
  return response.data;
};

export const updatePengajuanDana = async (id, payload) => {
  const formData = buildMultipartPayload(payload);
  const response = await axiosServices.put(endpoints.detail(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipOfflineQueue: true
  });
  return response.data;
};

export const approvePengajuanDana = async (id, payload = {}) => {
  const response = await axiosServices.post(endpoints.approve(id), payload, { skipOfflineQueue: true });
  return response.data;
};

export const rejectPengajuanDana = async (id, payload) => {
  const response = await axiosServices.post(endpoints.reject(id), payload, { skipOfflineQueue: true });
  return response.data;
};

export const returnPengajuanDana = async (id, payload) => {
  const response = await axiosServices.post(endpoints.return(id), payload, { skipOfflineQueue: true });
  return response.data;
};

export const verifyPengajuanDana = async (id, payload = {}) => {
  const response = await axiosServices.post(endpoints.verify(id), payload, { skipOfflineQueue: true });
  return response.data;
};

export const deletePengajuanDana = async (id) => {
  const response = await axiosServices.delete(endpoints.destroy(id), { skipOfflineQueue: true });
  return response.data;
};

export const deletePengajuanDanaItem = async (id, itemId) => {
  const response = await axiosServices.delete(endpoints.destroyItem(id, itemId), { skipOfflineQueue: true });
  return response.data;
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

export const exportPengajuanDanaExcel = async (params = {}) => {
  const url = `${endpoints.export}${toQueryString(params)}`;

  try {
    const response = await axiosServices.get(url, {
      responseType: 'blob',
      timeout: 300000,
      skipOfflineQueue: true
    });

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers?.['content-disposition'], 'pengajuan-dana.xlsx')
    };
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text();

      try {
        const payload = JSON.parse(text);
        throw new Error(payload?.message || payload?.diagnostic?.message || 'Gagal export pengajuan non part');
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== text) throw parseError;
        throw new Error(text || error.message || 'Gagal export pengajuan non part');
      }
    }

    throw error;
  }
};
