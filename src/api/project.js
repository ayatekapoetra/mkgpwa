import useSWR from "swr";
import { useMemo } from "react";

import { fetcher } from "utils/axios";

export const endpoints = {
  key: "/master/project",
  list: "/list",
};

export const useGetProject = (params) => {
  const url = params
    ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}`
    : `${endpoints.key}${endpoints.list}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(
    () => ({
      project: Array.isArray(data?.rows) ? data.rows : [],
      projectLoading: isLoading,
      projectError: error,
      projectEmpty: !isLoading && !data?.rows?.length,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};