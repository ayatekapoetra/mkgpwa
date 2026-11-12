
// MATERIAL - UI
import Box from '@mui/material/Box';

import Profile from './Profile';
import ListFetchFailed from './ListFetchFailed.js';
import Notification from './Notification.js';
import MobileSection from './MobileSection';

import { useLayoutConfig } from 'hooks/useConfig';
import DrawerHeader from 'layout/DashboardLayout/Drawer/DrawerHeader';
import { MenuOrientation } from 'config';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = () => {
  const { menuOrientation } = useLayoutConfig();

  return (
    <>
      {menuOrientation === MenuOrientation.HORIZONTAL && (
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <DrawerHeader open={true} />
        </Box>
      )}
      <Box sx={{ display: { xs: 'block', lg: 'none' }, width: '100%', ml: 1 }} />

      <Notification />
      <ListFetchFailed />
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center' }}>
        <Profile />
      </Box>
      <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center' }}>
        <MobileSection />
      </Box>
    </>
  );
};

export default HeaderContent;
