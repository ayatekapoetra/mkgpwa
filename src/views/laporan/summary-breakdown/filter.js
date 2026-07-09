'use client';

import { useEffect, useMemo, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';

import { Add } from 'iconsax-react';
import MainCard from 'components/MainCard';
import { useGetLokasiKerja } from 'api/lokasi-mining';
import { usePublicEquipment } from 'api/equipment';
import { usePublicCabang } from 'api/cabang';

const defaultDates = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const firstDay = `${yyyy}-${mm}-01`;
  const today = `${yyyy}-${mm}-${dd}`;
  return { startdate: firstDay, enddate: today };
};

export default function FilterSummaryBreakdown({ open, count, params, setParams, onClose, anchor = 'right' }) {
  const [problemIssueInput, setProblemIssueInput] = useState(params.problem_issue || '');
  const { data: cabangOptions = [], dataLoading: cabangLoading } = usePublicCabang();
  const { data: lokasiOptions = [], dataLoading: lokasiLoading } = useGetLokasiKerja();
  const { data: equipmentOptions = [], dataLoading: equipmentLoading } = usePublicEquipment();

  const areaOptions = useMemo(() => {
    const uniqueAreas = [...new Set((cabangOptions || []).map((item) => item?.area).filter(Boolean))];
    return uniqueAreas.sort().map((area) => ({ label: area, value: area }));
  }, [cabangOptions]);

  useEffect(() => {
    setProblemIssueInput(params.problem_issue || '');
  }, [params.problem_issue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.problem_issue || '') !== problemIssueInput) {
        setParams((prev) => ({ ...prev, page: 1, problem_issue: problemIssueInput }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [problemIssueInput, params.problem_issue, setParams]);

  const selectedAreas = useMemo(() => {
    const selectedValues = (params.areas || []).map((item) => (typeof item === 'object' ? item.value : item));
    return areaOptions.filter((option) => selectedValues.includes(option.value));
  }, [params.areas, areaOptions]);

  const filteredLokasiOptions = useMemo(() => {
    const selectedAreaValues = (params.areas || []).map((item) => (typeof item === 'object' ? item.value : item));
    if (selectedAreaValues.length === 0) return lokasiOptions || [];
    return (lokasiOptions || []).filter((option) => selectedAreaValues.includes(option?.cabang?.area));
  }, [params.areas, lokasiOptions]);

  const filteredEquipmentOptions = useMemo(() => {
    const areaValues = (params.areas || []).map((item) => (typeof item === 'object' ? item.value : item));
    const lokasiCabangIds = (params.lokasi_ids || [])
      .map((item) => (typeof item === 'object' ? item?.cabang_id || item?.cabang?.id : null))
      .filter(Boolean);
    const uniqueLokasiCabangIds = [...new Set(lokasiCabangIds)];
    const cabangAreaMap = new Map((cabangOptions || []).map((item) => [item.id, item.area]));

    return (equipmentOptions || []).filter((option) => {
      const optionCabangId = option?.cabang_id || option?.cabang?.id || null;
      const optionArea = cabangAreaMap.get(optionCabangId) || option?.cabang?.area || null;

      if (uniqueLokasiCabangIds.length > 0) {
        return uniqueLokasiCabangIds.includes(optionCabangId);
      }

      if (areaValues.length > 0) {
        return areaValues.includes(optionArea);
      }

      return true;
    });
  }, [params.areas, params.lokasi_ids, equipmentOptions, cabangOptions]);

  const selectedLokasi = useMemo(() => {
    const selectedIds = (params.lokasi_ids || []).map((item) => (typeof item === 'object' ? item.id : item));
    return (lokasiOptions || []).filter((option) => selectedIds.includes(option.id));
  }, [params.lokasi_ids, lokasiOptions]);

  const selectedEquipment = useMemo(() => {
    const selectedIds = (params.equipment_ids || []).map((item) => (typeof item === 'object' ? item.id : item));
    return (equipmentOptions || []).filter((option) => selectedIds.includes(option.id));
  }, [params.equipment_ids, equipmentOptions]);

  useEffect(() => {
    const allowedIds = new Set(filteredEquipmentOptions.map((item) => item.id));
    const current = params.equipment_ids || [];
    const normalized = current.filter((item) => {
      const id = typeof item === 'object' ? item.id : item;
      return allowedIds.has(id);
    });

    if (normalized.length !== current.length) {
      setParams((prev) => ({ ...prev, page: 1, equipment_ids: normalized }));
    }
  }, [filteredEquipmentOptions, params.equipment_ids, setParams]);

  const onResetFilter = () => {
    const dates = defaultDates();
    setParams((prev) => ({
      ...prev,
      page: 1,
      startdate: dates.startdate,
      enddate: dates.enddate,
      areas: [],
      lokasi_ids: [],
      equipment_ids: [],
      status: '',
      problem_issue: ''
    }));
    setProblemIssueInput('');
  };

  return (
    <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
      <Stack p={1} sx={{ width: { xs: '100vw', sm: 420 } }}>
        <MainCard content title={<HeaderFilter count={count} onClose={onClose} />}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={params.startdate || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, startdate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={params.enddate || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, enddate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={areaOptions}
                loading={cabangLoading}
                value={selectedAreas}
                onChange={(_, newValue) => setParams((prev) => ({ ...prev, page: 1, areas: newValue, lokasi_ids: [], equipment_ids: [] }))}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionLabel={(option) => option?.label || ''}
                renderInput={(inputParams) => <TextField {...inputParams} label="Area" />}
                renderOption={(props, option) => (
                  <li {...props} key={option.value}>
                    <Typography variant="body2" fontWeight={600}>{option.label}</Typography>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={filteredLokasiOptions}
                loading={lokasiLoading}
                value={selectedLokasi}
                onChange={(_, newValue) => setParams((prev) => ({ ...prev, page: 1, lokasi_ids: newValue, equipment_ids: [] }))}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option?.nama || ''}
                renderInput={(inputParams) => <TextField {...inputParams} label="Lokasi Kerja" />}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack spacing={0}>
                      <Typography variant="body2" fontWeight={600}>{option.nama}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.cabang?.nama || '-'}</Typography>
                    </Stack>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={filteredEquipmentOptions}
                loading={equipmentLoading}
                value={selectedEquipment}
                onChange={(_, newValue) => setParams((prev) => ({ ...prev, page: 1, equipment_ids: newValue }))}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => `${option?.kode || '-'} - ${option?.model || '-'}`}
                renderInput={(inputParams) => <TextField {...inputParams} label="Equipment" />}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack spacing={0}>
                      <Typography variant="body2" fontWeight={600}>{option.kode || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.model || '-'}</Typography>
                    </Stack>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                value={params.status || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, page: 1, status: e.target.value }))}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="close">Close</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Problem Issue"
                value={problemIssueInput}
                onChange={(e) => setProblemIssueInput(e.target.value)}
                placeholder="Cari problem issue"
              />
            </Grid>
          </Grid>
        </MainCard>
        <CardActions>
          <Button onClick={onResetFilter} variant="dashed" color="secondary" fullWidth>
            Reset Filter
          </Button>
        </CardActions>
      </Stack>
    </SwipeableDrawer>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body1">Filter Summary Breakdown</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
