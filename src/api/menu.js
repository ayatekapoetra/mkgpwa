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
  key: "/menu",
  master: "master",
  user: "/user-menu",
  submenu: "/submenu",
  listMenu: "/list-menu",

  keySetting: "/setting/akses-menu/list",
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
      return data;
    }
    
    const transformMenu = (menuItems, depth = 0) => {
      return menuItems.map(item => {
        const transformed = { ...item };
        const indent = '  '.repeat(depth);
        
        // Convert icon string to component
        if (item.icon && typeof item.icon === 'string') {
          const IconComponent = getMenuIcon(item.icon);
          transformed.icon = IconComponent;
        } else if (item.icon) {
          console.log(`${indent}[Transform] ${item.title}: Already a component`);
        } else {
          console.log(`${indent}[Transform] ${item.title}: No icon`);
        }

        if (item.url === '/laporan/summary-breakdown') {
          transformed.icon = getMenuIcon('health');
        }
        
        // Transform children recursively
        if (item.children && Array.isArray(item.children)) {
          transformed.children = transformMenu(item.children, depth + 1);
        }
        
        return transformed;
      });
    };

    const dashboardChildren = transformMenu(data.dashboard.children);
    const humanCapital = dashboardChildren.find((item) => {
      const title = (item?.title || '').toString().toLowerCase();
      const id = (item?.id || '').toString().toLowerCase();
      return title === 'human capital' || id.includes('human-capital') || id.includes('humancapital');
    });

    if (humanCapital && Array.isArray(humanCapital.children)) {
      const hasCrewWorkActivity = humanCapital.children.some((item) => item?.url === '/crew-work-activity');
      if (!hasCrewWorkActivity) {
        humanCapital.children.push({
          id: 'crew-work-activity',
          title: 'Crew Work Activity',
          type: 'item',
          url: '/crew-work-activity',
          icon: getMenuIcon('clipboardText') || getMenuIcon('documentText'),
          breadcrumbs: true
        });
      }
    }

    const operationalMenu = dashboardChildren.find((item) => {
      const title = (item?.title || '').toString().toLowerCase();
      const id = (item?.id || '').toString().toLowerCase();
      return title.includes('operational') || title.includes('operasi') || id.includes('operational') || id.includes('operasi');
    });

    if (operationalMenu && Array.isArray(operationalMenu.children)) {
      const hasMobilization = operationalMenu.children.some((item) => (
        item?.url === '/mobilisasi-equipments'
        || item?.url === '/equipment-mobilization'
        || item?.url === '/operational/equipment-mobilization'
      ));
      if (!hasMobilization) {
        operationalMenu.children.push({
          id: 'equipment-mobilization',
          title: 'Equipment Mobilization',
          type: 'item',
          url: '/mobilisasi-equipments',
          icon: getMenuIcon('truck') || getMenuIcon('truckFast') || getMenuIcon('documentText'),
          breadcrumbs: true
        });
      } else {
        operationalMenu.children = operationalMenu.children.map((item) => {
          if (
            item?.url === '/operational/equipment-mobilization'
            || item?.url === '/equipment-mobilization'
          ) {
            return { ...item, url: '/mobilisasi-equipments' };
          }
          return item;
        });
      }
    }

    const reportMenu = dashboardChildren.find((item) => {
      const title = (item?.title || '').toString().trim().toLowerCase();
      const id = (item?.id || '').toString().trim().toLowerCase();
      const isReportGroup = title.includes('report') || title.includes('laporan') || id.includes('report') || id.includes('laporan');
      return Array.isArray(item?.children) && isReportGroup;
    });

    if (reportMenu && Array.isArray(reportMenu.children)) {
      const reportItems = [
        {
          id: 'event-history',
          title: 'Event History',
          type: 'item',
          url: '/laporan/event-history',
          icon: getMenuIcon('presentionChart') || getMenuIcon('documentText'),
          breadcrumbs: true
        }
      ];

      reportItems.forEach((reportItem) => {
        if (!reportMenu.children.some((item) => item?.url === reportItem.url)) {
          reportMenu.children.push(reportItem);
        }
      });
    }

    const settingMenu = dashboardChildren.find((item) => {
      const title = (item?.title || '').toString().trim().toLowerCase();
      const id = (item?.id || '').toString().trim().toLowerCase();
      return title === 'setting' || title === 'pengaturan' || id.includes('setting') || id.includes('pengaturan');
    });

    if (settingMenu && Array.isArray(settingMenu.children)) {
      const hasEquipmentProject = settingMenu.children.some((item) => (
        item?.url === '/wa-config-breakdown'
        || item?.id === 'wa-config-breakdown'
      ));
      if (!hasEquipmentProject) {
        settingMenu.children.push({
          id: 'wa-config-breakdown',
          title: 'WA Config Equipment Breakdown',
          type: 'item',
          url: '/wa-config-breakdown',
          icon: getMenuIcon('equipment') || getMenuIcon('documentText'),
          breadcrumbs: true
        });
      }

      const hasAkuntingMapping = settingMenu.children.some((item) => (
        item?.url === '/akunting-mapping'
        || item?.id === 'akunting-mapping'
      ));
      if (!hasAkuntingMapping) {
        settingMenu.children.push({
          id: 'akunting-mapping',
          title: 'Akunting Mapping',
          type: 'item',
          url: '/akunting-mapping',
          icon: getMenuIcon('receiptItem') || getMenuIcon('documentText') || getMenuIcon('setting'),
          breadcrumbs: true
        });
      }
    }

    const warehouseMenu = dashboardChildren.find((item) => {
      const title = (item?.title || '').toString().trim().toLowerCase();
      const id = (item?.id || '').toString().trim().toLowerCase();
      return title === 'warehouse' || title === 'gudang' || id.includes('warehouse') || id.includes('gudang');
    });

    if (warehouseMenu && Array.isArray(warehouseMenu.children)) {
      const hasGoodsIssues = warehouseMenu.children.some((item) => item?.url === '/goods-issues' || item?.id === 'goods-issues');
      if (!hasGoodsIssues) {
        warehouseMenu.children.push({
          id: 'goods-issues',
          title: 'Goods Issues',
          type: 'item',
          url: '/goods-issues',
          icon: getMenuIcon('box') || getMenuIcon('documentText'),
          breadcrumbs: true
        });
      }
    }

    const result = {
      ...data,
      dashboard: {
        ...data.dashboard,
        children: dashboardChildren
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
