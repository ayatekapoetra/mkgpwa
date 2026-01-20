import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/maintenance/signages/breakdown/list'
};

export const useGetSignages = (params) => {
  const url = params ? endpoints.key + `?${new URLSearchParams(params)}` : endpoints.key;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    refreshInterval: 180000, // 3 minutes
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Debug: Log full API response structure
  console.log('[useGetSignages] Full API response:', data);
  console.log('[useGetSignages] data keys:', data ? Object.keys(data) : 'no data');
  console.log('[useGetSignages] data.BDtot:', data?.BDtot);
  console.log('[useGetSignages] data.WTtot:', data?.WTtot);
  console.log('[useGetSignages] data.WPtot:', data?.WPtot);
  console.log('[useGetSignages] data.WStot:', data?.WStot);
  console.log('[useGetSignages] data.rows:', data?.rows);
  console.log('[useGetSignages] data.rows keys:', data?.rows ? Object.keys(data.rows) : 'no rows');

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.data, // Array data di dalam rows
      rowsInfo: data?.rows, // Info pagination (total, perPage, page, lastPage)
      rawData: data, // Full response untuk debugging
      pagination: data?.rows, // Alias ke rowsInfo
      lastPage: data?.rows?.lastPage,
      total: data?.rows?.total,
      perPage: data?.rows?.perPage,
      currentPage: data?.rows?.page,
      // Statistics from API response - cek di rows dan di parent
      BDtot: data?.rows?.BDtot || data?.BDtot || 0,
      WTtot: data?.rows?.WTtot || data?.WTtot || 0,
      WPtot: data?.rows?.WPtot || data?.WPtot || 0,
      WStot: data?.rows?.WStot || data?.WStot || 0,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
