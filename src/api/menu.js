import useSWR, { mutate } from "swr";
import { useMemo } from "react";

// Project-imports
import { fetcher } from "utils/axios";
import { useOfflineStorage } from "lib/useOfflineStorage";

const initialState = {
  openedItem: "dashboard",
  openedComponent: "buttons",
  openedHorizontalItem: null,
  isDashboardDrawerOpened: false,
  isComponentDrawerOpened: true,
};

export const endpoints = {
  key: "api/menu",
  master: "master",
  user: "/user-menu",
  submenu: "/submenu",

  keySetting: "api/setting/akses-menu/list",
};

export function useGetMenu() {
  const { data, isLoading, error, isValidating } = useSWR(
    endpoints.key + endpoints.user,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false,
    },
  );

  useOfflineStorage("menu", "user-menu", data);

  const memoizedValue = useMemo(
    () => ({
      menu: data?.dashboard,
      menuLoading: isLoading,
      menuError: error,
      menuValidating: isValidating,
      menuEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating],
  );

  return memoizedValue;
}

export function useGetMenuMaster() {
  const { data, isLoading } = useSWR(
    endpoints.key + endpoints.master,
    () => initialState,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const memoizedValue = useMemo(
    () => ({
      menuMaster: data || initialState,
      menuMasterLoading: isLoading,
    }),
    [data, isLoading],
  );

  return memoizedValue;
}

export function useGetSubMenu() {
  const { data, isLoading, error, isValidating } = useSWR(
    endpoints.key + endpoints.submenu,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  useOfflineStorage("menu", "submenu", data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length,
    }),
    [data, isLoading, error, isValidating],
  );

  return memoizedValue;
}

export function useGetUserAccess(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${endpoints.keySetting}${queryString ? `?${queryString}` : ""}`;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  useOfflineStorage("menu", "user-access", data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.data?.length,
    }),
    [data, isLoading, error, isValidating],
  );

  return memoizedValue;
}

export function useShowUserAccess(id) {
  const { data, isLoading, error } = useSWR(
    id ? `${endpoints.keySetting}?user_id=${id}&perPages=100` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows?.data || [],
      dataLoading: isLoading,
      dataError: error,
    }),
    [data, isLoading, error],
  );

  return memoizedValue;
}

export function handlerComponentDrawer(isComponentDrawerOpened) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, isComponentDrawerOpened };
    },
    false,
  );
}

export function handlerActiveComponent(openedComponent) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, openedComponent };
    },
    false,
  );
}

export function handlerDrawerOpen(isDashboardDrawerOpened) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, isDashboardDrawerOpened };
    },
    false,
  );
}

export function handlerHorizontalActiveItem(openedHorizontalItem) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, openedHorizontalItem };
    },
    false,
  );
}

export function handlerActiveItem(openedItem) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, openedItem };
    },
    false,
  );
}
