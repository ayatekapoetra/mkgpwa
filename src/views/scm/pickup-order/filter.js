'use client';

import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import InputSearch from 'components/InputSearch';

import { Add } from 'iconsax-react';

export default function FilterPickupOrder({ count, open, onClose, data, setData, anchor = 'top' }) {
  return (
    <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
      <Stack p={1}>
        <MainCard content title={<HeaderFilter count={count} onClose={onClose} />}>
          <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start" sx={{ maxHeight: '400px' }}>
            <Grid item xs={12} sm={4} lg={4}>
              <InputLabel htmlFor="pickup-kode">Kode</InputLabel>
              <InputSearch size="small" type="text" value={data.kode} onChange={(e) => setData({ ...data, kode: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4} lg={4}>
              <InputLabel htmlFor="pickup-by">Pickup By</InputLabel>
              <InputSearch size="small" type="text" value={data.pickup_by} onChange={(e) => setData({ ...data, pickup_by: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4} lg={4}>
              <InputLabel htmlFor="pickup-keterangan">Keterangan</InputLabel>
              <InputSearch size="small" type="text" value={data.keterangan} onChange={(e) => setData({ ...data, keterangan: e.target.value })} />
            </Grid>
          </Grid>
        </MainCard>
        <CardActions>
          <Button variant="dashed" color="secondary" fullWidth onClick={() => setData({ kode: '', pickup_by: '', keterangan: '' })}>
            Reset Filter
          </Button>
        </CardActions>
      </Stack>
    </SwipeableDrawer>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">Filter pickup order</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
