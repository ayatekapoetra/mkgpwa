'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

import MainCard from 'components/MainCard';

import { Add, SearchNormal1, Category2 } from 'iconsax-react';
import InputSearch from 'components/InputSearch';

export default function FilterMaterial({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData({
      nama: '',
      kategori: ''
    });
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <InputSearch 
                  size="medium" 
                  type="text" 
                  value={data['nama']} 
                  onChange={(e) => setData({ ...data, nama: e.target.value })} 
                  startAdornment={<SearchNormal1 size="20" />}
                  placeholder="Nama Material"
                  label="Nama Material"
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <InputSearch 
                  size="medium" 
                  type="text" 
                  value={data['kategori']} 
                  onChange={(e) => setData({ ...data, kategori: e.target.value })} 
                  startAdornment={<Category2 size="20" />}
                  placeholder="Kategori"
                  label="Kategori"
                />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button onClick={onResetFilterHandle} variant="dashed" color="secondary" fullWidth>
              Reset Filter
            </Button>
          </CardActions>
        </Stack>
      </SwipeableDrawer>
    </div>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">Filter Material</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
