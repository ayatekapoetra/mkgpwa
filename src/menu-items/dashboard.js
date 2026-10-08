'use client';

// third-party
import { FormattedMessage, useIntl } from 'react-intl';

// assets
import {
  Android,
  Windows,
  Home3,
  Home2,
  HomeTrendUp,
  Box1,
  Bank,
  Book1,
  I24Support,
  MessageProgramming,
  Truck,
  Box,
  Airdrop,
  VoiceCricle,
  CardCoin,
  TruckFast,
  TruckTime,
  Ship,
  OceanProtocol,
  Radar2,
  SmartCar,
  TaskSquare,
  CpuSetting,
  SecurityUser,
  Logout,
  Scanner,
  TruckTick,
  Book,
  FavoriteChart,
  PresentionChart,
  Location,
  Task,
  Profile2User,
  Buildings,
  Diagram,
  Layer,
  ReceiptItem,
  NoteText,
  ClipboardText,
  ShieldTick,
  DocumentText,
  FingerScan,
  Health,
} from 'iconsax-react';

import { useGetMenu } from 'api/menu';
import { getMenuIcon } from 'utils/getMenuIcon';
// import { useSession } from 'next-auth/react';

const icons = {
  android: Android,
  windows: Windows,
  home: Home2,
  home2: Home2,
  dashboard: HomeTrendUp,
  components: Box1,
  loading: Home3,
  bank: Bank,
  page: DocumentText,
  dom: Diagram,
  maintenance: MessageProgramming,
  contactus: I24Support,
  equipment: Truck,
  barang: Box,
  material: Layer,
  do: TruckFast,
  so: TruckTime,
  ship: Ship,
  cardCoin: CardCoin,
  maximizeCircle: OceanProtocol,
  radar2: Radar2,
  smartCar: SmartCar,
  taskSquare: TaskSquare,
  task: Task,
  setting: CpuSetting,
  permission: ShieldTick,
  logout: Logout,
  ocr: Scanner,
  ritase: TruckTick,
  book: Book,
  PresentionChart: PresentionChart,
  FavoriteChart: FavoriteChart,
  location: Location,
  profile: Profile2User,
  buildings: Buildings,
  diagram: Diagram,
  layer: Layer,
  truck: Truck,
  box: Box,
  truckFast: TruckFast,
  receiptItem: ReceiptItem,
  noteText: NoteText,
  clipboardText: ClipboardText,
  shieldTick: ShieldTick,
  documentText: DocumentText,
  building: Buildings,
  health: Health,
  FingerScan: FingerScan,
  humancapital: Android,
  truckremove: Health,
  TruckRemove: Health
};

const loadingMenu = {
  id: 'group-dashboard-loading',
  title: <FormattedMessage id="dashboard" />,
  type: 'group',
  icon: icons.loading,
  children: [
    {
      id: 'dashboard1',
      title: <FormattedMessage id="dashboard" />,
      type: 'collapse',
      icon: icons.loading,
      children: [
        {
          id: 'default1',
          title: 'loading...',
          type: 'item',
          url: '/timesheet',
          breadcrumbs: false
        }
      ]
    }
  ]
};

// ==============================|| MENU ITEMS - API ||============================== //

export const MenuFromAPI = () => {
  const { messages } = useIntl();
  // const { data: session, status } = useSession();
  const { menu, menuLoading } = useGetMenu();
  if (menuLoading) return loadingMenu;

  const subChildrenList = (children) => {
    return children?.map((subList) => {
      return fillItem(subList, undefined, messages);
    });
  };

  const itemList = (subList) => {
    let list = fillItem(subList, undefined, messages);

    // if collapsible item, we need to feel its children as well
    if (subList.type === 'collapse') {
      list.children = subChildrenList(subList.children);
    }
    return list;
  };

  const childrenList = menu?.children?.map((subList) => {
    return itemList(subList);
  });

  let menuList = fillItem(menu, childrenList, messages);
  return menuList;
};

function fillItem(item, children, messages) {
  const title = item?.title || '';
  return {
    ...item,
    // API-defined labels without a translation are displayed as plain text.
    title: messages[title] ? <FormattedMessage id={title} /> : title,
    icon: (() => {
      if (typeof item?.icon === 'function' || typeof item?.icon === 'object') {
        return item.icon;
      }

      const iconKey = (item?.icon || item?.id || '').toString().toLowerCase();
      const resolvedIcon = icons[iconKey] || getMenuIcon(iconKey);
      return resolvedIcon || icons.dom;
    })(),
    ...(children && { children })
  };
}
