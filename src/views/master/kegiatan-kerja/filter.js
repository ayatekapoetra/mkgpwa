'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import InputAdornment from '@mui/material/InputAdornment';

import MainCard from 'components/MainCard';

import { Add, Activity, Category } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import SelectSearch from 'components/SelectSearch';

export default function FilterKegiatanKerja({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData({
      nama: '',
      grpequipment: '',
      page: 1,
      perPages: 25
    });
  };

  const grpequipmentOptions = [
    { key: 'HE', teks: 'HE (Heavy Equipment)' },
    { key: 'DT', teks: 'DT (Dump Truck)' }
  ];

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <InputSearch 
                  label="Nama Kegiatan"
                  size="medium" 
                  type="text" 
                  value={data['nama']} 
                  onChange={(e) => setData({ ...data, nama: e.target.value })} 
                  startAdornment={
                    <InputAdornment position="start">
                      <Activity size={20} />
                    </InputAdornment>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <SelectSearch 
                  label="Grup Equipment" 
                  size="medium" 
                  name="grpequipment" 
                  value={data['grpequipment']} 
                  array={grpequipmentOptions} 
                  onChange={(e) => setData({ ...data, grpequipment: e.target.value })} 
                  startAdornment={
                    <InputAdornment position="start">
                      <Category size={20} />
                    </InputAdornment>
                  }
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
        <Typography variant="body">Filter Kegiatan Kerja</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
