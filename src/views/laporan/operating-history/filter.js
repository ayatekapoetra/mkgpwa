'use client';

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
import { useGetLokasiKerja } from 'api/lokasi-mining';
import { useGetShiftKerja } from 'api/shiftkerja';

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

export default function FilterOperatingHistory({ open, count, params, setParams, onClose, title, anchor = 'right' }) {
  const { data: lokasiData = [], dataLoading: lokasiLoading } = useGetLokasiKerja();
  const { data: shiftData = [], dataLoading: shiftLoading } = useGetShiftKerja();
  const { data: kegiatanData = [], dataLoading: kegiatanLoading } = useGetKegiatanKerja();
  const { data: equipmentData = [], dataLoading: equipmentLoading } = usePublicEquipment();
  const lokasiOptions = Array.isArray(lokasiData) ? lokasiData : [];
  const shiftOptions = Array.isArray(shiftData) ? shiftData : [];
  const kegiatanOptions = Array.isArray(kegiatanData) ? kegiatanData : [];
  const equipmentOptions = Array.isArray(equipmentData) ? equipmentData : [];
  const selectedLokasi = selectedOptions(lokasiOptions, params.lokasi_ids);
  const selectedShift = selectedOptions(shiftOptions, params.shift_ids);
  const selectedKegiatan = selectedOptions(kegiatanOptions, params.kegiatan_ids);
  const selectedEquipment = selectedOptions(equipmentOptions, params.equipment_ids);

  const update = (values) => setParams((previous) => ({ ...previous, ...values, page: 1 }));
  const reset = () => {
    const dates = defaultDates();
    update({
      startdate: dates.startdate,
      enddate: dates.enddate,
      lokasi_ids: [],
      shift_ids: [],
      kegiatan_ids: [],
      equipment_ids: []
    });
  };

  return (
    <SwipeableDrawer anchor={anchor} onClose={onClose} onOpen={() => {}} open={open}>
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
                options={lokasiOptions}
                loading={lokasiLoading}
                value={selectedLokasi}
                onChange={(_, value) => update({ lokasi_ids: value })}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => option?.nama || ''}
                renderInput={(inputParams) => <TextField {...inputParams} label="Lokasi" />}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack>
                      <Typography variant="body2" fontWeight={600}>{option.nama || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.cabang?.nama || option.type || '-'}</Typography>
                    </Stack>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={shiftOptions}
                loading={shiftLoading}
                value={selectedShift}
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
                value={selectedKegiatan}
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
                value={selectedEquipment}
                onChange={(_, value) => update({ equipment_ids: value })}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => [option?.kode, option?.model].filter(Boolean).join(' - ')}
                renderInput={(inputParams) => <TextField {...inputParams} label="Kode Equipment" />}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack>
                      <Typography variant="body2" fontWeight={600}>{option.kode || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.model || option.nama || '-'}</Typography>
                    </Stack>
                  </li>
                )}
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
