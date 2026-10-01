'use client';

import { useEffect, useMemo, useState } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { CloseSquare } from 'iconsax-react';
import axiosServices from 'utils/axios';
import { useGetGudang } from 'api/gudang';
import { useGetBisnisUnit } from 'api/bisnis-unit';

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'approval', label: 'Approval' },
  { value: 'close', label: 'Close' }
];

export default function FilterStokopname({ count, data, setData, open, onClose }) {
  const [kodeInput, setKodeInput] = useState(data.kode || '');
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();
  const bisnisUnitHook = useGetBisnisUnit({ my_units: true });
  const bisnisRows = bisnisUnitHook?.bisnisUnit?.rows || [];
  const bisnisLoading = bisnisUnitHook?.bisnisUnitLoading || false;

  const [rackOptions, setRackOptions] = useState([]);
  const [loadingRacks, setLoadingRacks] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch rack berdasarkan gudang terpilih (jika tidak ada, semua rack)
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingRacks(true);
    const params = new URLSearchParams();
    if (data.gudang_id) params.set('gudang_id', data.gudang_id);
    axiosServices
      .get(`/warehouse/stokopnames/options/racks?${params.toString()}`)
      .then((response) => {
        if (active) setRackOptions(response.data?.data || []);
      })
      .catch(() => {
        if (active) setRackOptions([]);
      })
      .finally(() => {
        if (active) setLoadingRacks(false);
      });
    return () => {
      active = false;
    };
  }, [open, data.gudang_id]);

  // Fetch user/karyawan
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingUsers(true);
    axiosServices
      .get('/warehouse/stokopnames/options/users')
      .then((response) => {
        if (active) setUserOptions(response.data?.data || []);
      })
      .catch(() => {
        if (active) setUserOptions([]);
      })
      .finally(() => {
        if (active) setLoadingUsers(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => setKodeInput(data.kode || ''), [data.kode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData((prev) => {
        if (prev.kode === kodeInput) return prev;
        return { ...prev, page: 1, kode: kodeInput };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [kodeInput, setData]);

  const filterCount = useMemo(() => {
    let applied = 0;
    if (data.kode) applied += 1;
    if (data.status) applied += 1;
    if (data.bisnis_id) applied += 1;
    if (data.gudang_id) applied += 1;
    if (data.rack_id) applied += 1;
    if (data.user_id) applied += 1;
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

  const selectedRack = useMemo(
    () => (rackOptions || []).find((item) => String(item.id) === String(data.rack_id || '')) || null,
    [data.rack_id, rackOptions]
  );

  const selectedUser = useMemo(
    () => (userOptions || []).find((item) => String(item.id) === String(data.user_id || '')) || null,
    [data.user_id, userOptions]
  );

  const selectedStatus = useMemo(
    () => statusOptions.find((item) => item.value === (data.status || '')) || statusOptions[0],
    [data.status]
  );

  const handleReset = () => {
    setKodeInput('');
    setData((prev) => ({ ...prev, page: 1, kode: '', status: '', bisnis_id: '', gudang_id: '', rack_id: '', user_id: '' }));
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
          <Autocomplete
            options={statusOptions}
            value={selectedStatus}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, status: option?.value || '' }))}
            renderInput={(params) => <TextField {...params} label="Status" size="small" />}
          />
          <Autocomplete
            options={bisnisRows || []}
            value={selectedBisnis}
            loading={bisnisLoading}
            getOptionLabel={(option) => `${option.kode || option.initial || '-'} - ${option.name || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, bisnis_id: option?.id || '', gudang_id: '', rack_id: '' }))}
            renderInput={(params) => <TextField {...params} label="Bisnis" size="small" />}
          />
          <Autocomplete
            options={gudangRows || []}
            value={selectedGudang}
            loading={gudangLoading}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, gudang_id: option?.id || '', rack_id: '' }))}
            renderInput={(params) => <TextField {...params} label="Gudang" size="small" />}
          />
          <Autocomplete
            options={rackOptions || []}
            value={selectedRack}
            loading={loadingRacks}
            getOptionLabel={(option) => `${option.kode} - ${option.nama}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, rack_id: option?.id || '' }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rack"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingRacks ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
          <Autocomplete
            options={userOptions || []}
            value={selectedUser}
            loading={loadingUsers}
            getOptionLabel={(option) => `${option.nama || '-'}${option.username ? ` (${option.username})` : ''}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setData((prev) => ({ ...prev, page: 1, user_id: option?.id || '' }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="User / Karyawan"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
          <Button variant="outlined" color="secondary" onClick={handleReset} fullWidth>
            Reset Filter
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
