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
import MenuItem from '@mui/material/MenuItem';

import MainCard from 'components/MainCard';
import FilterCabang from 'components/FilterCabang';
import FilterKaryawan from 'components/FilterKaryawan';
import { Add, Calendar, TagUser, UserTick, ClipboardText } from 'iconsax-react';

const perPageOptions = [25, 50, 100];

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'P', label: 'Pending' },
  { value: 'A', label: 'Approved' },
  { value: 'R', label: 'Rejected' }
];

export default function FilterCrewWorkActivity({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData((prev) => ({
      ...prev,
      page: 1,
      perPages: 25,
      startdate: '',
      enddate: '',
      status: '',
      crew_id: '',
      spv_id: '',
      cabang_id: '',
      keterangan: ''
    }));
  };

  const onChange = (field) => (event) => {
    setData((prev) => ({ ...prev, page: 1, [field]: event.target.value }));
  };

  return (
    <SwipeableDrawer anchor={anchor} onClose={onClose} open={open} onOpen={() => {}}>
      <Stack p={1} sx={{ maxWidth: anchor === 'right' ? '420px' : '100vw' }}>
        <MainCard content title={<HeaderFilter count={count} onClose={onClose} />}>
          <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
            <Grid item xs={12} sm={12} lg={12}>
              <TextField
                fullWidth
                select
                label="Jumlah Data Per Halaman"
                value={data.perPages || 25}
                onChange={(event) => setData((prev) => ({ ...prev, page: 1, perPages: Number(event.target.value) }))}
              >
                {perPageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option} data
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} lg={12}>
              <TextField
                fullWidth
                type="date"
                label="Tanggal Mulai"
                value={data.startdate || ''}
                onChange={onChange('startdate')}
                InputLabelProps={{ shrink: true }}
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
              <TextField
                fullWidth
                type="date"
                label="Tanggal Akhir"
                value={data.enddate || ''}
                onChange={onChange('enddate')}
                InputLabelProps={{ shrink: true }}
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
              <TextField
                fullWidth
                select
                label="Status"
                value={data.status || ''}
                onChange={onChange('status')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ClipboardText size={20} />
                    </InputAdornment>
                  )
                }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} lg={12}>
              <FilterCabang value={data.cabang_id} name="cabang_id" label="Cabang / Site" startAdornment={<Calendar size={20} />} setData={setData} />
            </Grid>
            <Grid item xs={12} sm={12} lg={12}>
              <FilterKaryawan value={data.crew_id} name="crew_id" label="Nama Crew" startAdornment={<TagUser size={20} />} setData={setData} />
            </Grid>
            <Grid item xs={12} sm={12} lg={12}>
              <FilterKaryawan value={data.spv_id} name="spv_id" label="Pengawas / SPV" startAdornment={<UserTick size={20} />} setData={setData} />
            </Grid>
            <Grid item xs={12} sm={12} lg={12}>
              <TextField fullWidth label="Keterangan" value={data.keterangan || ''} onChange={onChange('keterangan')} />
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
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">Filter Crew Work Activity</Typography>
        <Typography variant="caption">count {count} data</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
