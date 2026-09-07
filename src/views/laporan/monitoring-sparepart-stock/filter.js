'use client';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { useMonitoringSparepartStockOptions } from 'api/monitoring-sparepart-stock';

const optionId = (option) => String(option?.id ?? '');
const optionLabel = (option) => option?.label || [option?.code, option?.name].filter(Boolean).join(' - ') || optionId(option);
const selectedOption = (options, selected) => options.find((option) => optionId(option) === String(selected)) || null;

function OptionField({ label, result, value, onChange, disabled = false }) {
  return (
    <Autocomplete
      options={result.options}
      loading={result.loading}
      value={selectedOption(result.options, value)}
      onChange={(_, option) => onChange(option ? optionId(option) : '')}
      isOptionEqualToValue={(option, selected) => optionId(option) === optionId(selected)}
      getOptionLabel={optionLabel}
      disabled={disabled}
      renderInput={(input) => (
        <TextField
          {...input}
          label={label}
          error={Boolean(result.error)}
          helperText={result.error ? `Gagal memuat opsi ${label.toLowerCase()}` : ''}
          InputProps={{
            ...input.InputProps,
            endAdornment: <>{result.loading ? <CircularProgress size={18} /> : null}{input.InputProps.endAdornment}</>
          }}
        />
      )}
    />
  );
}

export default function MonitoringSparepartStockFilter({ open, count, draftParams, setDraftParams, onApply, onReset, onClose }) {
  const businesses = useMonitoringSparepartStockOptions('businesses', open, { limit: 100 });
  const warehouses = useMonitoringSparepartStockOptions('warehouses', open, { bisnis_id: draftParams.bisnis_id, limit: 100 });
  const racks = useMonitoringSparepartStockOptions('racks', open && Boolean(draftParams.gudang_id), {
    bisnis_id: draftParams.bisnis_id,
    gudang_id: draftParams.gudang_id,
    limit: 100
  });
  const update = (values) => setDraftParams((previous) => ({ ...previous, ...values }));

  return (
    <SwipeableDrawer anchor="right" open={open} onOpen={() => {}} onClose={onClose} PaperProps={{ sx: { maxWidth: '100%' } }}>
      <Stack sx={{ width: { xs: '100vw', sm: 500 }, minHeight: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
          <Stack><Typography variant="h5">Filter Stock Monitoring</Typography><Typography variant="caption" color="text.secondary">{count.toLocaleString('id-ID')} data pada filter aktif</Typography></Stack>
          <IconButton aria-label="Tutup filter" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Divider />
        <Grid container spacing={2} sx={{ p: 2, flex: 1, alignContent: 'flex-start' }}>
          <Grid item xs={12}><OptionField label="Bisnis" result={businesses} value={draftParams.bisnis_id} onChange={(value) => update({ bisnis_id: value, gudang_id: '', rack_id: '' })} /></Grid>
          <Grid item xs={12}><OptionField label="Warehouse" result={warehouses} value={draftParams.gudang_id} onChange={(value) => update({ gudang_id: value, rack_id: '' })} /></Grid>
          <Grid item xs={12}><OptionField label="Rack" result={racks} value={draftParams.rack_id} disabled={!draftParams.gudang_id} onChange={(value) => update({ rack_id: value })} /></Grid>
          <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">PENCARIAN BARANG</Typography></Divider></Grid>
          <Grid item xs={12}><TextField fullWidth label="Kode Barang" value={draftParams.kode} onChange={(event) => update({ kode: event.target.value.slice(0, 200) })} inputProps={{ maxLength: 200 }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Part Number" value={draftParams.numpart} onChange={(event) => update({ numpart: event.target.value.slice(0, 200) })} inputProps={{ maxLength: 200 }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Nama Barang" value={draftParams.nama} onChange={(event) => update({ nama: event.target.value.slice(0, 200) })} inputProps={{ maxLength: 200 }} /></Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={draftParams.stock_used_zero} onChange={(event) => update({ stock_used_zero: event.target.checked })} />}
              label="Hanya item dengan Stock Used = 0"
            />
            <Typography variant="caption" color="text.secondary" display="block">Filter ini berlaku pada tabel, summary, PDF, dan Excel.</Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Switch checked={draftParams.is_min_stok} onChange={(event) => update({ is_min_stok: event.target.checked })} />} label="Hanya barang dengan minimum stock saat export" />
            <Typography variant="caption" color="text.secondary" display="block">Opsi ini hanya memengaruhi PDF dan Excel, sesuai aturan laporan.</Typography>
          </Grid>
        </Grid>
        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" color="secondary" onClick={onReset}>Reset</Button>
          <Button fullWidth variant="contained" onClick={onApply}>Apply Filter</Button>
        </Stack>
      </Stack>
    </SwipeableDrawer>
  );
}
