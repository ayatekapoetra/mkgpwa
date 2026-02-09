import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

export const endpoints = {
  byPeriod: '/attendances/by-period'
};

export const useMonthlyAttendance = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const { data, error, isLoading, isValidating, mutate } = useSWR(`${endpoints.byPeriod}${qs}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoized = useMemo(
    () => ({
      attendance: data?.data?.rows || [],
      periode: data?.data?.periode || params?.periode || '',
      total: data?.data?.count || 0,
      attendanceLoading: isLoading,
      attendanceError: error,
      attendanceValidating: isValidating,
      attendanceMutate: mutate
    }),
    [data, error, isLoading, isValidating, mutate, params?.periode]
  );

  return memoized;
};
