import useSWR from "swr";
import { useMemo } from "react";
import { fetcher } from "utils/axios";
import axiosServices from "utils/axios";

export const endpoints = {
  key: "/setting/akunting-mapping",
  list: "/list",
  meta: "/meta",
  sources: "/sources",
  targets: "/targets",
  issues: "/issues",
};

export const useGetAkuntingMappingIssues = (params = {}) => {
  const qs = buildQueryString(params);
  const url = `${endpoints.key}${endpoints.issues}${qs ? `?${qs}` : ""}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true,
  });
  return useMemo(
    () => ({
      issues: data?.rows || [],
      pagination: data?.pagination || {
        page: Number(params.page) || 1,
        per_page: Number(params.per_page) || 25,
        total: 0,
      },
      issuesLoading: isLoading,
      issuesRefreshing: isValidating,
      issuesError: error,
      refreshIssues: mutate,
    }),
    [data, error, isLoading, isValidating, mutate, params.page, params.per_page],
  );
};

export const requeueAkuntingMappingIssue = async (id, reason) => {
  const res = await axiosServices.post(
    `${endpoints.key}${endpoints.issues}/${id}/requeue`,
    { reason },
    { skipOfflineQueue: true },
  );
  return res.data;
};

export const useAkuntingMappingMeta = () => {
  const { data, error, isLoading } = useSWR(
    `${endpoints.key}${endpoints.meta}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );
  return useMemo(
    () => ({
      meta: data?.rows || {},
      metaLoading: isLoading,
      metaError: error,
    }),
    [data, error, isLoading],
  );
};

export const useGetAkuntingMappings = (params = {}) => {
  const enabled = params !== null && params !== undefined;
  const qs = new URLSearchParams();
  if (enabled) {
    qs.set(
      "source_instance",
      params?.source_instance || DEFAULT_SOURCE_INSTANCE,
    );
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
  }
  const url = enabled
    ? `${endpoints.key}${endpoints.list}${qs.toString() ? `?${qs}` : ""}`
    : null;
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
  });
  return useMemo(
    () => ({
      rows: data?.rows || [],
      total: data?.total || 0,
      dataLoading: isLoading,
      dataError: error,
      dataMutate: mutate,
    }),
    [data, error, isLoading, mutate],
  );
};

export const fetchAkuntingSources = async (type, params = {}) => {
  const sourceParams = { ...params };
  if (GLOBAL_OPS_SOURCE_TYPES.includes(String(type).toUpperCase())) {
    delete sourceParams.bisnis_id;
  }
  const qs = buildQueryString(sourceParams);
  const res = await axiosServices.get(
    `${endpoints.key}${endpoints.sources}/${type}${qs ? `?${qs}` : ""}`,
  );
  return res.data?.rows || [];
};

export const fetchAkuntingTargets = async (type, params = {}) => {
  const qs = buildQueryString(params);
  const res = await axiosServices.get(
    `${endpoints.key}${endpoints.targets}/${type}${qs ? `?${qs}` : ""}`,
  );
  return res.data?.rows || [];
};

export const upsertAkuntingMapping = async (payload) => {
  const res = await axiosServices.post(endpoints.key, {
    ...payload,
    source_instance: payload.source_instance || DEFAULT_SOURCE_INSTANCE,
  });
  return res.data;
};

export const SOURCE_TO_TARGET_DEFAULT = {
  BUSINESS: "COMPANY",
  BRANCH: "BUSINESS_UNIT",
  BRANCH_SITE: "SITE",
  SUPPLIER: "PARTNER",
  EMPLOYEE: "PARTNER",
  ACCOUNT: "ACCOUNT",
  ITEM: "INVENTORY_ITEM",
  EQUIPMENT: "EQUIPMENT",
};

export const COMPANY_OWNED_TARGET_TYPES = [
  "BUSINESS_UNIT",
  "SITE",
  "PARTNER",
  "ACCOUNT",
  "INVENTORY_ITEM",
  "EQUIPMENT",
];

export const GLOBAL_OPS_SOURCE_TYPES = ["SUPPLIER", "ITEM"];

export const DEFAULT_SOURCE_INSTANCE =
  process.env.NEXT_PUBLIC_AKUNTING_SOURCE_INSTANCE || "mrt-test";

function buildQueryString(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      qs.set(key, value);
  });
  return qs.toString();
}
