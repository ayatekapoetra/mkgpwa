'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TextField from '@mui/material/TextField';

// ASSETS
import { Add, Truck, Building4 } from 'iconsax-react';
import MainCard from 'components/MainCard';
import FilterEquipment from 'components/FilterEquipment';
import FilterCabang from 'components/FilterCabang';

export default function FilterPemakaianBarang({ open, count, params, setParams, onClose, anchor = 'right' }) {
  const onResetFilter = () => {
    setParams((prev) => ({
      ...prev,
      thnbln: '',
      equipment_id: '',
      cabang_id: ''
    }));
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <TextField
                  fullWidth
                  label="Tahun-Bulan"
                  value={params.thnbln || ''}
                  onChange={(e) => setParams((prev) => ({ ...prev, thnbln: e.target.value }))}
                  type="month"
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterEquipment
                  value={params.equipment_id}
                  label="Kode Equipment"
                  name="equipment_id"
                  setData={setParams}
                  startAdornment={<Truck />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterCabang value={params.cabang_id} label="Cabang" name="cabang_id" startAdornment={<Building4 />} setData={setParams} />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button onClick={onResetFilter} variant="dashed" color="secondary" fullWidth>
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
        <Typography variant="body">Filter Pemakaian Barang</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
