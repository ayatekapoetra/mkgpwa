'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import OptionCabang from 'components/OptionCabang';
import OptionEquipment from 'components/OptionEquipment';
import OptionPenyewa from 'components/OptionPenyewa';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_TRANSIT', label: 'Dalam Pengiriman' },
  { value: 'ARRIVED', label: 'Tiba' },
  { value: 'CANCELLED', label: 'Dibatalkan' }
];

export default function FilterEquipmentMobilization({ open, onClose, data, setData, count = 0 }) {
  const [draft, setDraft] = useState(data || {});

  useEffect(() => {
    if (open) setDraft(data || {});
  }, [open, data]);

  const setFieldValue = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    setData((prev) => ({
      ...prev,
      ...draft,
      page: 1
    }));
    onClose?.();
  };

  const handleReset = () => {
    const reset = {
      page: 1,
      limit: data?.limit || 20,
      search: '',
      status: '',
      movement_date_start: '',
      movement_date_end: '',
      origin_branch_id: '',
      destination_branch_id: '',
      origin_tenant_id: '',
      destination_tenant_id: '',
      equipment_id: ''
    };
    setDraft(reset);
    setData(reset);
    onClose?.();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Filter Mobilisasi</Typography>
          <Typography variant="caption" color="text.secondary">
            {count} data
          </Typography>
        </Stack>

        <TextField
          label="Cari nomor dokumen"
          value={draft.search || ''}
          onChange={(e) => setFieldValue('search', e.target.value)}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={draft.status || ''}
            onChange={(e) => setFieldValue('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Tanggal mulai"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={draft.movement_date_start || ''}
            onChange={(e) => setFieldValue('movement_date_start', e.target.value)}
            helperText={draft.movement_date_start ? moment(draft.movement_date_start).format('DD MMM YYYY') : ' '}
          />
          <TextField
            label="Tanggal akhir"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={draft.movement_date_end || ''}
            onChange={(e) => setFieldValue('movement_date_end', e.target.value)}
            helperText={draft.movement_date_end ? moment(draft.movement_date_end).format('DD MMM YYYY') : ' '}
          />
        </Stack>

        <OptionCabang
          label="Cabang Asal"
          name="origin_branch_id"
          value={draft.origin_branch_id || ''}
          setFieldValue={setFieldValue}
        />
        <OptionCabang
          label="Cabang Tujuan"
          name="destination_branch_id"
          value={draft.destination_branch_id || ''}
          setFieldValue={setFieldValue}
        />
        <OptionPenyewa
          label="Penyewa Asal"
          name="origin_tenant_id"
          value={draft.origin_tenant_id || ''}
          setFieldValue={setFieldValue}
        />
        <OptionPenyewa
          label="Penyewa Tujuan"
          name="destination_tenant_id"
          value={draft.destination_tenant_id || ''}
          setFieldValue={setFieldValue}
        />
        <OptionEquipment
          label="Equipment"
          name="equipment_id"
          value={draft.equipment_id || ''}
          setFieldValue={setFieldValue}
        />

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1.5}>
          <Button fullWidth variant="outlined" color="secondary" onClick={handleReset}>
            Reset
          </Button>
          <Button fullWidth variant="contained" onClick={handleApply}>
            Terapkan
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
