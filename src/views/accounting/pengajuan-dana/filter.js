'use client';

import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography
} from '@mui/material';
import { Add, Building3, Calendar, Filter, NoteText, Profile2User, SearchNormal1 } from 'iconsax-react';

import { useGetBisnisUnit } from 'api/bisnis-unit';
import { useGetCabang } from 'api/cabang';
import { useUserKaryawan } from 'api/users';

const emptyFilters = {
  status: '',
  kategori: '',
  bisnis_id: '',
  cabang_id: '',
  author_id: '',
  kode: '',
  narasi: '',
  date_start: '',
  date_end: '',
  limit: 25
};

const getDraft = (params = {}) => ({
  status: params.status || '',
  kategori: params.kategori || '',
  bisnis_id: params.bisnis_id || '',
  cabang_id: params.cabang_id || '',
  author_id: params.author_id || '',
  kode: params.kode || '',
  narasi: params.narasi || '',
  date_start: params.date_start || '',
  date_end: params.date_end || '',
  limit: Number(params.limit || 25)
});

export default function PengajuanDanaFilter({ open, onClose, params, onApply, onReset }) {
  const [draft, setDraft] = useState(() => getDraft(params));
  const { bisnisUnit } = useGetBisnisUnit({ my_units: true });
  const { cabang } = useGetCabang();
  const { data: authors = [], dataLoading: authorsLoading } = useUserKaryawan();

  const bisnisOptions = Array.isArray(bisnisUnit?.rows) ? bisnisUnit.rows : [];
  const allCabangOptions = cabang?.rows || cabang?.data || [];
  const cabangOptions = (Array.isArray(allCabangOptions) ? allCabangOptions : []).filter(
    (item) => !draft.bisnis_id || !item.bisnis_id || String(item.bisnis_id) === String(draft.bisnis_id)
  );
  const authorOptions = Array.isArray(authors) ? authors : [];

  useEffect(() => {
    if (open) setDraft(getDraft(params));
  }, [open, params]);

  const setField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleReset = () => {
    setDraft(emptyFilters);
    onReset();
  };

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 40, height: 40, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <Filter size={20} />
            </Box>
            <Box>
              <Typography variant="h6">Filter Pengajuan Dana</Typography>
              <Typography variant="caption" color="text.secondary">Atur kriteria lalu terapkan filter</Typography>
            </Box>
          </Stack>
          <IconButton color="error" onClick={onClose} aria-label="Tutup filter">
            <Add size={22} style={{ transform: 'rotate(45deg)' }} />
          </IconButton>
        </Stack>

        <Divider />

        <Stack spacing={2.25} sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Pencarian Dokumen</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Kode Pengajuan"
                value={draft.kode}
                onChange={setField('kode')}
                placeholder="Contoh: PD-2607..."
                InputProps={{ startAdornment: <SearchNormal1 size={17} style={{ marginRight: 8 }} /> }}
              />
              <TextField
                fullWidth
                label="Narasi"
                value={draft.narasi}
                onChange={setField('narasi')}
                placeholder="Cari isi narasi"
                InputProps={{ startAdornment: <NoteText size={17} style={{ marginRight: 8 }} /> }}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Organisasi & Pembuat</Typography>
            <Stack spacing={2}>
              <Autocomplete
                options={bisnisOptions}
                value={bisnisOptions.find((item) => String(item.id) === String(draft.bisnis_id)) || null}
                onChange={(_event, option) => {
                  setDraft((current) => ({ ...current, bisnis_id: option?.id ? String(option.id) : '', cabang_id: '' }));
                }}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => option.name || option.initial || option.kode || ''}
                renderInput={(inputParams) => (
                  <TextField {...inputParams} label="Bisnis Unit" InputProps={{ ...inputParams.InputProps, startAdornment: <><Building3 size={17} style={{ marginRight: 8 }} />{inputParams.InputProps.startAdornment}</> }} />
                )}
              />
              <Autocomplete
                options={cabangOptions}
                value={cabangOptions.find((item) => String(item.id) === String(draft.cabang_id)) || null}
                onChange={(_event, option) => {
                  setDraft((current) => ({ ...current, cabang_id: option?.id ? String(option.id) : '' }));
                }}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => option.nama || option.initial || option.kode || ''}
                renderInput={(inputParams) => <TextField {...inputParams} label="Cabang" />}
              />
              <Autocomplete
                loading={authorsLoading}
                options={authorOptions}
                value={authorOptions.find((item) => String(item.id) === String(draft.author_id)) || null}
                onChange={(_event, option) => {
                  setDraft((current) => ({ ...current, author_id: option?.id ? String(option.id) : '' }));
                }}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={(option) => option.nmlengkap || option.nama_lengkap || option.username || ''}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack>
                      <Typography variant="body2" fontWeight={700}>{option.nmlengkap || option.nama_lengkap || option.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.usertype || '-'}</Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(inputParams) => (
                  <TextField {...inputParams} label="Author Dokumen" InputProps={{ ...inputParams.InputProps, startAdornment: <><Profile2User size={17} style={{ marginRight: 8 }} />{inputParams.InputProps.startAdornment}</> }} />
                )}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Status & Kategori</Typography>
            <Stack spacing={2}>
              <TextField select fullWidth label="Status" value={draft.status} onChange={setField('status')}>
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="approval">Approval</MenuItem>
                <MenuItem value="close">Close</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
              </TextField>
              <TextField select fullWidth label="Kategori" value={draft.kategori} onChange={setField('kategori')}>
                <MenuItem value="">Semua Kategori</MenuItem>
                <MenuItem value="direct-paid">Direct Paid</MenuItem>
                <MenuItem value="reimburse">Reimburse</MenuItem>
              </TextField>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Periode Transaksi</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Tanggal Mulai"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={draft.date_start}
                onChange={setField('date_start')}
                InputProps={{ startAdornment: <Calendar size={17} style={{ marginRight: 8 }} /> }}
              />
              <TextField
                fullWidth
                label="Tanggal Akhir"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={draft.date_end}
                onChange={setField('date_end')}
                inputProps={{ min: draft.date_start || undefined }}
                InputProps={{ startAdornment: <Calendar size={17} style={{ marginRight: 8 }} /> }}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Tampilan Data</Typography>
            <TextField select fullWidth label="Jumlah Baris per Halaman" value={draft.limit} onChange={setField('limit')}>
              {[10, 25, 50, 100].map((size) => (
                <MenuItem key={size} value={size}>{size} baris</MenuItem>
              ))}
            </TextField>
          </Box>
        </Stack>

        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ p: 2.5 }}>
          <Button fullWidth variant="outlined" color="secondary" onClick={handleReset}>Reset</Button>
          <Button fullWidth variant="contained" onClick={() => onApply(draft)} disabled={Boolean(draft.date_start && draft.date_end && draft.date_end < draft.date_start)}>
            Terapkan Filter
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
}
