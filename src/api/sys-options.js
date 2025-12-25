import useSWR from "swr";
import { useMemo } from "react";

import { fetcher } from "utils/axios";
import { useOfflineStorage } from "lib/useOfflineStorage";

export const endpoints = {
  key: "/api/setting/sys-options",
  list: "/list",
  groups: "/groups",
  byGroup: "/group",
  byKey: "/key",
  create: "/create",
  show: "/:id",
  update: "/:id/update",
  delete: "/:id/destroy",
};

/**
 * Get all sys_options with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.group - Filter by group (optional)
 * @param {number} params.page - Page number (optional)
 * @param {number} params.perPage - Items per page (optional)
 */
export const useGetSysOptions = (params) => {
  const url = params
    ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}`
    : `${endpoints.key}${endpoints.list}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  useOfflineStorage("sys-options", "sys-options", data);

  const memoizedValue = useMemo(() => {
    // Handle pagination response
    const rows = data?.rows?.data || data?.rows || [];
    const paginationData = data?.rows?.data ? data.rows : null;

    return {
      data: Array.isArray(rows) ? rows : [],
      pagination: paginationData
        ? {
            page: paginationData.page,
            perPage: paginationData.perPage,
            total: paginationData.total,
            lastPage: paginationData.lastPage,
          }
        : null,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !rows.length,
      dataMutate: mutate,
    };
  }, [data, error, isLoading, mutate]);

  return memoizedValue;
};

/**
 * Get all unique groups
 */
export const useGetSysOptionGroups = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${endpoints.key}${endpoints.groups}`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(() => {
    const groups = Array.isArray(data?.rows) ? data.rows : [];

    return {
      data: groups,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !groups.length,
      dataMutate: mutate,
    };
  }, [data, error, isLoading, mutate]);

  return memoizedValue;
};

/**
 * Get all sys_options by group (no pagination)
 * @param {string} group - Group name
 */
export const useGetSysOptionsByGroup = (group) => {
  const { data, error, isLoading, mutate } = useSWR(
    group ? `${endpoints.key}${endpoints.byGroup}/${group}` : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(() => {
    const rows = Array.isArray(data?.rows) ? data.rows : [];

    return {
      data: rows,
      dataLoading: isLoading,
      dataError: error,
      dataEmpty: !isLoading && !rows.length,
      dataMutate: mutate,
    };
  }, [data, error, isLoading, mutate]);

  return memoizedValue;
};

/**
 * Get single sys_option by ID
 * @param {number} id - Option ID
 */
export const useShowSysOption = (id) => {
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

/**
 * Get sys_option by key
 * @param {string} key - Option key
 */
export const useGetSysOptionByKey = (key) => {
  const { data, error, isLoading, mutate } = useSWR(
    key ? `${endpoints.key}${endpoints.byKey}/${key}` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || data || {},
      dataLoading: isLoading,
      dataError: error,
      dataMutate: mutate,
    }),
    [data, error, isLoading, mutate]
  );

  return memoizedValue;
};
