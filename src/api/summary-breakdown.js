import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      const mapped = value
        .map((item) => {
          if (typeof item !== 'object' || item === null) return item;
          return item?.id ?? item?.value ?? item?.label ?? '';
        })
        .filter((item) => item !== undefined && item !== null && item !== '');

      if (mapped.length > 0) {
        searchParams.set(key, mapped.join(','));
      }
      return;
    }

    searchParams.set(key, value);
  });

  return searchParams.toString();
};

export const endpoints = {
  key: '/laporan/summary-breakdown',
  list: '/list',
  download: '/download'
};

export const useGetSummaryBreakdown = (params) => {
  const query = buildQueryString(params);
  const url = query ? `${endpoints.key}${endpoints.list}?${query}` : `${endpoints.key}${endpoints.list}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return useMemo(
    () => ({
      data: data?.rows?.data || [],
      total: data?.rows?.total || 0,
      summary: data?.rows?.summary || { total_duration: 0, total_equipment: 0, total_status_open: 0, total_status_close: 0 },
      page: data?.rows?.page || 1,
      lastPage: data?.rows?.lastPage || 1,
      perPage: data?.rows?.perPage || 25,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !(data?.rows?.data || []).length,
      mutate
    }),
    [data, isLoading, error, isValidating, mutate]
  );
};

export async function downloadSummaryBreakdownPdf(params = {}) {
  const query = buildQueryString({ ...params, page: undefined, perPage: undefined });
  const url = query ? `${endpoints.key}${endpoints.download}?${query}` : `${endpoints.key}${endpoints.download}`;

  const response = await axiosServices.get(url, {
    responseType: 'blob'
  });

  return response.data;
}
