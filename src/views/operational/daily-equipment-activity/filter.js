import React from 'react';
import {
  Box,
  Grid,
  InputLabel,
  Stack,
  SwipeableDrawer,
  Button
} from '@mui/material';
import { CloseCircle, TickCircle } from 'iconsax-react';

import MainCard from 'components/MainCard';
import InputSearch from 'components/InputSearch';
import SelectForm from 'components/SelectForm';
import FilterEquipment from 'components/FilterEquipment';
import FilterKaryawan from 'components/FilterKaryawan';
import FilterLokasiPit from 'components/FilterLokasiPit';
import FilterCabang from 'components/FilterCabang';

const statusOptions = [
  { key: '', teks: 'Semua Status' },
  { key: 'BEROPERASI', teks: 'BEROPERASI' },
  { key: 'STANDBY', teks: 'STANDBY' },
  { key: 'NO JOB', teks: 'NO JOB' },
  { key: 'NO OPERATOR', teks: 'NO OPERATOR' },
  { key: 'NO DRIVER', teks: 'NO DRIVER' },
  { key: 'BREAKDOWN', teks: 'BREAKDOWN' }
];

const shiftOptions = [
  { key: '', teks: 'Semua Shift' },
  { key: 'PAGI', teks: 'PAGI' },
  { key: 'MALAM', teks: 'MALAM' }
];

const ctgOptions = [
  { key: '', teks: 'Semua Kategori' },
  { key: 'HE', teks: 'HE (Alat Berat)' },
  { key: 'DT', teks: 'DT (Dumptruck)' }
];

export default function FilterActivity({ open, onClose, params, setParams, anchor = 'right' }) {
  const onReset = () => setParams({ ...params, ...{
    page: 1,
    date_ops: '',
    shift: '',
    status: '',
    ctg: '',
    equipment_id: '',
    karyawan_id: '',
    kegiatan_id: '',
    lokasi_id: '',
    lokasi_to: '',
    cabang_id: '',
    aktif: 'Y'
  }});

  return (
    <SwipeableDrawer anchor={anchor} open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen>
      <Box sx={{ width: { xs: 320, sm: 360 }, p: 2 }} role="presentation">
        <MainCard title="Filter" content>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <InputLabel>Tanggal Operasi</InputLabel>
              <InputSearch
                type="date"
                value={params.date_ops || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, date_ops: e.target.value, page: 1 }))}
              />
            </Grid>
            <Grid item xs={12}>
              <SelectForm
                array={shiftOptions}
                label="Shift"
                name="shift"
                value={params.shift || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, shift: e.target.value, page: 1 }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
              />
            </Grid>
            <Grid item xs={12}>
              <SelectForm
                array={statusOptions}
                label="Status"
                name="status"
                value={params.status || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
              />
            </Grid>
            <Grid item xs={12}>
              <SelectForm
                array={ctgOptions}
                label="Kategori"
                name="ctg"
                value={params.ctg || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, ctg: e.target.value, page: 1 }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
              />
            </Grid>
            <Grid item xs={12}>
              <FilterEquipment value={params.equipment_id} name={'equipment_id'} label={'Equipment'} setData={setParams} />
            </Grid>
            <Grid item xs={12}>
              <FilterKaryawan value={params.karyawan_id} name={'karyawan_id'} label={'Operator / Driver'} setData={setParams} />
            </Grid>
            <Grid item xs={12}>
              <FilterLokasiPit value={params.lokasi_id} name={'lokasi_id'} label={'Lokasi'} setData={setParams} />
            </Grid>
            <Grid item xs={12}>
              <FilterLokasiPit value={params.lokasi_to} name={'lokasi_to'} label={'Lokasi Tujuan'} setData={setParams} />
            </Grid>
            <Grid item xs={12}>
              <FilterCabang value={params.cabang_id} name={'cabang_id'} label={'Cabang'} setData={setParams} />
            </Grid>

            <Grid item xs={12}>
              <InputLabel>Keterangan</InputLabel>
              <InputSearch
                placeholder="Cari keterangan"
                value={params.keterangan || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, keterangan: e.target.value, page: 1 }))}
              />
            </Grid>
            <Grid item xs={12}>
              <SelectForm
                array={[
                  { key: 'Y', teks: 'Aktif' },
                  { key: 'N', teks: 'Tidak Aktif' }
                ]}
                label="Aktif"
                name="aktif"
                value={params.aktif || 'Y'}
                onChange={(e) => setParams((prev) => ({ ...prev, aktif: e.target.value, page: 1 }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" color="secondary" startIcon={<CloseCircle />} onClick={onReset}>
                  Reset
                </Button>
                <Button variant="contained" startIcon={<TickCircle />} onClick={onClose}>
                  Terapkan
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Box>
    </SwipeableDrawer>
  );
}
