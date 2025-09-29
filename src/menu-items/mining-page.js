// THIRD - PARTY
import { FormattedMessage } from 'react-intl';

// ASSETS
import { Book1, I24Support, MessageProgramming, TruckFast, TruckTime, Ship } from 'iconsax-react';

// ICONS
const icons = {
  page: Book1,
  maintenance: MessageProgramming,
  contactus: I24Support,
  do: TruckFast,
  so: TruckTime,
  ship: Ship
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
    }
  ]
};

export default MiningPage;
