import useSWR from "swr";
import { useMemo } from "react";

import { fetcher } from "utils/axios";

export const endpoints = {
  key: "/master/cabang",
  area: "/area/list",
};

export const useGetArea = () => {
  const url = `${endpoints.key}${endpoints.area}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(
    () => ({
      area: Array.isArray(data?.rows) ? data.rows : [],
      areaLoading: isLoading,
      areaError: error,
      areaEmpty: !isLoading && !data?.rows?.length,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};