// THIRD - PARTY
import { FormattedMessage } from 'react-intl';

// ASSETS
import { Download } from 'iconsax-react';

// ICONS
const icons = {
  download: Download
};

// ==============================|| MENU ITEMS - MANUAL DOWNLOAD ||============================== //

const manualDownload = {
  id: 'manual-download',
  title: 'Download Data Offline',
  type: 'item',
  url: '/manual-download',
  icon: icons.download,
  breadcrumbs: false
};

const menuItems = {
  items: [manualDownload]
};

export default menuItems;
