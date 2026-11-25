import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';
import useDebouncedValue from 'hooks/useDebouncedValue';

export const hargaBeliEndpoint = '/master/harga-beli';

const queryString = (params = {}) => new URLSearchParams(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
).toString();

export function useHargaBeliList(params) {
  const query = queryString(params);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `${hargaBeliEndpoint}/list${query ? `?${query}` : ''}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  return useMemo(() => ({
    rows: Array.isArray(data?.rows) ? data.rows : [],
    summary: data?.summary || {},
    permissions: data?.permissions || {},
    page: Number(data?.page) || 1,
    perPage: Number(data?.perPage) || Number(params?.perPage) || 25,
    lastPage: Number(data?.lastPage) || 1,
    total: Number(data?.total) || 0,
    loading: isLoading && !data,
    refreshing: isValidating && Boolean(data),
    error,
    mutate
  }), [data, error, isLoading, isValidating, mutate, params?.perPage]);
}

export function useHargaBeliAccess() {
  const { data, error, isLoading } = useSWR(`${hargaBeliEndpoint}/access`, fetcher, { revalidateOnFocus: false });
  return { permissions: data?.rows || {}, loading: isLoading, error };
}

export function useHargaBeliOptions() {
  const { data, error, isLoading } = useSWR(`${hargaBeliEndpoint}/options`, fetcher, { revalidateOnFocus: false });
  return { options: data?.rows || {}, loading: isLoading, error };
}

export function useHargaBeliBarangSearch(search) {
  const keyword = search.trim();
  const debouncedKeyword = useDebouncedValue(keyword, 350);
  const ready = keyword.length >= 3 && keyword === debouncedKeyword;
  const query = queryString({ page: 1, perPages: 25, kode: debouncedKeyword });
  const { data, error, isLoading } = useSWR(
    ready ? `/master/barang/list?${query}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    rows: ready && Array.isArray(data?.rows) ? data.rows : [],
    loading: keyword.length >= 3 && (!ready || isLoading),
    error: ready ? error : null
  };
}

export function useHargaBeliDetail(id) {
  const { data, error, isLoading, mutate } = useSWR(id ? `${hargaBeliEndpoint}/${id}` : null, fetcher, { revalidateOnFocus: false });
  return { data: data?.rows || null, permissions: data?.permissions || {}, loading: isLoading, error, mutate };
}

export async function createHargaBeli(payload) {
  const response = await axiosServices.post(`${hargaBeliEndpoint}/create`, payload);
  return response.data;
}

export async function updateHargaBeli(id, payload) {
  const response = await axiosServices.post(`${hargaBeliEndpoint}/${id}/update`, payload);
  return response.data;
}

export async function deactivateHargaBeli(id) {
  const response = await axiosServices.post(`${hargaBeliEndpoint}/${id}/destroy`);
  return response.data;
}
