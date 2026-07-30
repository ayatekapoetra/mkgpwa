'use client';

import { useEffect, useMemo, useState } from 'react';

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
import { useGetGudang } from 'api/gudang';

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'delivering', label: 'Delivering' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function FilterWarehouseTransfers({ count, data, setData, open, onClose }) {
  const [kodeInput, setKodeInput] = useState(data.kode || '');
  const [narasiInput, setNarasiInput] = useState(data.narasi || '');
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();

  useEffect(() => setKodeInput(data.kode || ''), [data.kode]);
  useEffect(() => setNarasiInput(data.narasi || ''), [data.narasi]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData((prev) => {
        if (prev.kode === kodeInput && prev.narasi === narasiInput) return prev;
        return { ...prev, page: 1, kode: kodeInput, narasi: narasiInput };
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [kodeInput, narasiInput, setData]);

  const filterCount = useMemo(() => {
    let applied = 0;
    if (data.kode) applied += 1;
    if (data.narasi) applied += 1;
    if (data.status) applied += 1;
    if (data.gudang_src) applied += 1;
    if (data.gudang_target) applied += 1;
    return applied;
  }, [data]);

  const selectedGudangSource = useMemo(
    () => (gudangRows || []).find((item) => String(item.id) === String(data.gudang_src || '')) || null,
    [data.gudang_src, gudangRows]
  );

  const selectedGudangTarget = useMemo(
    () => (gudangRows || []).find((item) => String(item.id) === String(data.gudang_target || '')) || null,
    [data.gudang_target, gudangRows]
  );

  const selectedStatus = useMemo(
    () => statusOptions.find((item) => item.value === (data.status || '')) || statusOptions[0],
    [data.status]
  );

  const handleReset = () => {
    setKodeInput('');
    setNarasiInput('');
    setData((prev) => ({
      ...prev,
      page: 1,
      kode: '',
      narasi: '',
      status: '',
      gudang_src: '',
      gudang_target: ''
    }));
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Filter ({filterCount}) · {count || 0} data</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseSquare />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2.5}>
          <TextField label="Kode Transfer" size="small" fullWidth value={kodeInput} onChange={(event) => setKodeInput(event.target.value)} />
          <TextField label="Narasi" size="small" fullWidth value={narasiInput} onChange={(event) => setNarasiInput(event.target.value)} />
          <Autocomplete
            options={statusOptions}
            value={selectedStatus}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, status: option?.value || '' }))}
            renderInput={(params) => <TextField {...params} label="Status" size="small" />}
          />
          <Autocomplete
            options={gudangRows || []}
            value={selectedGudangSource}
            loading={gudangLoading}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, gudang_src: option?.id || '' }))}
            renderInput={(params) => <TextField {...params} label="Gudang Sumber" size="small" />}
          />
          <Autocomplete
            options={gudangRows || []}
            value={selectedGudangTarget}
            loading={gudangLoading}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, gudang_target: option?.id || '' }))}
            renderInput={(params) => <TextField {...params} label="Gudang Tujuan" size="small" />}
          />
          <Button variant="outlined" color="secondary" onClick={handleReset} fullWidth>
            Reset Filter
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
