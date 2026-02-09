'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import MainCard from 'components/MainCard';
import FilterCabang from 'components/FilterCabang';
import FilterKaryawan from 'components/FilterKaryawan';
import { Add, Calendar, TagUser } from 'iconsax-react';

export default function FilterAbsensi({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData((prev) => ({
      ...prev,
      periode: prev.periode || '',
      cabang_id: '',
      karyawan_id: ''
    }));
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <TextField
                  fullWidth
                  type="month"
                  label="Periode"
                  value={data.periode || ''}
                  onChange={(e) => setData({ ...data, periode: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Calendar size={20} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterCabang
                  value={data.cabang_id}
                  name={'cabang_id'}
                  label="Nama Cabang"
                  startAdornment={<Calendar size={20} />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterKaryawan
                  value={data.karyawan_id}
                  name={'karyawan_id'}
                  label="Nama Karyawan"
                  startAdornment={<TagUser size={20} />}
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
        <Typography variant="body">Filter Absensi</Typography>
        <Typography variant="caption">count {count} data</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
