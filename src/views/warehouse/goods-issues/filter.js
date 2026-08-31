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
import { useGetBisnisUnit } from 'api/bisnis-unit';

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'VOIDED', label: 'Voided' }
];

const sourceOptions = [
  { value: '', label: 'Semua Source' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'MATERIAL_REQUEST', label: 'Material Request' },
  { value: 'API', label: 'API' }
];

export default function FilterGoodsIssues({ count, data, setData, open, onClose }) {
  const [kodeInput, setKodeInput] = useState(data.kode || '');
  const [penerimaInput, setPenerimaInput] = useState(data.penerima || '');
  const [narasiInput, setNarasiInput] = useState(data.narasi || '');
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();
  const bisnisUnitHook = useGetBisnisUnit({ my_units: true });
  const bisnisRows = bisnisUnitHook?.bisnisUnit?.rows || [];
  const bisnisLoading = bisnisUnitHook?.bisnisUnitLoading || false;

  useEffect(() => setKodeInput(data.kode || ''), [data.kode]);
  useEffect(() => setPenerimaInput(data.penerima || ''), [data.penerima]);
  useEffect(() => setNarasiInput(data.narasi || ''), [data.narasi]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData((prev) => {
        if (prev.kode === kodeInput && prev.penerima === penerimaInput && prev.narasi === narasiInput) return prev;
        return { ...prev, page: 1, kode: kodeInput, penerima: penerimaInput, narasi: narasiInput };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [kodeInput, penerimaInput, narasiInput, setData]);

  const filterCount = useMemo(() => {
    let applied = 0;
    if (data.kode) applied += 1;
    if (data.penerima) applied += 1;
    if (data.narasi) applied += 1;
    if (data.status) applied += 1;
    if (data.bisnis_id) applied += 1;
    if (data.gudang_id) applied += 1;
    if (data.source_type) applied += 1;
    return applied;
  }, [data]);

  const selectedGudang = useMemo(
    () => (gudangRows || []).find((item) => String(item.id) === String(data.gudang_id || '')) || null,
    [data.gudang_id, gudangRows]
  );

  const selectedBisnis = useMemo(
    () => (bisnisRows || []).find((item) => String(item.id) === String(data.bisnis_id || '')) || null,
    [data.bisnis_id, bisnisRows]
  );

  const selectedStatus = useMemo(
    () => statusOptions.find((item) => item.value === (data.status || '')) || statusOptions[0],
    [data.status]
  );

  const selectedSource = useMemo(
    () => sourceOptions.find((item) => item.value === (data.source_type || '')) || sourceOptions[0],
    [data.source_type]
  );

  const handleReset = () => {
    setKodeInput('');
    setPenerimaInput('');
    setNarasiInput('');
    setData((prev) => ({
      ...prev,
      page: 1,
      kode: '',
      penerima: '',
      narasi: '',
      status: '',
      bisnis_id: '',
      gudang_id: '',
      source_type: ''
    }));
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 380 }, p: 2.5 }}>
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
          <TextField label="Kode Dokumen" size="small" fullWidth value={kodeInput} onChange={(e) => setKodeInput(e.target.value)} />
          <TextField label="Penerima" size="small" fullWidth value={penerimaInput} onChange={(e) => setPenerimaInput(e.target.value)} />
          <TextField
            label="Narasi"
            size="small"
            fullWidth
            value={narasiInput}
            onChange={(e) => setNarasiInput(e.target.value)}
          />
          <Autocomplete
            options={statusOptions}
            value={selectedStatus}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, status: option?.value || '' }))}
            renderInput={(params) => <TextField {...params} label="Status" size="small" />}
          />
          <Autocomplete
            options={sourceOptions}
            value={selectedSource}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, source_type: option?.value || '' }))}
            renderInput={(params) => <TextField {...params} label="Source" size="small" />}
          />
          <Autocomplete
            options={bisnisRows || []}
            value={selectedBisnis}
            loading={bisnisLoading}
            getOptionLabel={(option) => `${option.kode || option.initial || '-'} - ${option.name || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, bisnis_id: option?.id || '' }))}
            renderInput={(params) => <TextField {...params} label="Bisnis" size="small" />}
          />
          <Autocomplete
            options={gudangRows || []}
            value={selectedGudang}
            loading={gudangLoading}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, gudang_id: option?.id || '' }))}
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