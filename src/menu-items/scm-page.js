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

const SCMPage = {
  id: 'scm-pages',
  title: <FormattedMessage id="Supply Chain Management" />,
  type: 'group',
  icon: icons.page,
  children: [
    {
      id: 'delivery-order',
      title: <FormattedMessage id="Delivery Order" />,
      type: 'item',
      url: '/delivery-order',
      icon: icons.do,
      breadcrumbs: false
      // target: true
    },
    {
      id: 'pickup-order',
      title: <FormattedMessage id="Pickup Order" />,
      type: 'item',
      url: '/pickup-order',
      icon: icons.so,
      breadcrumbs: false
    },
    {
      id: 'shipping-order',
      title: <FormattedMessage id="Shipping Order" />,
      type: 'item',
      url: '/shipping-order',
      icon: icons.ship,
      breadcrumbs: false
    }
  ]
};

export default SCMPage;
