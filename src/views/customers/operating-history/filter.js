'use client';

import useSWR from 'swr';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Add } from 'iconsax-react';

import MainCard from 'components/MainCard';
import { usePublicEquipment } from 'api/equipment';
import { useGetKegiatanKerja } from 'api/kegiatan-mining';
import { fetcher } from 'utils/axios';

const defaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { startdate: `${year}-${month}-01`, enddate: `${year}-${month}-${day}` };
};

const selectedOptions = (options, selected) => {
  const ids = new Set((selected || []).map((item) => String(typeof item === 'object' ? item.id : item)));
  return (options || []).filter((option) => ids.has(String(option.id)));
};

export default function FilterCustomersOperatingHistory({
  open,
  count,
  params,
  setParams,
  onClose,
  title = 'Operating History',
  pelangganNama
}) {
  const { data: shiftResponse, isLoading: shiftLoading } = useSWR('/public/shift/list', fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });
  const { data: kegiatanData = [], dataLoading: kegiatanLoading } = useGetKegiatanKerja();
  const { data: equipmentData = [], dataLoading: equipmentLoading } = usePublicEquipment();

  const shiftRaw = shiftResponse?.rows;
  const shiftOptions = Array.isArray(shiftRaw?.data)
    ? shiftRaw.data
    : Array.isArray(shiftRaw)
      ? shiftRaw
      : [];
  const kegiatanOptions = Array.isArray(kegiatanData) ? kegiatanData : [];
  const equipmentOptions = Array.isArray(equipmentData) ? equipmentData : [];

  const update = (values) => setParams((previous) => ({ ...previous, ...values, page: 1 }));
  const reset = () => {
    const dates = defaultDates();
    update({
      startdate: dates.startdate,
      enddate: dates.enddate,
      shift_ids: [],
      kegiatan_ids: [],
      equipment_ids: []
    });
  };

  return (
    <SwipeableDrawer anchor="right" onClose={onClose} onOpen={() => {}} open={open}>
      <Stack p={1} sx={{ width: { xs: '100vw', sm: 440 } }}>
        <MainCard
          content
          title={
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack>
                <Typography variant="body1">Filter {title}</Typography>
                <Typography variant="caption">{count} data ditemukan</Typography>
              </Stack>
              <IconButton color="error" onClick={onClose}>
                <Add style={{ transform: 'rotate(45deg)' }} />
              </IconButton>
            </Stack>
          }
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pelanggan"
                value={pelangganNama || '-'}
                InputProps={{ readOnly: true }}
                helperText="Data otomatis terkunci ke akun pelanggan yang login"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={params.startdate || ''}
                onChange={(event) => update({ startdate: event.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: params.enddate || undefined }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={params.enddate || ''}
                onChange={(event) => update({ enddate: event.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: params.startdate || undefined }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={shiftOptions}
                loading={shiftLoading}
                value={selectedOptions(shiftOptions, params.shift_ids)}
                onChange={(_, value) => update({ shift_ids: value })}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => option?.nama || ''}
                renderInput={(inputParams) => <TextField {...inputParams} label="Shift" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={kegiatanOptions}
                loading={kegiatanLoading}
                value={selectedOptions(kegiatanOptions, params.kegiatan_ids)}
                onChange={(_, value) => update({ kegiatan_ids: value })}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => option?.nama || ''}
                renderInput={(inputParams) => <TextField {...inputParams} label="Kegiatan" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={equipmentOptions}
                loading={equipmentLoading}
                value={selectedOptions(equipmentOptions, params.equipment_ids)}
                onChange={(_, value) => update({ equipment_ids: value })}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => [option?.kode, option?.model].filter(Boolean).join(' - ')}
                renderInput={(inputParams) => <TextField {...inputParams} label="Kode Equipment" />}
              />
            </Grid>
          </Grid>
        </MainCard>
        <CardActions>
          <Button onClick={reset} variant="dashed" color="secondary" fullWidth>
            Reset Filter
          </Button>
        </CardActions>
      </Stack>
    </SwipeableDrawer>
  );
}
