import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const BASE = '/operation/material-request';

export const endpoints = {
  key: BASE,
  listByWo: '/wo',
  createFromWo: '/wo',
  show: '/show',
  update: '/update',
  delete: '/delete'
};

export function useMaterialRequestList(woId, enabled = true) {
  const url = woId && enabled ? `${BASE}${endpoints.listByWo}/${woId}/list` : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export async function createMaterialRequestFromWo(woId, payload) {
  const response = await axiosServices.post(`${BASE}${endpoints.createFromWo}/${woId}/create`, payload, {
    skipOfflineQueue: true
  });
  return response.data;
}

export async function updateMaterialRequest(id, payload) {
  const response = await axiosServices.post(`${BASE}/${id}${endpoints.update}`, payload, {
    skipOfflineQueue: true
  });
  return response.data;
}

export async function deleteMaterialRequest(id) {
  const response = await axiosServices.post(`${BASE}/${id}${endpoints.delete}`, {}, {
    skipOfflineQueue: true
  });
  return response.data;
}

export async function prepareGoodsIssue(mroId) {
  const response = await axiosServices.get(`${BASE}/${mroId}/prepare-gi`, { skipOfflineQueue: true });
  return response.data?.rows || null;
}