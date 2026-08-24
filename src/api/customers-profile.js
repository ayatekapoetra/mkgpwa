import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

const endpoint = '/customers/profile';

export const useGetCustomersProfile = () => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    [endpoint, { skipOfflineQueue: true }],
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  return useMemo(
    () => ({
      data: data?.rows || null,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export const updateCustomersProfile = async (payload) => {
  const response = await axiosServices.post(`${endpoint}/update`, payload, {
    skipOfflineQueue: true
  });
  return response.data;
};
