'use client';

import { useEffect, useMemo, useState } from 'react';

import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';

import { CloseSquare } from 'iconsax-react';
import { useGetGudang } from 'api/gudang';

export default function FilterShippingOrder({ count, data, setData, open, onClose }) {
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
    let count = 0;
    if (data.kode) count++;
    if (data.narasi) count++;
    if (data.startDate) count++;
    if (data.endDate) count++;
    if (data.gudang_id) count++;
    return count;
  }, [data]);

  const handleChange = (field) => (e) => {
    setData((prev) => ({ ...prev, page: 1, [field]: e.target.value }));
  };

  const handleReset = () => {
    setKodeInput('');
    setNarasiInput('');
    setData((prev) => ({
      ...prev,
      page: 1,
      kode: '',
      narasi: '',
      startDate: '',
      endDate: '',
      gudang_id: ''
    }));
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Filter ({filterCount}) · {count || 0} data
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseSquare />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2.5}>
          <TextField
            label="Kode"
            size="small"
            fullWidth
            value={kodeInput}
            onChange={(event) => setKodeInput(event.target.value)}
          />
          <TextField
            label="Keterangan"
            size="small"
            fullWidth
            value={narasiInput}
            onChange={(event) => setNarasiInput(event.target.value)}
          />
          <TextField
            label="Mulai Tanggal"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={data.startDate}
            onChange={handleChange('startDate')}
            inputProps={{ max: data.endDate || undefined }}
          />
          <TextField
            label="Hingga Tanggal"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={data.endDate}
            onChange={handleChange('endDate')}
            inputProps={{ min: data.startDate || undefined }}
          />
          <TextField
            select
            label="Gudang Tujuan"
            size="small"
            fullWidth
            value={data.gudang_id}
            onChange={handleChange('gudang_id')}
            disabled={gudangLoading}
          >
            <MenuItem value="">Semua gudang</MenuItem>
            {gudangRows.map((gudang) => (
              <MenuItem key={gudang.id} value={gudang.id}>
                {gudang.kode || '-'} - {gudang.nama || '-'}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" color="secondary" onClick={handleReset} fullWidth>
            Reset Filter
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
