'use client';

// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {
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
  DocumentText
} from 'iconsax-react';

import { useGetMenu } from 'api/menu';
// import { useSession } from 'next-auth/react';

const icons = {
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
  building: Buildings
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
  // const { data: session, status } = useSession();
  const { menu, menuLoading } = useGetMenu();
  // console.log('useSession---', session, status);
  // console.log('MENU---**************************', menu);

  if (menuLoading) return loadingMenu;

  const subChildrenList = (children) => {
    return children?.map((subList) => {
      return fillItem(subList);
    });
  };

  const itemList = (subList) => {
    let list = fillItem(subList);

    // if collapsible item, we need to feel its children as well
    if (subList.type === 'collapse') {
      list.children = subChildrenList(subList.children);
    }
    return list;
  };

  const childrenList = menu?.children?.map((subList) => {
    return itemList(subList);
  });

  let menuList = fillItem(menu, childrenList);
  return menuList;
};

function fillItem(item, children) {
  return {
    ...item,
    title: <FormattedMessage id={`${item?.title}`} />,
    // Use transformed icon component if already transformed, otherwise lookup in icons map
    icon: typeof item?.icon === 'function' || typeof item?.icon === 'object' ? item.icon : icons[item?.icon],
    ...(children && { children })
  };
}
