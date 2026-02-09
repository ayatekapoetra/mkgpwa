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
import { Add, Building3, Award, UserTag, Truck } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import FilterCabang from 'components/FilterCabang';
import FilterSysOption from 'components/FilterSysOption';
import FilterMitraBisnis from 'components/FilterMitraBisnis';

export default function FilterEquipment({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData({
      kode: '',
      cabang_id: '',
      kategori: '',
      manufaktur: '',
      tipe: '',
      partner_id: '',
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
                <InputSearch 
                  size="medium" 
                  type="text" 
                  label="Kode Equipment"
                  value={data['kode']} 
                  startAdornment={<Truck/>}
                  onChange={(e) => setData({ ...data, kode: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <FilterCabang
                  value={data.cabang_id}
                  name={'cabang_id'}
                  label="Nama Cabang"
                  startAdornment={<Building3 />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <FilterSysOption
                  value={data.manufaktur}
                  name={'manufaktur'}
                  label="Manufaktur"
                  group={'unit-manufaktur'}
                  startAdornment={<Award />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <FilterSysOption
                  value={data.kategori}
                  name={'kategori'}
                  label="Kategori"
                  group={'ctg-equipment'}
                  startAdornment={<Award />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <FilterSysOption
                  value={data.tipe}
                  name={'tipe'}
                  label="Group Type"
                  group={'unit-sewa'}
                  startAdornment={<Award />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <FilterMitraBisnis
                  value={data.partner_id}
                  name={'partner_id'}
                  label="Pemilik"
                  startAdornment={<UserTag />}
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
        <Typography variant="body">Filter Equipment</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
