import useSWR from "swr";
import { useMemo } from "react";

import { fetcher } from "utils/axios";
import { useOfflineStorage } from "lib/useOfflineStorage";

export const endpoints = {
  key: "/setting/equipment-project",
  list: "/list",
  show: "/",
};

export const useGetEquipmentProjectWa = (params) => {
  const qs = new URLSearchParams({
    ...params,
    limit: params?.perPage || params?.limit || 25,
  }).toString();

  const url = `${endpoints.key}${endpoints.list}${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  useOfflineStorage("equipment-project-wa", "equipment-project-wa", data);

  const memoizedValue = useMemo(
    () => ({
      data,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !(data?.rows?.length || data?.data?.rows?.length),
      dataMutate: mutate,
    }),
    [data, error, isLoading, mutate]
  );

  return memoizedValue;
};

export const useShowEquipmentProjectWa = (id) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? `${endpoints.key}/${id}` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || data || {},
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};