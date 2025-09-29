'use client';

// import Box from '@mui/material/Box';
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
import { Add, Building3 } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import FilterCabang from 'components/FilterCabang';

export default function FilterBarang({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData({
      nama: '',
      kode: '',
      bisnis_id: '',
      kategori_id: '',
      page: 1,
      perPages: 25
    });
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="nama">Nama</InputLabel>
                <InputSearch size="medium" type="text" value={data['nama']} onChange={(e) => setData({ ...data, nama: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="kode">Kode</InputLabel>
                <InputSearch size="medium" type="text" value={data['kode']} onChange={(e) => setData({ ...data, kode: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <FilterCabang
                  value={data.bisnis_id}
                  name={'bisnis_id'}
                  label="Bisnis Unit"
                  startAdornment={<Building3 />}
                  setData={setData}
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
        <Typography variant="body">Filter Barang</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}