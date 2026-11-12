// THIRD - PARTY
import { FormattedMessage } from 'react-intl';

// ASSETS
import { Book1, I24Support, MessageProgramming, TruckFast, TruckTime, Ship, Truck, TaskSquare } from 'iconsax-react';

// ICONS
const icons = {
  page: Book1,
  maintenance: MessageProgramming,
  contactus: I24Support,
  do: TruckFast,
  so: TruckTime,
  ship: Ship,
  checker: Truck,
  plan: TaskSquare
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const MiningPage = {
  id: 'scm-pages',
  title: <FormattedMessage id="Operational Mining" />,
  type: 'group',
  icon: icons.page,
  children: [
    {
      id: 'daily-activity-plan',
      title: <FormattedMessage id="Daily Activity Plan" />,
      type: 'item',
      url: '/daily-activity-plan',
      icon: icons.plan,
      breadcrumbs: false
      // target: true
    },
    {
      id: 'daily-checker-pit',
      title: <FormattedMessage id="Daily Checker PIT" />,
      type: 'item',
      url: '/daily-checker-pit',
      icon: icons.checker,
      breadcrumbs: false
    },
    {
      id: 'daily-checker-stockpile',
      title: <FormattedMessage id="Daily Checker Stockpile" />,
      type: 'item',
      url: '/daily-checker-stockpile',
      icon: icons.ship,
      breadcrumbs: false
    },
    {
      id: 'master-kdsm',
      title: <FormattedMessage id="Master KDSM" />,
      type: 'item',
      url: '/master-kdsm',
      icon: icons.checker,
      breadcrumbs: false
    },
    {
      id: 'ore-transport',
      title: <FormattedMessage id="Ore Transport" />,
      type: 'item',
      url: '/ore-transport',
      icon: icons.do,
      breadcrumbs: false
    },
    {
      id: 'input-kadar',
      title: <FormattedMessage id="Input Kadar" />,
      type: 'item',
      url: '/input-kadar',
      icon: icons.plan,
      breadcrumbs: false
    },
    {
      id: 'laporan-harian-pelanggan',
      title: <FormattedMessage id="Laporan Harian Pelanggan" />,
      type: 'item',
      url: '/laporan-harian-pelanggan',
      icon: icons.plan,
      breadcrumbs: false
    },
    {
      id: 'mining-production-plan',
      title: <FormattedMessage id="Mining Production Plan" />,
      type: 'item',
      url: '/mining-production-plan',
      icon: icons.plan,
      breadcrumbs: false
    }
  ]
};

export default MiningPage;
