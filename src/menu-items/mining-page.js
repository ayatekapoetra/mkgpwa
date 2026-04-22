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
      id: 'daily-equipment-activity',
      title: <FormattedMessage id="Equipment Activity" />,
      type: 'item',
      url: '/daily-equipment-activity',
      icon: icons.do,
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
