'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

// COMPONENTS
import MainCard from 'components/MainCard';

// ASSETS
import { Add } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import SelectSearch from 'components/SelectSearch';

export default function FilterDeliveryOrder({ count, open, onClose, data, setData, anchor = 'top' }) {
  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start" sx={{ maxHeight: '400px' }}>
              <Grid item xs={12} sm={2} lg={2}>
                <InputLabel htmlFor="start-adornment-partnumber">Kode</InputLabel>
                <InputSearch size="small" type="text" value={data['kode']} onChange={(e) => setData({ ...data, kode: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4} lg={4}>
                <InputLabel htmlFor="start-adornment-partnumber">Pemasok</InputLabel>
                <SelectSearch
                  name={'pemasok_id'}
                  array={[
                    { key: 1, teks: 'pemasok 1' },
                    { key: 2, teks: 'pemasok 2' }
                  ]}
                />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button variant="dashed" color="secondary" fullWidth>
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
        <Typography variant="body">Filter delivery order</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
