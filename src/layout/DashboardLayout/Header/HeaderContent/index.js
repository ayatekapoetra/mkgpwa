
// MATERIAL - UI
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

import Profile from './Profile';
import ListFetchFailed from './ListFetchFailed.js';
import Notification from './Notification.js';
import MobileSection from './MobileSection';

import { useLayoutConfig, useLocaleConfig } from 'hooks/useConfig';
import DrawerHeader from 'layout/DashboardLayout/Drawer/DrawerHeader';
import { MenuOrientation } from 'config';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = () => {
  const { i18n } = useLocaleConfig();
  const { menuOrientation } = useLayoutConfig();

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <>
      {menuOrientation === MenuOrientation.HORIZONTAL && !downLG && <DrawerHeader open={true} />}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      <Notification />
      <ListFetchFailed />
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
};

export default HeaderContent;
