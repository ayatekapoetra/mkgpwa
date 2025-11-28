import useSWR from "swr";
import { useMemo } from "react";

import { fetcher } from "utils/axios";
import { useOfflineStorage } from "lib/useOfflineStorage";

export const endpoints = {
  key: "/api/master/grouptag-timesheet",
  list: "/list",
  create: "/create",
  show: "/show",
  update: "/update",
  delete: "/delete",
};

export const useGetGroupTagTimesheet = (params) => {
  const url = params
    ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}`
    : `${endpoints.key}${endpoints.list}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  useOfflineStorage("grouptag-timesheet", "grouptag-timesheet", data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty:
        !isLoading && !(data?.rows?.length || data?.data?.rows?.length),
      dataMutate: mutate,
    }),
    [data, error, isLoading, mutate],
  );

  return memoizedValue;
};

export const useShowGroupTagTimesheet = (id) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? `${endpoints.key}/${id}` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false,
    },
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || data || {},
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate],
  );

  return memoizedValue;
};
