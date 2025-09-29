// THIRD - PARTY
import { FormattedMessage } from 'react-intl';

// ASSETS
import { Book1, I24Support, MessageProgramming, Truck, Box, Airdrop, VoiceCricle } from 'iconsax-react';

// ICONS
const icons = {
  page: Book1,
  dom: VoiceCricle,
  maintenance: MessageProgramming,
  contactus: I24Support,
  equipment: Truck,
  barang: Box,
  material: Airdrop
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const MasterPage = {
  id: 'master-pages',
  title: <FormattedMessage id="Master" />,
  type: 'group',
  icon: icons.page,
  children: [
    {
      id: 'dom',
      title: <FormattedMessage id="Dom" />,
      type: 'item',
      url: '/dom',
      icon: icons.dom,
      breadcrumbs: false
      // target: true
    },
    {
      id: 'equipment',
      title: <FormattedMessage id="Equipment" />,
      type: 'item',
      url: '/equipment',
      icon: icons.equipment
      // target: true
    },
    {
      id: 'barang',
      title: <FormattedMessage id="Sparepart" />,
      type: 'item',
      url: '/barang',
      icon: icons.barang
    },
    {
      id: 'material',
      title: <FormattedMessage id="Jenis Material" />,
      type: 'item',
      url: '/material',
      icon: icons.material
    }
  ]
};

export default MasterPage;
