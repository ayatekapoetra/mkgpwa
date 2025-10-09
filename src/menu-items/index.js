// THIRD - PARTY
import { FormattedMessage } from "react-intl";

// ASSETS
import { DocumentDownload } from "iconsax-react";

// ICONS
const icons = {
  download: DocumentDownload,
};

// ==============================|| MENU ITEMS - MANUAL DOWNLOAD ||============================== //

const manualDownload = {
  id: "manual-download",
  title: "Download Data Offline",
  type: "item",
  url: "/(dashboard)/manual-download",
  icon: icons.download,
  breadcrumbs: false,
};

const menuItems = {
  items: [manualDownload],
};

export default menuItems;
