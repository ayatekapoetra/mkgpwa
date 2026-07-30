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

export default function FilterGoodsReceipt({ count, data, setData, open, onClose }) {
  const [kodeReceiptInput, setKodeReceiptInput] = useState(data.kodeReceipt || '');
  const [kodeSjInput, setKodeSjInput] = useState(data.kodeSj || '');
  const [narasiInput, setNarasiInput] = useState(data.narasi || '');
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();

  useEffect(() => setKodeReceiptInput(data.kodeReceipt || ''), [data.kodeReceipt]);
  useEffect(() => setKodeSjInput(data.kodeSj || ''), [data.kodeSj]);
  useEffect(() => setNarasiInput(data.narasi || ''), [data.narasi]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData((prev) => {
        if (prev.kodeReceipt === kodeReceiptInput && prev.kodeSj === kodeSjInput && prev.narasi === narasiInput) return prev;
        return { ...prev, page: 1, kodeReceipt: kodeReceiptInput, kodeSj: kodeSjInput, narasi: narasiInput };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [kodeReceiptInput, kodeSjInput, narasiInput, setData]);

  const filterCount = useMemo(() => {
    let applied = 0;
    if (data.kodeReceipt) applied += 1;
    if (data.kodeSj) applied += 1;
    if (data.narasi) applied += 1;
    if (data.startDate) applied += 1;
    if (data.endDate) applied += 1;
    if (data.gudangId) applied += 1;
    return applied;
  }, [data]);

  const selectedGudang = useMemo(
    () => (gudangRows || []).find((item) => String(item.id) === String(data.gudangId || '')) || null,
    [data.gudangId, gudangRows]
  );

  const handleChange = (field) => (event) => {
    setData((prev) => ({ ...prev, page: 1, [field]: event.target.value }));
  };

  const handleReset = () => {
    setKodeReceiptInput('');
    setKodeSjInput('');
    setNarasiInput('');
    setData((prev) => ({
      ...prev,
      page: 1,
      kodeReceipt: '',
      kodeSj: '',
      narasi: '',
      startDate: '',
      endDate: '',
      gudangId: ''
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
          <TextField label="Kode Receipt" size="small" fullWidth value={kodeReceiptInput} onChange={(event) => setKodeReceiptInput(event.target.value)} />
          <TextField label="Kode Surat Jalan" size="small" fullWidth value={kodeSjInput} onChange={(event) => setKodeSjInput(event.target.value)} />
          <TextField label="Narasi" size="small" fullWidth value={narasiInput} onChange={(event) => setNarasiInput(event.target.value)} />
          <TextField label="Mulai Tanggal" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={data.startDate} onChange={handleChange('startDate')} inputProps={{ max: data.endDate || undefined }} />
          <TextField label="Hingga Tanggal" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={data.endDate} onChange={handleChange('endDate')} inputProps={{ min: data.startDate || undefined }} />
          <Autocomplete
            options={gudangRows || []}
            value={selectedGudang}
            loading={gudangLoading}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, gudangId: option?.id || '' }))}
            renderInput={(params) => <TextField {...params} label="Gudang" size="small" />}
          />
          <Button variant="outlined" color="secondary" onClick={handleReset} fullWidth>
            Reset Filter
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
