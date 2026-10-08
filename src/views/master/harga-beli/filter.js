'use client';

import { useEffect, useState } from 'react';
import { Autocomplete, Box, Button, Divider, Drawer, Stack, TextField, Typography } from '@mui/material';
import { CloseSquare } from 'iconsax-react';

export default function HargaBeliFilter({ open, onClose, filters, setFilters, options, total }) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [filters, open]);

  const update = (values) => setDraft((current) => ({ ...current, ...values }));
  const reset = () => {
    const values = { ...filters, page: 1, search: '', barang_id: '', bisnis_id: '', gudang_id: '', periode_from: '', periode_to: '', aktif: 'Y' };
    setDraft(values);
    setFilters(values);
  };
  const selected = (rows, id) => rows.find((row) => String(row.id) === String(id)) || null;
  const availableGudangs = (options.gudangs || []).filter((row) => !draft.bisnis_id || String(row.bisnis_id) === String(draft.bisnis_id));

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">Filter Harga Beli</Typography>
            <Typography variant="caption" color="text.secondary">{total} data ditemukan</Typography>
          </Box>
          <Button color="secondary" onClick={onClose} sx={{ minWidth: 40 }}><CloseSquare size={20} /></Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <TextField label="Pencarian" value={draft.search} onChange={(event) => update({ search: event.target.value })} helperText="Kode, nama barang, atau narasi" />
          <Autocomplete options={options.barangs || []} value={selected(options.barangs || [], draft.barang_id)} getOptionLabel={(row) => `${row.kode || '-'} - ${row.nama || '-'}`} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)} onChange={(_, row) => update({ barang_id: row?.id || '' })} renderInput={(params) => <TextField {...params} label="Barang" />} />
          <Autocomplete options={options.bisnis || []} value={selected(options.bisnis || [], draft.bisnis_id)} getOptionLabel={(row) => `${row.initial || '-'} - ${row.name || '-'}`} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)} onChange={(_, row) => update({ bisnis_id: row?.id || '', gudang_id: '' })} renderInput={(params) => <TextField {...params} label="Bisnis" />} />
          <Autocomplete options={availableGudangs} value={selected(availableGudangs, draft.gudang_id)} getOptionLabel={(row) => `${row.kode || '-'} - ${row.nama || '-'}`} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)} onChange={(_, row) => update({ gudang_id: row?.id || '' })} renderInput={(params) => <TextField {...params} label="Gudang" />} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField fullWidth type="month" label="Periode Dari" value={draft.periode_from} onChange={(event) => update({ periode_from: event.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth type="month" label="Periode Sampai" value={draft.periode_to} onChange={(event) => update({ periode_to: event.target.value })} InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField select SelectProps={{ native: true }} label="Status" value={draft.aktif} onChange={(event) => update({ aktif: event.target.value })}>
            <option value="">Semua status</option><option value="Y">Aktif</option><option value="N">Tidak Aktif</option>
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" color="secondary" onClick={reset}>Reset</Button>
            <Button fullWidth variant="contained" onClick={() => { setFilters((current) => ({ ...current, ...draft, page: 1 })); onClose(); }}>Terapkan</Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
