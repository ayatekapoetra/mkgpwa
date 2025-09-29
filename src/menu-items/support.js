// THIRD - PARTY
import { FormattedMessage } from 'react-intl';

// ASSETS
import { ShieldCross, I24Support, HuobiToken } from 'iconsax-react';

// ICONS
const icons = {
  assignment: HuobiToken,
  disabledMenu: ShieldCross,
  documentation: I24Support
};

// ==============================|| MENU ITEMS - SUPPORT ||============================== //

const support = {
  id: 'other',
  title: <FormattedMessage id="others" />,
  type: 'group',
  children: [
    {
      id: 'assignment-menu',
      title: <FormattedMessage id="Penugasan" />,
      type: 'item',
      url: '/penugasan-kerja',
      icon: icons.assignment,
      breadcrumbs: false
    },
    {
      id: 'disabled-menu',
      title: <FormattedMessage id="disabled-menu" />,
      type: 'item',
      url: '#',
      icon: icons.disabledMenu,
      disabled: true
    },
    {
      id: 'documentation',
      title: <FormattedMessage id="documentation" />,
      type: 'item',
      url: 'https://phoenixcoded.gitbook.io/able-pro/v/react',
      icon: icons.documentation,
      external: true,
      target: true,
      chip: {
        label: 'gitbook',
        color: 'info',
        size: 'small'
      }
    }
  ]
};

export default support;
