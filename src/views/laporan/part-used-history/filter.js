'use client';

import { useEffect, useState } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { usePartUsedHistoryOptions } from 'api/part-used-history';

const optionId = (option) => String(option?.id ?? option?.value ?? '');
const optionLabel = (option) =>
  option?.label || option?.nama || option?.name || [option?.kode || option?.code, option?.model].filter(Boolean).join(' - ') || optionId(option);

const selectedOption = (options, selected) =>
  options.find((option) => optionId(option) === String(typeof selected === 'object' ? selected?.id : selected)) || null;

const selectedOptions = (options, selected) => {
  const available = new Map(options.map((option) => [optionId(option), option]));
  return (selected || []).map((item) => available.get(String(typeof item === 'object' ? item?.id : item)) || item).filter(Boolean);
};

export default function PartUsedHistoryFilter({ open, count, draftParams, setDraftParams, onApply, onReset, onClose }) {
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [debouncedEquipmentSearch, setDebouncedEquipmentSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedEquipmentSearch(equipmentSearch.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [equipmentSearch]);

  const businesses = usePartUsedHistoryOptions('businesses', open, { limit: 100 });
  const warehouses = usePartUsedHistoryOptions('warehouses', open, { bisnis_id: draftParams.bisnis_id, limit: 100 });
  const owners = usePartUsedHistoryOptions('owners', open, { bisnis_id: draftParams.bisnis_id, limit: 100 });
  const equipment = usePartUsedHistoryOptions('equipment', open, {
    bisnis_id: draftParams.bisnis_id,
    equipment_owner_id: draftParams.equipment_owner_id,
    search: debouncedEquipmentSearch,
    limit: 100
  });
  const update = (values) => setDraftParams((previous) => ({ ...previous, ...values }));
  const dateInvalid = !draftParams.date_from || !draftParams.date_to || draftParams.date_from > draftParams.date_to;

  return (
    <SwipeableDrawer anchor="right" open={open} onOpen={() => {}} onClose={onClose} PaperProps={{ sx: { maxWidth: '100%' } }}>
      <Stack sx={{ width: { xs: '100vw', sm: 480 }, minHeight: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
          <Stack>
            <Typography variant="h5">Filter Part Used History</Typography>
            <Typography variant="caption" color="text.secondary">{count.toLocaleString('id-ID')} data pada filter aktif</Typography>
          </Stack>
          <IconButton aria-label="Tutup filter" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Divider />
        <Grid container spacing={2} sx={{ p: 2, flex: 1, alignContent: 'flex-start' }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required type="date" label="Tanggal Mulai" value={draftParams.date_from} onChange={(event) => update({ date_from: event.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ max: draftParams.date_to }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required type="date" label="Tanggal Akhir" value={draftParams.date_to} onChange={(event) => update({ date_to: event.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ min: draftParams.date_from }} error={dateInvalid} />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete options={businesses.options} loading={businesses.loading} value={selectedOption(businesses.options, draftParams.bisnis_id)} onChange={(_, value) => update({ bisnis_id: value ? optionId(value) : '', gudang_id: '' })} isOptionEqualToValue={(option, value) => optionId(option) === optionId(value)} getOptionLabel={optionLabel} renderInput={(input) => <TextField {...input} label="Bisnis" InputProps={{ ...input.InputProps, endAdornment: <>{businesses.loading ? <CircularProgress size={18} /> : null}{input.InputProps.endAdornment}</> }} />} />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete options={warehouses.options} loading={warehouses.loading} value={selectedOption(warehouses.options, draftParams.gudang_id)} onChange={(_, value) => update({ gudang_id: value ? optionId(value) : '' })} isOptionEqualToValue={(option, value) => optionId(option) === optionId(value)} getOptionLabel={optionLabel} renderInput={(input) => <TextField {...input} label="Gudang" />} />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete options={owners.options} loading={owners.loading} value={selectedOption(owners.options, draftParams.equipment_owner_id)} onChange={(_, value) => update({ equipment_owner_id: value ? optionId(value) : '' })} isOptionEqualToValue={(option, value) => optionId(option) === optionId(value)} getOptionLabel={optionLabel} renderInput={(input) => <TextField {...input} label="Equipment Owner" />} />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete multiple filterOptions={(options) => options} options={equipment.options} loading={equipment.loading} value={selectedOptions(equipment.options, draftParams.equipment_ids)} onInputChange={(_, value, reason) => { if (reason === 'input' || reason === 'clear') setEquipmentSearch(value); }} onChange={(_, value) => update({ equipment_ids: value })} isOptionEqualToValue={(option, value) => optionId(option) === optionId(value)} getOptionLabel={optionLabel} renderInput={(input) => <TextField {...input} label="Equipment" helperText={`${draftParams.equipment_ids.length}/100 dipilih`} />} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Barang / Part Number" value={draftParams.item_search} onChange={(event) => update({ item_search: event.target.value.slice(0, 200) })} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Narasi" value={draftParams.narrative} onChange={(event) => update({ narrative: event.target.value.slice(0, 200) })} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Penerima" value={draftParams.receiver} onChange={(event) => update({ receiver: event.target.value.slice(0, 200) })} />
          </Grid>
        </Grid>
        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" color="secondary" onClick={onReset}>Reset</Button>
          <Button fullWidth variant="contained" onClick={onApply} disabled={dateInvalid || draftParams.equipment_ids.length > 100}>Apply</Button>
        </Stack>
      </Stack>
    </SwipeableDrawer>
  );
}
