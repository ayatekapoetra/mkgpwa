import useSWR from 'swr';
import { useMemo } from 'react';
// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/api/master/kategori-equipment',
  list: '/list'
};

export const useGetKategoriEquipment = () => {
  const url = endpoints.key + endpoints.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [
        { id: 'DT', name: 'Dump Truck' },
        { id: 'HE', name: 'Heavy Equipment' }
      ],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && data?.rows?.length <= 0
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};
