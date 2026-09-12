'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';

import { useGetArea } from 'api/area';
import { useGetPenyewa } from 'api/penyewa';
import { useGetShiftKerja } from 'api/shiftkerja';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'HE', label: 'Heavy Equipment' },
  { value: 'DT', label: 'Dump Truck' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'beroperasi', label: 'Beroperasi' },
  { value: 'standby', label: 'Standby' },
  { value: 'breakdown', label: 'Breakdown' }
];

const EMPTY_FILTER = {
  date_ops: '',
  shift_id: '',
  area: '',
  lokasi_site_id: '',
  ctgunit: '',
  status: '',
  search: ''
};

export default function FleetAssignmentFilter({ open, onClose, scope, setScope }) {
  const [draft, setDraft] = useState(scope || EMPTY_FILTER);

  useEffect(() => {
    if (open) setDraft(scope || EMPTY_FILTER);
  }, [open, scope]);

  const setFieldValue = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const handleApply = () => {
    setScope((prev) => ({ ...prev, ...draft }));
    onClose?.();
  };

  const handleReset = () => {
    const reset = { ...EMPTY_FILTER, date_ops: scope?.date_ops || '' };
    setDraft(reset);
    setScope((prev) => ({ ...prev, ...reset }));
    onClose?.();
  };

  const { data: shiftOptions, dataLoading: shiftLoading } = useGetShiftKerja();
  const { area: areaOptions, areaLoading } = useGetArea();
  const { penyewa: penyewaOptions, penyewaLoading } = useGetPenyewa({ page: 1, perPages: 1000 });

  const shifts = Array.isArray(shiftOptions) ? shiftOptions : [];
  const areas = Array.isArray(areaOptions) ? areaOptions : [];
  const penyewa = Array.isArray(penyewaOptions) ? penyewaOptions : [];

  const penyewaSelected = penyewa.find((option) => String(option?.id) === String(draft.lokasi_site_id)) || null;

  const activeCount = Object.entries(draft).filter(([key, value]) => key !== 'date_ops' && value && String(value).trim() !== '').length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <TuneIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>Filter</Typography>
              {activeCount > 0 && (
                <Box sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  {activeCount}
                </Box>
              )}
            </Stack>
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
          <Stack spacing={2.25}>
            <TextField
              label="Tanggal operasi"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={draft.date_ops || ''}
              onChange={(e) => setFieldValue('date_ops', e.target.value)}
              helperText={draft.date_ops ? moment(draft.date_ops).format('DD MMMM YYYY') : ' '}
            />

            <FormControl fullWidth>
              <InputLabel>Shift</InputLabel>
              <Select
                label="Shift"
                value={draft.shift_id || ''}
                onChange={(e) => setFieldValue('shift_id', e.target.value)}
                disabled={shiftLoading}
              >
                <MenuItem value="">Semua Shift</MenuItem>
                {shifts.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.nama || option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              fullWidth
              options={areas}
              value={areas.find((option) => option === draft.area) || null}
              onChange={(e, newValue) => setFieldValue('area', newValue || '')}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option?.nama || option?.name || '')}
              isOptionEqualToValue={(option, value) => option === value}
              loading={areaLoading}
              renderInput={(params) => <TextField {...params} label="Area" />}
            />

            <Autocomplete
              fullWidth
              options={penyewa}
              value={penyewaSelected}
              onChange={(e, newValue) => setFieldValue('lokasi_site_id', newValue?.id || '')}
              getOptionLabel={(option) => option?.nama || option?.name || ''}
              isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
              loading={penyewaLoading}
              renderInput={(params) => <TextField {...params} label="Penyewa (Lokasi Site)" />}
            />

            <FormControl fullWidth>
              <InputLabel>Kategori</InputLabel>
              <Select
                label="Kategori"
                value={draft.ctgunit || ''}
                onChange={(e) => setFieldValue('ctgunit', e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={draft.status || ''}
                onChange={(e) => setFieldValue('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Cari equipment"
              value={draft.search || ''}
              onChange={(e) => setFieldValue('search', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" color="secondary" onClick={handleReset} sx={{ borderRadius: 2, py: 1.1 }}>
              Reset
            </Button>
            <Button fullWidth variant="contained" onClick={handleApply} sx={{ borderRadius: 2, py: 1.1 }}>
              Terapkan
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
