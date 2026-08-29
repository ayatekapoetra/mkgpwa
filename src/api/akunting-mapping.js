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
};

export const useAkuntingMappingMeta = () => {
  const { data, error, isLoading } = useSWR(`${endpoints.key}${endpoints.meta}`, fetcher, {
    revalidateOnFocus: false,
  });
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
  const qs = new URLSearchParams(params).toString();
  const res = await axiosServices.get(
    `${endpoints.key}${endpoints.sources}/${type}${qs ? `?${qs}` : ""}`,
  );
  return res.data?.rows || [];
};

export const fetchAkuntingTargets = async (type, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const res = await axiosServices.get(
    `${endpoints.key}${endpoints.targets}/${type}${qs ? `?${qs}` : ""}`,
  );
  return res.data?.rows || [];
};

export const upsertAkuntingMapping = async (payload) => {
  const res = await axiosServices.post(endpoints.key, payload);
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
