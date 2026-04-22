'use client';

import { Box, Grid, Stack, SwipeableDrawer, Button, InputAdornment } from '@mui/material';
import { Add, Building, Calendar, Location, Profile2User } from 'iconsax-react';

import MainCard from 'components/MainCard';
import InputSearch from 'components/InputSearch';
import SelectForm from 'components/SelectForm';

const activeOptions = [
  { key: '', teks: 'Semua Status' },
  { key: 'Y', teks: 'Active (Y)' },
  { key: 'N', teks: 'Inactive (N)' }
];

export default function MiningProductionPlanFilter({ open, onClose, params, setParams, anchor = 'right' }) {
  const handleReset = () => {
    setParams({
      page: 1,
      per_page: 25,
      periode: '',
      contractor_id: '',
      iupowner_id: '',
      lokasi_id: '',
      material_id: '',
      aktif: 'Y',
      keyword: ''
    });
  };

  return (
    <SwipeableDrawer anchor={anchor} open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen>
      <Box sx={{ width: { xs: 320, sm: 360 }, p: 2 }} role="presentation">
        <MainCard title="Filter Mining Production Plan" content>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <InputSearch
                label="Periode (YYYYMM)"
                type="text"
                value={params.periode || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, periode: e.target.value }))}
                startAdornment={
                  <InputAdornment position="start">
                    <Calendar size={16} />
                  </InputAdornment>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                label="Contractor ID"
                type="number"
                value={params.contractor_id || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, contractor_id: e.target.value }))}
                startAdornment={
                  <InputAdornment position="start">
                    <Building size={16} />
                  </InputAdornment>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                label="IUP Owner ID"
                type="number"
                value={params.iupowner_id || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, iupowner_id: e.target.value }))}
                startAdornment={
                  <InputAdornment position="start">
                    <Profile2User size={16} />
                  </InputAdornment>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                label="Lokasi ID"
                type="number"
                value={params.lokasi_id || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, lokasi_id: e.target.value }))}
                startAdornment={
                  <InputAdornment position="start">
                    <Location size={16} />
                  </InputAdornment>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                label="Material ID"
                type="number"
                value={params.material_id || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, material_id: e.target.value }))}
                startAdornment={
                  <InputAdornment position="start">
                    <Location size={16} />
                  </InputAdornment>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                label="Keyword"
                type="text"
                value={params.keyword || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, keyword: e.target.value }))}
                startAdornment={
                  <InputAdornment position="start">
                    <Profile2User size={16} />
                  </InputAdornment>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <SelectForm
                array={activeOptions}
                label="Status Active"
                name="aktif"
                value={params.aktif || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, aktif: e.target.value }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" color="secondary" onClick={handleReset}>
                  Reset
                </Button>
                <Button variant="contained" onClick={onClose} startIcon={<Add style={{ transform: 'rotate(45deg)' }} />}>
                  Tutup
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Box>
    </SwipeableDrawer>
  );
}
