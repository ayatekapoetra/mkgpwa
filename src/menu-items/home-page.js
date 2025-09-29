// THIRD - PARTY
import { FormattedMessage } from 'react-intl';

// ASSETS
import { Bank } from 'iconsax-react';

// ICONS
const icons = {
  home: Bank
};

// ==============================|| MENU ITEMS - SAMPLE PAGE ||============================== //

const HomePage = {
  id: 'home-page',
  title: <FormattedMessage id="Home" />,
  type: 'group',
  url: '/',
  icon: icons.home
};

export default HomePage;
