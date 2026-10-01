'use client';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { CloseSquare } from 'iconsax-react';
import { useStokopnameReportOptions } from 'api/stokopname-report';

export default function StokopnameReportFilter({ open, count, draftParams, setDraftParams, onApply, onReset, onClose }) {
  const businesses = useStokopnameReportOptions('businesses', open, {});
  const cabangs = useStokopnameReportOptions('cabangs', open, { bisnis_id: draftParams.bisnis_id || '' });
  const warehouses = useStokopnameReportOptions('warehouses', open, { bisnis_id: draftParams.bisnis_id || '', cabang_id: draftParams.cabang_id || '' });

  const setField = (key, value) => setDraftParams((prev) => ({ ...prev, [key]: value }));

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 380 }, p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Filter · {count || 0} rack</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseSquare />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2.5}>
          <TextField label="Tanggal Awal" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={draftParams.date_from} onChange={(e) => setField('date_from', e.target.value)} />
          <TextField label="Tanggal Akhir" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={draftParams.date_to} onChange={(e) => setField('date_to', e.target.value)} />
          <Autocomplete
            options={businesses.options || []}
            loading={businesses.loading}
            value={(businesses.options || []).find((item) => String(item.id) === String(draftParams.bisnis_id || '')) || null}
            getOptionLabel={(option) => option.label || option.name || '-'}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setField('bisnis_id', option?.id || '')}
            renderInput={(params) => <TextField {...params} label="Bisnis" size="small" />}
          />
          <Autocomplete
            options={cabangs.options || []}
            loading={cabangs.loading}
            value={(cabangs.options || []).find((item) => String(item.id) === String(draftParams.cabang_id || '')) || null}
            getOptionLabel={(option) => option.label || option.name || '-'}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setField('cabang_id', option?.id || '')}
            renderInput={(params) => <TextField {...params} label="Cabang" size="small" />}
          />
          <Autocomplete
            options={warehouses.options || []}
            loading={warehouses.loading}
            value={(warehouses.options || []).find((item) => String(item.id) === String(draftParams.gudang_id || '')) || null}
            getOptionLabel={(option) => option.label || option.name || '-'}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setField('gudang_id', option?.id || '')}
            renderInput={(params) => <TextField {...params} label="Gudang" size="small" />}
          />
          <TextField label="Cari Rack" size="small" fullWidth value={draftParams.rack_search || ''} onChange={(e) => setField('rack_search', e.target.value)} />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onApply} fullWidth>
              Terapkan
            </Button>
            <Button variant="outlined" color="secondary" onClick={onReset} fullWidth>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
