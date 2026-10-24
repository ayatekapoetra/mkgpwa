import PropTypes from 'prop-types';
import { useMemo } from 'react';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

// PROJECT IMPORTS
import DrawerHeader from './DrawerHeader';
import DrawerContent from './DrawerContent';
import MiniDrawerStyled from './MiniDrawerStyled';

import { DRAWER_WIDTH } from 'config';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

const MainDrawer = ({ window }) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // responsive drawer container
  const container = window !== undefined ? () => window().document.body : undefined;

  // header content
  const drawerContent = useMemo(() => <DrawerContent />, []);
  const drawerHeader = useMemo(() => <DrawerHeader open={drawerOpen} />, [drawerOpen]);

  return (
    <Box
      component="nav"
      sx={{
        flexShrink: { md: 0 },
        zIndex: 1200,
        ...(!downLG ? {} : { pointerEvents: 'none' })
      }}
      aria-label="mailbox folders"
    >
      {!downLG ? (
        <MiniDrawerStyled variant="permanent" open={drawerOpen}>
          {drawerHeader}
          {drawerContent}
        </MiniDrawerStyled>
      ) : drawerOpen ? (
        <Drawer
          container={container}
          variant="temporary"
          open={Boolean(drawerOpen)}
          onClose={() => handlerDrawerOpen(false)}
          ModalProps={{ keepMounted: false }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '&[aria-hidden="true"]': {
              pointerEvents: 'none !important',
              visibility: 'hidden !important'
            },
            '&.MuiDrawer-modal[aria-hidden="true"]': {
              pointerEvents: 'none !important',
              visibility: 'hidden !important'
            },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundImage: 'none',
              boxShadow: 'inherit',
              pointerEvents: 'auto'
            }
          }}
        >
          {drawerHeader}
          {drawerContent}
        </Drawer>
      ) : null}
    </Box>
  );
};

MainDrawer.propTypes = {
  window: PropTypes.object
};

export default MainDrawer;
