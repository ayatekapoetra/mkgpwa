'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { Add, SecurityUser, MenuBoard, FilterSearch } from 'iconsax-react';

import MainCard from 'components/MainCard';
import InputSearch from 'components/InputSearch';
import FilterUser from 'components/FilterUser';
import FilterMenu from 'components/FilterMenu';
import FilterSubmenu from 'components/FilterSubmenu';

export default function FilterUserAccess({ count, open, onClose, data, setData, anchor = 'right' }) {
  const theme = useTheme();

  const onResetFilterHandle = () => {
    setData({
      keyword: '',
      user_id: '',
      menu_id: '',
      submenu_id: '',
      page: 1,
      perPages: data.perPages || 25
    });
  };

  const patchData = (updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return { ...next, page: 1 };
    });
  };

  return (
    <SwipeableDrawer anchor={anchor} onClose={onClose} open={open} onOpen={() => {}}>
      <Stack p={1.5} sx={{ width: anchor === 'right' ? 380 : '100vw', maxWidth: '100vw' }} spacing={1.5}>
        <MainCard
          content
          title={
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.25,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main'
                  }}
                >
                  <FilterSearch size={18} variant="Bold" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Filter User Access
                  </Typography>
                  <Chip size="small" color="primary" variant="light" label={`${count || 0} data`} sx={{ height: 20, mt: 0.25 }} />
                </Box>
              </Stack>
              <IconButton color="error" onClick={onClose} size="small">
                <Add style={{ transform: 'rotate(45deg)' }} />
              </IconButton>
            </Stack>
          }
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <InputLabel htmlFor="search-keyword">Keyword</InputLabel>
              <InputSearch
                size="medium"
                type="text"
                value={data.keyword || ''}
                onChange={(e) => patchData({ keyword: e.target.value })}
                placeholder="Nama user / submenu..."
              />
            </Grid>
            <Grid item xs={12}>
              <FilterUser
                value={data.user_id}
                name="user_id"
                label="User Karyawan"
                startAdornment={<SecurityUser />}
                setData={patchData}
              />
            </Grid>
            <Grid item xs={12}>
              <FilterMenu
                value={data.menu_id}
                name="menu_id"
                label="Menu"
                startAdornment={<MenuBoard />}
                setData={(updater) => {
                  patchData((prev) => {
                    const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
                    if (next.menu_id !== prev.menu_id) {
                      return { ...next, submenu_id: '' };
                    }
                    return next;
                  });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FilterSubmenu
                value={data.submenu_id}
                name="submenu_id"
                label="Submenu"
                startAdornment={<MenuBoard />}
                setData={patchData}
                menuId={data.menu_id}
              />
            </Grid>
          </Grid>
        </MainCard>
        <CardActions sx={{ px: 0 }}>
          <Button onClick={onResetFilterHandle} variant="dashed" color="secondary" fullWidth>
            Reset Filter
          </Button>
          <Button onClick={onClose} variant="contained" fullWidth>
            Terapkan
          </Button>
        </CardActions>
      </Stack>
    </SwipeableDrawer>
  );
}
