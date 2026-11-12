import useSWR, { mutate } from "swr";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

// Project-imports
import { fetcher } from "utils/axios";
import {
  useOfflineStorage,
  getOfflineData,
  removeOfflineData,
  clearOfflineDataByPrefix,
} from "lib/useOfflineStorage";
import { getMenuIcon } from "utils/getMenuIcon";

const initialState = {
  openedItem: "dashboard",
  openedComponent: "buttons",
  openedHorizontalItem: null,
  isDashboardDrawerOpened: false,
  isComponentDrawerOpened: true,
};

export const endpoints = {
  key: "/menu",
  master: "master",
  user: "/user-menu",
  submenu: "/submenu",
  listMenu: "/list-menu",

  keySetting: "/setting/akses-menu/list",
};

export const USER_MENU_CACHE_PREFIX = "user-menu-";
export const USER_MENU_SWR_KEY = endpoints.key + endpoints.user;
export const LAST_USER_MENU_KEY = "mkg_last_user_menu_key";

export const getUserMenuCacheKey = (userId) =>
  userId != null && `${userId}`.length > 0
    ? `${USER_MENU_CACHE_PREFIX}${userId}`
    : null;

const readStoredMenuKey = () => {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage?.getItem(LAST_USER_MENU_KEY) ||
      window.localStorage?.getItem(LAST_USER_MENU_KEY) ||
      null
    );
  } catch (_e) {
    return null;
  }
};

const writeStoredMenuKey = (key) => {
  if (typeof window === "undefined" || !key) return;
  try {
    window.sessionStorage?.setItem(LAST_USER_MENU_KEY, key);
    window.localStorage?.setItem(LAST_USER_MENU_KEY, key);
  } catch (_e) {}
};

const removeStoredMenuKey = () => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.removeItem(LAST_USER_MENU_KEY);
    window.localStorage?.removeItem(LAST_USER_MENU_KEY);
  } catch (_e) {}
};

/** Same shape as BE unauthenticated fallback (BR-6). */
export const HOME_ONLY_MENU = {
  dashboard: {
    id: "group-dashboard",
    title: "dashboard",
    type: "group",
    icon: "dashboard",
    children: [
      {
        id: "home",
        title: "Home",
        type: "item",
        url: "/home",
        icon: "home",
      },
    ],
  },
};

/**
 * Clear all per-user menu caches from IndexedDB + SWR (BR-3).
 * Call from every logout handler.
 */
export async function clearUserMenuCaches() {
  removeStoredMenuKey();
  await clearOfflineDataByPrefix("menu", USER_MENU_CACHE_PREFIX);
  // Legacy key before per-user keys (write-only path on older builds).
  await removeOfflineData("menu", "user-menu");
  await mutate(USER_MENU_SWR_KEY, undefined, { revalidate: false });
}

const menuIconsCache = new WeakMap();

const transformMenuIcons = (menuItems) => {
  if (!Array.isArray(menuItems)) return menuItems;

  const cached = menuIconsCache.get(menuItems);
  if (cached) return cached;

  const transformed = menuItems.map((item) => {
    const nextItem = { ...item };

    if (item.icon && typeof item.icon === "string") {
      nextItem.icon = getMenuIcon(item.icon);
    }

    if (item.url === "/laporan/summary-breakdown") {
      nextItem.icon = getMenuIcon("health");
    }

    if (item.children && Array.isArray(item.children)) {
      nextItem.children = transformMenuIcons(item.children);
    }

    return nextItem;
  });

  menuIconsCache.set(menuItems, transformed);
  return transformed;
};

export function useGetMenu() {
  const { data: session, status } = useSession();
  const userId = session?.id ?? session?.token?.id ?? null;
  const accessToken = session?.accessToken ?? session?.token?.accessToken ?? null;
  const sessionCacheKey = getUserMenuCacheKey(userId);

  const [offlineMenu, setOfflineMenu] = useState(null);
  const [hydrateDone, setHydrateDone] = useState(false);
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (status === "unauthenticated") {
      removeStoredMenuKey();
      setLoadedKey(null);
      setOfflineMenu(null);
      setHydrateDone(true);
      return undefined;
    }

    // AC-05 / BR-1 guard: Never hydrate or use cache before session.user.id is verified.
    if (status === "loading" || !sessionCacheKey) {
      if (loadedKey !== null) {
        setLoadedKey(null);
        setOfflineMenu(null);
      }
      return undefined;
    }

    // Keep session storage in sync with verified user session only
    writeStoredMenuKey(sessionCacheKey);

    if (loadedKey === sessionCacheKey) {
      return undefined;
    }

    (async () => {
      try {
        const cached = await getOfflineData("menu", sessionCacheKey);
        if (!cancelled) {
          setLoadedKey(sessionCacheKey);
          setOfflineMenu(cached ?? null);
          setHydrateDone(true);
        }
      } catch (_err) {
        if (!cancelled) {
          setLoadedKey(sessionCacheKey);
          setOfflineMenu(null);
          setHydrateDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionCacheKey, status, loadedKey]);

  const isAuthenticated = status === "authenticated" && Boolean(sessionCacheKey);
  const isKeyMatched = loadedKey === sessionCacheKey;
  const hasOfflineCache = isKeyMatched && Boolean(offlineMenu?.dashboard?.children);
  const shouldFetch = isAuthenticated && hydrateDone && isKeyMatched;
  const swrKey = shouldFetch ? USER_MENU_SWR_KEY : null;

  const menuFetcher = useMemo(
    () => (url) =>
      fetcher(
        accessToken
          ? [url, { headers: { Authorization: `Bearer ${accessToken}` } }]
          : url,
      ),
    [accessToken],
  );

  const { data, isLoading, error, isValidating } = useSWR(swrKey, menuFetcher, {
    fallbackData: hasOfflineCache ? offlineMenu : undefined,
    revalidateIfStale: !hasOfflineCache,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // Cache hit → no network (1x per login session). Empty cache → fetch once.
    revalidateOnMount: !hasOfflineCache,
    dedupingInterval: 60000,
  });

  useOfflineStorage("menu", sessionCacheKey, data);

  const transformedData = useMemo(() => {
    // Identity guard: only expose menu items when user is authenticated AND cache key matches verified session
    if (!isAuthenticated || !isKeyMatched) return null;

    const source = data?.dashboard?.children
      ? data
      : offlineMenu?.dashboard?.children
        ? offlineMenu
        : error && !hasOfflineCache
          ? HOME_ONLY_MENU
          : null;

    if (!source?.dashboard?.children) {
      return null;
    }

    return {
      ...source,
      dashboard: {
        ...source.dashboard,
        children: transformMenuIcons(source.dashboard.children),
      },
    };
  }, [data, offlineMenu, error, hasOfflineCache, isAuthenticated, isKeyMatched]);

  const usingHomeFallback = Boolean(
    error && !hasOfflineCache && !data?.dashboard?.children,
  );

  const memoizedValue = useMemo(
    () => ({
      menu: transformedData?.dashboard,
      menuLoading: hasOfflineCache
        ? false
        : status === "loading" || !hydrateDone || (isLoading && !hasOfflineCache),
      menuError: error || null,
      menuValidating: isValidating,
      menuEmpty: hydrateDone && !isLoading && !transformedData?.dashboard,
      menuFromCache: hasOfflineCache && !data,
      menuHomeFallback: usingHomeFallback,
    }),
    [
      transformedData,
      error,
      isLoading,
      isValidating,
      hydrateDone,
      hasOfflineCache,
      data,
      usingHomeFallback,
      status,
    ],
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
