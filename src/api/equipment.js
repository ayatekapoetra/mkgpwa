import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';
import { useOfflineStorage } from 'lib/useOfflineStorage';

export const endpoints = {
  public: '/public/equipment',
  key: '/master/equipment',
  list: '/list'
};

export const useGetEquipment = (params) => {
  const url = params ? `${endpoints.key}/list?${new URLSearchParams(params)}` : `${endpoints.key}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });
  
  useOfflineStorage('equipment', 'equipment', data);

  const memoizedValue = useMemo(
    () => {
      const rowsData = data?.rows;
      const isPaginated = rowsData && Array.isArray(rowsData.data);
      const equipmentData = isPaginated ? rowsData.data : (Array.isArray(rowsData) ? rowsData : []);
      
      return {
        data: equipmentData,
        dataLoading: isLoading,
        dataError: error,
        dataEmpty: !isLoading && equipmentData.length === 0,
        page: isPaginated ? rowsData.page : 1,
        perPage: isPaginated ? rowsData.perPage : (params?.perPages || 25),
        total: isPaginated ? rowsData.total : equipmentData.length,
        lastPage: isPaginated ? rowsData.lastPage : 1
      };
    },
    [data, error, isLoading, params?.perPages]
  );

  return memoizedValue;
};

export const usePublicEquipment = (params) => {
  const url = params ? `${endpoints.public}/list?${new URLSearchParams(params)}` : `${endpoints.public}/list`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });
  
  useOfflineStorage('equipment', 'equipment', data);

  const memoizedValue = useMemo(
    () => {
      const rowsData = data?.rows;
      const isPaginated = rowsData && Array.isArray(rowsData.data);
      const equipmentData = isPaginated ? rowsData.data : (Array.isArray(rowsData) ? rowsData : []);
      
      return {
        data: equipmentData,
        dataLoading: isLoading,
        dataError: error,
        dataEmpty: !isLoading && equipmentData.length === 0,
        page: isPaginated ? rowsData.page : 1,
        perPage: isPaginated ? rowsData.perPage : (params?.perPages || 25),
        total: isPaginated ? rowsData.total : equipmentData.length,
        lastPage: isPaginated ? rowsData.lastPage : 1
      };
    },
    [data, error, isLoading, params?.perPages]
  );

  return memoizedValue;
};

export const useShowEquipment = (id) => {
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
