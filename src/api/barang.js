import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import axiosServices, { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';
import useUser from 'hooks/useUser';

export const endpoints = {
  key: '/master/barang',
  list: '/list',
  test: 'http://localhost:3003/test/barang/list' // Temporary test endpoint with full URL
};

export const useGetBarang = (params) => {
  const query = params
    ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
    : null;
  const queryString = query?.toString();
  const url = queryString ? `${endpoints.key}/list?${queryString}` : `${endpoints.key}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    keepPreviousData: true
  });

  useOfflineStorage('barang', 'barang', data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading && !data,
      dataError: error,
      dataEmpty: !isLoading && !data?.rows?.length,
      pagination: {
        page: Number(data?.page) || 1,
        perPage: Number(data?.perPage) || Number(params?.perPages) || 30,
        lastPage: Number(data?.lastPage) || 1,
        total: Number(data?.total) || 0
      }
    }),
    [data, error, isLoading, params?.perPages]
  );

  return memoizedValue;
};

export const useBarangFilterOptions = (enabled = true) => {
  const { data, error, isLoading } = useSWR(enabled ? `${endpoints.key}/options` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return {
    options: data?.rows || {},
    optionsLoading: isLoading,
    optionsError: error
  };
};

export const useShowBarang = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(id ? `${endpoints.key}/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || {},
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

// Temporary test hook without authentication
export const useGetBarangTest = (params) => {
  const url = params ? `${endpoints.test}?${new URLSearchParams(params)}` : endpoints.test;

  const { data, error, isLoading } = useSWR(url, async (url) => {
    console.log('Fetching from URL:', url);
    const response = await fetch(url);
    const result = await response.json();
    console.log('Raw API response:', result);
    return result;
  }, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onSuccess: (data) => {
      console.log('Barang Test API Success:', data);
    },
    onError: (error) => {
      console.log('Barang Test API Error:', error);
    }
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !data?.rows?.length
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};

export const previewKodeBarang = async (params) => {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const response = await axiosServices.get(`/api/master/barang/preview-kode?${query.toString()}`);
  return response.data?.rows?.kode || '';
};

const OVERRIDE_ROLES = ['administrator', 'developer', 'superadmin', 'super-admin', 'admin'];

export const useBarangAccess = () => {
  const user = useUser();
  const { data, error, isLoading } = useSWR(`${endpoints.key}/access`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false
  });

  return useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    const isOverride = OVERRIDE_ROLES.includes(role);

    const apiPermissions = data?.rows || data?.permissions || data?.data || {};

    const normalizePerm = (val) => {
      if (val === true || val === 1) return true;
      if (val === false || val === 0) return false;
      const s = String(val || '').trim().toUpperCase();
      return ['Y', '1', 'TRUE'].includes(s);
    };

    const hasApiUpdate =
      apiPermissions.can_update !== undefined
        ? normalizePerm(apiPermissions.can_update)
        : apiPermissions.update !== undefined
        ? normalizePerm(apiPermissions.update)
        : null;

    const hasApiInsert =
      apiPermissions.can_insert !== undefined
        ? normalizePerm(apiPermissions.can_insert)
        : apiPermissions.insert !== undefined
        ? normalizePerm(apiPermissions.insert)
        : null;

    const hasApiRemove =
      apiPermissions.can_remove !== undefined
        ? normalizePerm(apiPermissions.can_remove)
        : apiPermissions.remove !== undefined
        ? normalizePerm(apiPermissions.remove)
        : null;

    const can_update = isOverride ? true : hasApiUpdate !== null ? hasApiUpdate : false;
    const can_insert = isOverride ? true : hasApiInsert !== null ? hasApiInsert : false;
    const can_remove = isOverride ? true : hasApiRemove !== null ? hasApiRemove : false;
    const can_read = true;

    return {
      permissions: {
        can_read,
        can_insert,
        can_update,
        can_remove
      },
      loading: isLoading,
      error
    };
  }, [user?.role, data, isLoading, error]);
};
