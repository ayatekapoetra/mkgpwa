'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/operation/timesheet',
  exportAll: '/all/export-excel'
};

export const useGetTimesheetAll = (params) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${endpoints.key}${endpoints.exportAll}${query}`;

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
