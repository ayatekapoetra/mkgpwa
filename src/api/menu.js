import useSWR, { mutate } from "swr";
import { useMemo } from "react";

// Project-imports
import { fetcher } from "utils/axios";
import { useOfflineStorage } from "lib/useOfflineStorage";
import { getMenuIcon } from "utils/getMenuIcon";

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
  listMenu: "/list-menu",

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

  // Transform menu data to include icon components
  const transformedData = useMemo(() => {
    if (!data?.dashboard?.children) {
      console.log('[Menu Transform] No data to transform');
      return data;
    }

    console.log('[Menu Transform] Starting transformation...');
    
    const transformMenu = (menuItems, depth = 0) => {
      return menuItems.map(item => {
        const transformed = { ...item };
        const indent = '  '.repeat(depth);
        
        // Convert icon string to component
        if (item.icon && typeof item.icon === 'string') {
          const IconComponent = getMenuIcon(item.icon);
          console.log(`${indent}[Transform] ${item.title}: "${item.icon}" → ${IconComponent ? '✓ Component' : '✗ NULL'}`);
          transformed.icon = IconComponent;
        } else if (item.icon) {
          console.log(`${indent}[Transform] ${item.title}: Already a component`);
        } else {
          console.log(`${indent}[Transform] ${item.title}: No icon`);
        }
        
        // Transform children recursively
        if (item.children && Array.isArray(item.children)) {
          transformed.children = transformMenu(item.children, depth + 1);
        }
        
        return transformed;
      });
    };

    const result = {
      ...data,
      dashboard: {
        ...data.dashboard,
        children: transformMenu(data.dashboard.children)
      }
    };
    
    console.log('[Menu Transform] Transformation complete');
    return result;
  }, [data]);

  const memoizedValue = useMemo(
    () => ({
      menu: transformedData?.dashboard,
      menuLoading: isLoading,
      menuError: error,
      menuValidating: isValidating,
      menuEmpty: !isLoading && !transformedData?.length,
    }),
    [transformedData, error, isLoading, isValidating],
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

export function useGetListMenu() {
  const { data, isLoading, error, isValidating } = useSWR(
    endpoints.key + endpoints.listMenu,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  useOfflineStorage("menu", "list-menu", data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.length,
    }),
    [data, isLoading, error, isValidating],
  );

  return memoizedValue;
}

export function useGetAllSubMenu() {
  const { data, isLoading, error, isValidating } = useSWR(
    endpoints.key + endpoints.submenu,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  useOfflineStorage("menu", "all-submenu", data);

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.rows?.length,
    }),
    [data, isLoading, error, isValidating],
  );

  return memoizedValue;
}

export function useGetSubMenu(menuId = "") {
  const { data, isLoading, error, isValidating } = useSWR(
    menuId ? `${endpoints.key}${endpoints.submenu}?menu_id=${menuId}` : null,
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
      dataEmpty: !isLoading && !data?.rows?.length,
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
