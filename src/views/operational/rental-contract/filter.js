'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Drawer, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, Chip, Autocomplete } from '@mui/material';
import { Filter, SearchNormal1 } from 'iconsax-react';
import { statusLabel, useRentalEquipmentOptions } from 'api/rental-contract';
import { useGetPenyewa } from 'api/penyewa';

const roleOptions = [
  { value: '', label: 'Semua Role' },
  { value: 'MAIN', label: 'Main' },
  { value: 'BACKUP', label: 'Backup' }
];

const billingOptions = [
  { value: '', label: 'Semua Skema' },
  { value: 'HOUR', label: 'Per Jam' },
  { value: 'DAY', label: 'Per Hari' },
  { value: 'MONTH', label: 'Per Bulan' }
];

const initialFilters = {
  contract_number: '',
  penyewa_id: '',
  status: '',
  notes: '',
  role: '',
  billing_unit: '',
  equipment_ids: []
};

export default function FilterRentalContract({ open, onClose, data, setData, count = 0 }) {
  const [draft, setDraft] = useState(data || initialFilters);
  const { data: equipmentOptions, loading: equipmentLoading } = useRentalEquipmentOptions({ limit: 1000 });
  const { penyewa } = useGetPenyewa({ page: 1, perPage: 1000 });

  useEffect(() => {
    if (open) setDraft(data || initialFilters);
  }, [open, data]);

  const setFieldValue = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const handleApply = () => {
    setData((prev) => ({ ...prev, ...draft, page: 1 }));
    onClose?.();
  };

  const handleReset = () => {
    const reset = { ...initialFilters, page: 1, per_page: data?.per_page || 25 };
    setDraft(reset);
    setData(reset);
    onClose?.();
  };

  const activeFilterCount = Object.entries(draft).filter(([key, value]) => {
    if (key === 'page' || key === 'per_page' || key === 'search') return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== null && value !== undefined;
  }).length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Filter size={20} />
            <Typography variant="h5">Filter Kontrak</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">{count} data</Typography>
        </Stack>

        {activeFilterCount > 0 && <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {Object.entries(draft).filter(([key, value]) => {
            if (key === 'page' || key === 'per_page' || key === 'search') return false;
            if (Array.isArray(value)) return value.length > 0;
            return value !== '' && value !== null && value !== undefined;
          }).map(([key, value]) => <Chip key={key} size="small" label={`${key}: ${Array.isArray(value) ? value.length + ' item' : value}`} onDelete={() => setFieldValue(key, Array.isArray(value) ? [] : '')} />)}
        </Stack>}

        <TextField label="Kode kontrak" placeholder="Cari nomor kontrak" value={draft.contract_number || ''} onChange={(e) => setFieldValue('contract_number', e.target.value)} fullWidth size="small" />

        <Autocomplete
          options={penyewa || []}
          value={(penyewa || []).find((p) => String(p.id) === String(draft.penyewa_id)) || null}
          getOptionLabel={(option) => option?.nama || option?.name || option?.kode || ''}
          isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
          onChange={(_, option) => setFieldValue('penyewa_id', option?.id || '')}
          renderInput={(params) => <TextField {...params} label="Penyewa" size="small" />}
        />

        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={draft.status || ''} onChange={(e) => setFieldValue('status', e.target.value)}>
            <MenuItem value="">Semua Status</MenuItem>
            {Object.keys(statusLabel).map((s) => <MenuItem key={s} value={s}>{statusLabel[s]}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField label="Narasi / Catatan" placeholder="Cari berdasarkan catatan kontrak" value={draft.notes || ''} onChange={(e) => setFieldValue('notes', e.target.value)} fullWidth size="small" />

        <FormControl fullWidth size="small">
          <InputLabel>Role Equipment</InputLabel>
          <Select label="Role Equipment" value={draft.role || ''} onChange={(e) => setFieldValue('role', e.target.value)}>
            {roleOptions.map((opt) => <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Skema Tarif</InputLabel>
          <Select label="Skema Tarif" value={draft.billing_unit || ''} onChange={(e) => setFieldValue('billing_unit', e.target.value)}>
            {billingOptions.map((opt) => <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>

        <Autocomplete
          multiple
          options={equipmentOptions || []}
          loading={equipmentLoading}
          value={(equipmentOptions || []).filter((opt) => (draft.equipment_ids || []).some((id) => String(id) === String(opt.id)))}
          getOptionLabel={(option) => option?.kode || option?.nama || String(option?.id || '')}
          isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
          onChange={(_, options) => setFieldValue('equipment_ids', options.map((o) => o.id))}
          renderTags={(options, getTagProps) => options.map((option, index) => <Chip {...getTagProps({ index })} key={option.id} size="small" label={option.kode || option.nama} color="primary" variant="outlined" />)}
          renderInput={(params) => <TextField {...params} label="Equipment (multi)" size="small" placeholder="Pilih satu atau beberapa equipment" />}
        />

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1.5}>
          <Button fullWidth variant="outlined" color="secondary" onClick={handleReset}>Reset</Button>
          <Button fullWidth variant="contained" onClick={handleApply}>Terapkan</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}