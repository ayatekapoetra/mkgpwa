'use client';

import { Box, Button, Grid, Stack, SwipeableDrawer, TextField, Typography, Alert } from '@mui/material';
import { CalendarMonth, Refresh, Filter } from '@mui/icons-material';
import moment from 'moment';

import MainCard from 'components/MainCard';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionCabang from 'components/OptionCabang';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionShiftKerja from 'components/OptionShiftKerja';

export default function RekapRitaseFilter({
  open,
  onClose,
  params,
  setParams,
  onReset,
  anchor = 'right'
}) {
  const isDateRangeTooLong = Boolean(
    params.start_date &&
      params.end_date &&
      moment(params.end_date).diff(moment(params.start_date), 'days') > 93
  );

  const setFieldValue = (name, val) => {
    setParams((prev) => ({
      ...prev,
      [name]: val,
      page: 1
    }));
  };

  return (
    <SwipeableDrawer anchor={anchor} open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen>
      <Box sx={{ width: { xs: 320, sm: 380 }, p: 2 }} role="presentation">
        <MainCard
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <Filter fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                Filter Rekap Ritase
              </Typography>
            </Stack>
          }
          content
        >
          <Grid container spacing={2}>
            {isDateRangeTooLong && (
              <Grid item xs={12}>
                <Alert severity="error">
                  Rentang tanggal melebihi 93 hari (maksimal 1 kuartal sesuai kontrak).
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <OptionBisnisUnit
                value={params.bisnis_id || ''}
                name="bisnis_id"
                label="Unit Bisnis"
                setFieldValue={setFieldValue}
              />
            </Grid>

            <Grid item xs={12}>
              <OptionCabang
                value={params.cabang_id || ''}
                name="cabang_id"
                label="Cabang / Site"
                setFieldValue={setFieldValue}
              />
            </Grid>

            <Grid item xs={12}>
              <OptionPenyewa
                value={params.penyewa_id || ''}
                name="penyewa_id"
                label="Pelanggan / IUP"
                setFieldValue={setFieldValue}
              />
            </Grid>

            <Grid item xs={12}>
              <OptionShiftKerja
                value={params.shift_id || ''}
                name="shift_id"
                label="Shift"
                setFieldValue={setFieldValue}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Tanggal Mulai"
                size="small"
                value={params.start_date || ''}
                onChange={(e) => setFieldValue('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Tanggal Selesai"
                size="small"
                value={params.end_date || ''}
                onChange={(e) => setFieldValue('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button variant="outlined" color="secondary" startIcon={<Refresh />} onClick={onReset}>
                  Reset
                </Button>
                <Button variant="contained" color="primary" onClick={onClose} disabled={isDateRangeTooLong}>
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
