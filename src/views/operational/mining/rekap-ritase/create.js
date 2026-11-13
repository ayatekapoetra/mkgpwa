'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import moment from 'moment';

// MATERIAL - UI
import {
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Add, Trash, Refresh, ArrowLeft, TickCircle, Warning2, InfoCircle, Hierarchy } from 'iconsax-react';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionCabang from 'components/OptionCabang';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionShiftKerja from 'components/OptionShiftKerja';
import OptionMaterialMining from 'components/OptionMaterialMining';
import OptionLokasiPit from 'components/OptionLokasiPit';
import OptionEquipment from 'components/OptionEquipment';
import OptionDoms from 'components/OptionDoms';
import { APP_DEFAULT_PATH } from 'config';

import {
  createRekapRitase,
  fetchRekapDefaults,
  useRitaseRekapAccess
} from 'api/ritase-rekap';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Rekap Ritase', to: '/rekap-ritase' },
  { title: 'Tambah Rekap', to: '/rekap-ritase/create' }
];

const formatNum = (v, digits = 2) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export default function CreateRekapRitaseView() {
  const router = useRouter();
  const { permissions } = useRitaseRekapAccess();

  // Header form state
  const [header, setHeader] = useState({
    bisnis_id: 3, // Default MTK
    cabang_id: '',
    penyewa_id: '',
    date_ops: moment().format('YYYY-MM-DD'),
    shift_id: '',
    fleet_name: 'Fleet 1',
    excavator_id: '',
    startpit_id: '',
    seq: '1',
    material_id: '',
    status: 'PRODUKSI',
    distance_km: '',
    tf_ton: '',
    tf_bcm: ''
  });

  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [distanceSource, setDistanceSource] = useState('');
  const [tfSource, setTfSource] = useState('');

  // Grid baris DT
  const [items, setItems] = useState([
    {
      id: 1,
      dumptruck_id: '',
      dumptruck_label: '',
      kdsm: '',
      stockpile_id: '',
      dom_id: '',
      total_ritase: 1,
      tf_ton: '',
      tf_bcm: '',
      allocations: []
    }
  ]);

  // Dialog Split DOM state
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitActiveIndex, setSplitActiveIndex] = useState(null);
  const [tempAllocations, setTempAllocations] = useState([]);

  // Dialog Konfirmasi & Sukses
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  // Backdate check
  const isBackdate = useMemo(() => {
    if (!header.date_ops) return false;
    const diff = moment().startOf('day').diff(moment(header.date_ops).startOf('day'), 'days');
    return diff > 2;
  }, [header.date_ops]);

  const canSaveBackdate = useMemo(() => {
    if (!isBackdate) return true;
    return Boolean(permissions?.can_backdate);
  }, [isBackdate, permissions]);

  // Handler header changes
  const handleHeaderChange = (name, val) => {
    setHeader((prev) => ({ ...prev, [name]: val }));
  };

  // Muat default Jarak & Truck Factor dari API
  const handleLoadDefaults = async () => {
    if (!header.date_ops || !header.bisnis_id) return;
    setLoadingDefaults(true);
    try {
      const res = await fetchRekapDefaults({
        date_ops: header.date_ops,
        bisnis_id: header.bisnis_id,
        penyewa_id: header.penyewa_id || undefined,
        material_id: header.material_id || undefined,
        startpit_id: header.startpit_id || undefined
      });
      if (res) {
        if (res.distance_km != null) {
          setHeader((prev) => ({ ...prev, distance_km: res.distance_km }));
          setDistanceSource(res.distance_source || 'Sistem');
        }
        if (res.truck_factor) {
          setHeader((prev) => ({
            ...prev,
            tf_ton: res.truck_factor.tf_ton ?? '',
            tf_bcm: res.truck_factor.tf_bcm ?? ''
          }));
          setTfSource(res.truck_factor.source || 'Sistem');
        }
        setDefaultsLoaded(true);
      }
    } catch (err) {
      console.warn('Defaults load error:', err);
    } finally {
      setLoadingDefaults(false);
    }
  };

  // Auto-fetch defaults bila material / pit / tanggal terisi
  useEffect(() => {
    if (header.date_ops && header.bisnis_id && (header.material_id || header.startpit_id)) {
      handleLoadDefaults();
    }
  }, [header.date_ops, header.bisnis_id, header.material_id, header.startpit_id]);

  // Baris DT manipulation
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        dumptruck_id: '',
        dumptruck_label: '',
        kdsm: '',
        stockpile_id: '',
        dom_id: '',
        total_ritase: 1,
        tf_ton: '',
        tf_bcm: '',
        allocations: []
      }
    ]);
  };

  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[idx], [field]: value };

      // Bila dom_id diubah di baris tunggal dan belum ada split, perbarui alokasi default
      if (field === 'dom_id' && (!target.allocations || target.allocations.length <= 1)) {
        if (value) {
          target.allocations = [{ dom_id: value, stockpile_id: target.stockpile_id || null, ritase: Number(target.total_ritase) || 1 }];
        } else {
          target.allocations = [];
        }
      }
      if (field === 'total_ritase' && target.allocations && target.allocations.length === 1) {
        target.allocations = [{ ...target.allocations[0], ritase: Number(value) || 0 }];
      }

      next[idx] = target;
      return next;
    });
  };

  // Split DOM Dialog
  const handleOpenSplit = (idx) => {
    const item = items[idx];
    setSplitActiveIndex(idx);
    const existing = Array.isArray(item.allocations) && item.allocations.length > 0
      ? item.allocations.map((a) => ({ ...a }))
      : item.dom_id
        ? [{ dom_id: item.dom_id, stockpile_id: item.stockpile_id || '', ritase: Number(item.total_ritase) || 1 }]
        : [{ dom_id: '', stockpile_id: '', ritase: Number(item.total_ritase) || 1 }];
    setTempAllocations(existing);
    setSplitDialogOpen(true);
  };

  const handleAddSplitRow = () => {
    setTempAllocations((prev) => [...prev, { dom_id: '', stockpile_id: '', ritase: 1 }]);
  };

  const handleRemoveSplitRow = (sIdx) => {
    setTempAllocations((prev) => prev.filter((_, i) => i !== sIdx));
  };

  const handleTempAllocChange = (sIdx, field, val) => {
    setTempAllocations((prev) => {
      const next = [...prev];
      next[sIdx] = { ...next[sIdx], [field]: val };
      return next;
    });
  };

  const totalAllocatedInDialog = useMemo(() => {
    return tempAllocations.reduce((sum, a) => sum + (Number(a.ritase) || 0), 0);
  }, [tempAllocations]);

  const targetRitaseForDialog = useMemo(() => {
    if (splitActiveIndex == null || !items[splitActiveIndex]) return 0;
    return Number(items[splitActiveIndex].total_ritase) || 0;
  }, [splitActiveIndex, items]);

  const isSplitMismatch = totalAllocatedInDialog !== targetRitaseForDialog;

  const handleSaveSplit = () => {
    if (isSplitMismatch) return;
    if (splitActiveIndex == null) return;

    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[splitActiveIndex] };
      target.allocations = tempAllocations.filter((a) => a.dom_id && Number(a.ritase) > 0);
      if (target.allocations.length === 1) {
        target.dom_id = target.allocations[0].dom_id;
      } else if (target.allocations.length > 1) {
        target.dom_id = target.allocations.map((a) => a.dom_id).join(', ');
      }
      next[splitActiveIndex] = target;
      return next;
    });

    setSplitDialogOpen(false);
  };

  // Ringkasan kalkulasi realtime
  const totals = useMemo(() => {
    let ritase = 0;
    let ton = 0;
    let bcm = 0;
    const domMap = {};

    items.forEach((item) => {
      const rit = Number(item.total_ritase) || 0;
      const tfT = Number(item.tf_ton) || Number(header.tf_ton) || 0;
      const tfB = Number(item.tf_bcm) || Number(header.tf_bcm) || 0;

      ritase += rit;
      ton += rit * tfT;
      bcm += rit * tfB;

      const allocs = item.allocations && item.allocations.length > 0
        ? item.allocations
        : item.dom_id
          ? [{ dom_id: item.dom_id, ritase: rit }]
          : [];

      allocs.forEach((a) => {
        const dId = a.dom_id || 'Belum Ditentukan';
        const aRit = Number(a.ritase) || 0;
        if (!domMap[dId]) {
          domMap[dId] = { dom_id: dId, ritase: 0, ton: 0, bcm: 0 };
        }
        domMap[dId].ritase += aRit;
        domMap[dId].ton += aRit * tfT;
        domMap[dId].bcm += aRit * tfB;
      });
    });

    return {
      total_dumptruck: items.length,
      total_ritase: ritase,
      total_ton: ton,
      total_bcm: bcm,
      domSummary: Object.values(domMap)
    };
  }, [items, header.tf_ton, header.tf_bcm]);

  // Validasi form sebelum konfirmasi
  const validationErrors = useMemo(() => {
    const errs = [];
    if (!header.date_ops) errs.push('Tanggal operasional wajib diisi');
    if (!header.bisnis_id) errs.push('Unit bisnis wajib dipilih');
    if (!header.cabang_id) errs.push('Cabang wajib dipilih');
    if (!header.penyewa_id) errs.push('Pelanggan/IUP wajib dipilih');
    if (!header.shift_id) errs.push('Shift kerja wajib dipilih');
    if (!header.startpit_id) errs.push('PIT asal wajib dipilih');
    if (!header.material_id) errs.push('Jenis material wajib dipilih');
    if (!header.excavator_id) errs.push('Excavator / Loader wajib dipilih');
    if (!header.distance_km || Number(header.distance_km) <= 0) errs.push('Jarak (km) wajib diisi > 0');
    if (isBackdate && !permissions?.can_backdate) {
      errs.push('Tanggal lebih dari H-2 memerlukan izin khusus (ritase-rekap.backdate)');
    }

    if (items.length === 0) {
      errs.push('Minimal harus ada 1 baris Dump Truck');
    }

    items.forEach((it, idx) => {
      const rowNum = idx + 1;
      if (!it.dumptruck_id) errs.push(`Baris ${rowNum}: Dump Truck belum dipilih`);
      if (!it.total_ritase || Number(it.total_ritase) <= 0) errs.push(`Baris ${rowNum}: Total ritasi harus > 0`);
      if (header.status === 'PRODUKSI') {
        const allocs = it.allocations || [];
        if (allocs.length === 0 && !it.dom_id) {
          errs.push(`Baris ${rowNum}: Alokasi DOM wajib diisi untuk kategori PRODUKSI`);
        } else if (allocs.length > 0) {
          const sumAlloc = allocs.reduce((s, a) => s + (Number(a.ritase) || 0), 0);
          if (sumAlloc !== Number(it.total_ritase)) {
            errs.push(`Baris ${rowNum}: Jumlah alokasi DOM (${sumAlloc}) tidak sama dengan total ritasi (${it.total_ritase})`);
          }
        }
      }
    });

    return errs;
  }, [header, items, isBackdate, permissions]);

  const handleOpenConfirm = () => {
    if (validationErrors.length > 0) return;
    setConfirmDialogOpen(true);
  };

  // Submit ke backend
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      bisnis_id: Number(header.bisnis_id),
      cabang_id: Number(header.cabang_id),
      penyewa_id: Number(header.penyewa_id),
      date_ops: header.date_ops,
      shift_id: Number(header.shift_id),
      fleet_name: header.fleet_name || 'Fleet 1',
      excavator_id: Number(header.excavator_id),
      startpit_id: Number(header.startpit_id),
      seq: String(header.seq || '1'),
      material_id: Number(header.material_id),
      status: header.status || 'PRODUKSI',
      distance_km: Number(header.distance_km),
      items: items.map((it) => {
        const itemObj = {
          dumptruck_id: Number(it.dumptruck_id),
          kdsm: it.kdsm || '',
          total_ritase: Number(it.total_ritase)
        };
        if (it.tf_ton) itemObj.tf_ton = Number(it.tf_ton);
        else if (header.tf_ton) itemObj.tf_ton = Number(header.tf_ton);

        if (it.tf_bcm) itemObj.tf_bcm = Number(it.tf_bcm);
        else if (header.tf_bcm) itemObj.tf_bcm = Number(header.tf_bcm);

        if (it.allocations && it.allocations.length > 0) {
          itemObj.allocations = it.allocations.map((a) => ({
            stockpile_id: a.stockpile_id ? Number(a.stockpile_id) : undefined,
            dom_id: a.dom_id,
            ritase: Number(a.ritase)
          }));
        } else if (it.dom_id) {
          itemObj.allocations = [
            {
              stockpile_id: it.stockpile_id ? Number(it.stockpile_id) : undefined,
              dom_id: it.dom_id,
              ritase: Number(it.total_ritase)
            }
          ];
        } else {
          itemObj.allocations = [];
        }

        return itemObj;
      })
    };

    try {
      const res = await createRekapRitase(payload);
      setSubmitResult(res);
      setConfirmDialogOpen(false);
      setResultDialogOpen(true);
    } catch (err) {
      setSubmitError(err.message || 'Gagal menyimpan rekap ritase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Form Rekap Ritase (Manual)" links={breadcrumbLinks} />

      <Stack spacing={3}>
        {/* HEADER CARD */}
        <MainCard
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" fontWeight={700}>
                Header Rekap Ritase
              </Typography>
              {isBackdate && (
                <Chip
                  size="small"
                  color={canSaveBackdate ? 'warning' : 'error'}
                  label={canSaveBackdate ? 'Tanggal Backdate (H-2+)' : 'Backdate Dikunci (Butuh Izin)'}
                />
              )}
            </Stack>
          }
          secondary={
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={loadingDefaults ? <CircularProgress size={16} /> : <Refresh size={16} />}
              onClick={handleLoadDefaults}
              disabled={loadingDefaults || !header.date_ops || !header.bisnis_id}
            >
              Muat Ulang Default Jarak & TF
            </Button>
          }
        >
          <Grid container spacing={2}>
            {isBackdate && !canSaveBackdate && (
              <Grid item xs={12}>
                <Alert severity="error">
                  Tanggal operasional lebih lama dari H-2 dan Anda tidak memiliki izin <code>ritase-rekap.backdate</code>.
                  Silakan ubah tanggal atau hubungi administrator.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <OptionBisnisUnit
                value={header.bisnis_id}
                name="bisnis_id"
                label="Unit Bisnis"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptionCabang
                value={header.cabang_id}
                name="cabang_id"
                label="Cabang / Site"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Tanggal Operasional"
                value={header.date_ops}
                onChange={(e) => handleHeaderChange('date_ops', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptionShiftKerja
                value={header.shift_id}
                name="shift_id"
                label="Shift Kerja"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptionPenyewa
                value={header.penyewa_id}
                name="penyewa_id"
                label="Pelanggan / IUP"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Nama Fleet"
                value={header.fleet_name}
                onChange={(e) => handleHeaderChange('fleet_name', e.target.value)}
                placeholder="Contoh: Fleet 1"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptionEquipment
                value={header.excavator_id}
                name="excavator_id"
                label="Loader / Excavator"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptionLokasiPit
                value={header.startpit_id}
                name="startpit_id"
                label="PIT Asal"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Sequence (Seq)"
                value={header.seq}
                onChange={(e) => handleHeaderChange('seq', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptionMaterialMining
                value={header.material_id}
                name="material_id"
                label="Jenis Material"
                setFieldValue={handleHeaderChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="kategori-label">Kategori</InputLabel>
                <Select
                  labelId="kategori-label"
                  value={header.status}
                  label="Kategori"
                  onChange={(e) => handleHeaderChange('status', e.target.value)}
                >
                  <MenuItem value="PRODUKSI">PRODUKSI</MenuItem>
                  <MenuItem value="NON_PRODUKSI">NON PRODUKSI</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Jarak (km)"
                value={header.distance_km}
                onChange={(e) => handleHeaderChange('distance_km', e.target.value)}
                helperText={distanceSource ? `Sumber: ${distanceSource}` : 'Default dari master jarak'}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Default TF (Ton/rit)"
                value={header.tf_ton}
                onChange={(e) => handleHeaderChange('tf_ton', e.target.value)}
                helperText={tfSource ? `Sumber: ${tfSource}` : 'Read-only dari master TF'}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Default TF (BCM/rit)"
                value={header.tf_bcm}
                onChange={(e) => handleHeaderChange('tf_bcm', e.target.value)}
                helperText={tfSource ? `Sumber: ${tfSource}` : 'Read-only dari master TF'}
              />
            </Grid>
          </Grid>
        </MainCard>

        {/* GRID DUMP TRUCK */}
        <MainCard
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" fontWeight={700}>
                Daftar Dump Truck (DT)
              </Typography>
              <Chip size="small" label={`${items.length} Unit`} color="primary" />
            </Stack>
          }
          secondary={
            <Button variant="contained" color="primary" size="small" startIcon={<Add />} onClick={handleAddItem}>
              Tambah Dump Truck
            </Button>
          }
          content={false}
        >
          <TableContainer component={Paper} sx={{ border: 'none', borderRadius: 0, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700, width: 40 }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Dump Truck</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 140 }}>KDSM</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100 }} align="right">Ritasi</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }} align="right">Ton</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }} align="right">BCM</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 260 }}>Alokasi DOM</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => {
                  const rit = Number(item.total_ritase) || 0;
                  const tfT = Number(item.tf_ton) || Number(header.tf_ton) || 0;
                  const tfB = Number(item.tf_bcm) || Number(header.tf_bcm) || 0;
                  const calcTon = rit * tfT;
                  const calcBcm = rit * tfB;
                  const hasSplit = Array.isArray(item.allocations) && item.allocations.length > 1;

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <OptionEquipment
                          value={item.dumptruck_id}
                          name={`dt_${idx}`}
                          label="Pilih Dump Truck"
                          setFieldValue={(_, val) => handleItemChange(idx, 'dumptruck_id', val)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="SM 21 / 2910"
                          value={item.kdsm}
                          onChange={(e) => handleItemChange(idx, 'kdsm', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 1 }}
                          value={item.total_ritase}
                          onChange={(e) => handleItemChange(idx, 'total_ritase', e.target.value)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatNum(calcTon)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatNum(calcBcm)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {hasSplit ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {item.allocations.map((a, aidx) => (
                                <Chip
                                  key={aidx}
                                  size="small"
                                  label={`${a.dom_id}: ${a.ritase} rit`}
                                  color="info"
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Box sx={{ flexGrow: 1, minWidth: 150 }}>
                              <OptionDoms
                                value={item.dom_id}
                                name={`dom_${idx}`}
                                label="DOM Tujuan"
                                setFieldValue={(_, val) => handleItemChange(idx, 'dom_id', val)}
                              />
                            </Box>
                          )}
                          <Button
                            variant={hasSplit ? 'contained' : 'outlined'}
                            size="small"
                            color={hasSplit ? 'info' : 'primary'}
                            startIcon={<Hierarchy size={14} />}
                            onClick={() => handleOpenSplit(idx)}
                            sx={{ minWidth: 100, textTransform: 'none' }}
                          >
                            {hasSplit ? 'Edit Split' : '+ Split'}
                          </Button>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                        >
                          <Trash size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* TOTAL SUMMARY BAR */}
          <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Unit Dump Truck</Typography>
                <Typography variant="h5" fontWeight={700}>{totals.total_dumptruck} Unit</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Ritasi</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">{totals.total_ritase} Rit</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Tonase (Ton)</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{formatNum(totals.total_ton)} T</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Volume (BCM)</Typography>
                <Typography variant="h5" fontWeight={700} color="secondary.main">{formatNum(totals.total_bcm)} BCM</Typography>
              </Grid>
            </Grid>
          </Box>
        </MainCard>

        {/* ACTIONS & VALIDATION */}
        {validationErrors.length > 0 && (
          <Alert severity="warning">
            <AlertTitle>Mohon lengkapi data sebelum menyimpan:</AlertTitle>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Link href="/rekap-ritase" passHref style={{ textDecoration: 'none' }}>
            <Button variant="outlined" color="secondary" startIcon={<ArrowLeft />}>
              Kembali ke Daftar
            </Button>
          </Link>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleOpenConfirm}
            disabled={validationErrors.length > 0 || !canSaveBackdate}
          >
            Simpan Rekap Ritase
          </Button>
        </Stack>
      </Stack>

      {/* DIALOG SPLIT DOM */}
      <Dialog open={splitDialogOpen} onClose={() => setSplitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={700}>
              Alokasi Split DOM
            </Typography>
            <Chip
              label={`Target Ritasi: ${targetRitaseForDialog} Rit`}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Alert severity="info" sx={{ py: 0.5 }}>
              Total ritasi baris ini adalah <strong>{targetRitaseForDialog} rit</strong>. Alokasikan ke satu atau beberapa DOM sehingga jumlahnya persis sama.
            </Alert>

            {isSplitMismatch && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                <code>SPLIT_TOTAL_MISMATCH</code>: Jumlah alokasi DOM ({totalAllocatedInDialog}) tidak sama dengan total ritasi ({targetRitaseForDialog}).
              </Alert>
            )}

            {tempAllocations.map((alloc, sIdx) => (
              <Paper key={sIdx} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={7}>
                    <OptionDoms
                      value={alloc.dom_id}
                      name={`split_dom_${sIdx}`}
                      label="Pilih DOM Tujuan"
                      setFieldValue={(_, val) => handleTempAllocChange(sIdx, 'dom_id', val)}
                    />
                  </Grid>
                  <Grid item xs={8} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Ritasi"
                      inputProps={{ min: 1 }}
                      value={alloc.ritase}
                      onChange={(e) => handleTempAllocChange(sIdx, 'ritase', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={4} sm={2} sx={{ textAlign: 'center' }}>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveSplitRow(sIdx)}
                      disabled={tempAllocations.length <= 1}
                    >
                      <Trash size={16} />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Button variant="outlined" color="primary" startIcon={<Add />} onClick={handleAddSplitRow}>
              Tambah DOM Lain
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setSplitDialogOpen(false)}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSplit}
            disabled={isSplitMismatch || totalAllocatedInDialog === 0}
          >
            Terapkan Alokasi
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG KONFIRMASI RINGKASAN */}
      <Dialog open={confirmDialogOpen} onClose={() => !submitting && setConfirmDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Konfirmasi Ringkasan Rekap Ritase
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Tanggal</Typography>
                  <Typography variant="body2" fontWeight={600}>{header.date_ops}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Shift</Typography>
                  <Typography variant="body2" fontWeight={600}>Shift #{header.shift_id}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Fleet / Loader</Typography>
                  <Typography variant="body2" fontWeight={600}>{header.fleet_name} / EXC #{header.excavator_id}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Jarak / Kategori</Typography>
                  <Typography variant="body2" fontWeight={600}>{header.distance_km} km / {header.status}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="subtitle1" fontWeight={700}>
              Ringkasan Alokasi per DOM
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 700 }}>DOM</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Ritasi</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Estimasi Ton</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Estimasi BCM</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {totals.domSummary.map((d, didx) => (
                    <TableRow key={didx}>
                      <TableCell sx={{ fontWeight: 600 }}>{d.dom_id}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{d.ritase} rit</TableCell>
                      <TableCell align="right">{formatNum(d.ton)} T</TableCell>
                      <TableCell align="right">{formatNum(d.bcm)} BCM</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {totals.total_ritase} rit
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatNum(totals.total_ton)} T
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {formatNum(totals.total_bcm)} BCM
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setConfirmDialogOpen(false)} disabled={submitting}>
            Kembali & Edit
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <TickCircle />}
          >
            {submitting ? 'Menyimpan...' : 'Konfirmasi & Simpan ke Database'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG HASIL SIMPAN & DOM STATUS */}
      <Dialog open={resultDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <TickCircle color="#2e7d32" size={24} />
            <Typography variant="h5" fontWeight={700} color="success.main">
              Rekap Ritase Berhasil Disimpan
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Alert severity="success">
              Data rekap ritase telah dicatat ke dalam sistem dengan batch ID:{' '}
              <strong>{submitResult?.batch_id}</strong>
            </Alert>

            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Ritasi</Typography>
                  <Typography variant="body1" fontWeight={700}>{submitResult?.total_ritase} Rit</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Ton</Typography>
                  <Typography variant="body1" fontWeight={700}>{formatNum(submitResult?.total_ton)} T</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total BCM</Typography>
                  <Typography variant="body1" fontWeight={700}>{formatNum(submitResult?.total_bcm)} BCM</Typography>
                </Grid>
              </Grid>
            </Box>

            {Array.isArray(submitResult?.dom_status) && submitResult.dom_status.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700}>
                  Status Kapasitas DOM Terkait:
                </Typography>
                <Stack spacing={1}>
                  {submitResult.dom_status.map((ds, dsIdx) => (
                    <Box
                      key={dsIdx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: ds.full ? 'error.main' : ds.warning ? 'warning.main' : 'divider',
                        bgcolor: ds.full ? 'error.lighter' : ds.warning ? 'warning.lighter' : 'background.paper'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {ds.dom_id}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption">
                            {ds.current_ret} / {ds.target_ret} rit ({ds.percentage}%)
                          </Typography>
                          {ds.full ? (
                            <Chip size="small" color="error" label="PENUH" />
                          ) : ds.warning ? (
                            <Chip size="small" color="warning" label="≥ 80%" />
                          ) : (
                            <Chip size="small" color="success" label="OK" />
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/rekap-ritase')}
          >
            Kembali ke Daftar Rekap
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
