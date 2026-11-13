'use client';

import { useState, useMemo, Fragment } from 'react';
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
  Tabs,
  Tab,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  DocumentUpload,
  ArrowLeft,
  TickCircle,
  Warning2,
  CloseCircle,
  Edit,
  Refresh,
  Filter,
  Eye,
  Flash,
  DocumentCopy
} from 'iconsax-react';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import Paginate from 'components/Paginate';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionCabang from 'components/OptionCabang';
import OptionEquipment from 'components/OptionEquipment';
import OptionDoms from 'components/OptionDoms';
import OptionLokasiPit from 'components/OptionLokasiPit';
import OptionMaterialMining from 'components/OptionMaterialMining';
import OptionShiftKerja from 'components/OptionShiftKerja';
import { APP_DEFAULT_PATH } from 'config';

import {
  uploadImportPreview,
  useGetImportRows,
  patchImportRow,
  bulkPatchImportRows,
  commitImportBatch,
  useGetImportBatches,
  useGetImportBatchDetail
} from 'api/ritase-import';
import { useRitaseRekapAccess } from 'api/ritase-rekap';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Rekap Ritase', to: '/rekap-ritase' },
  { title: 'Import Excel', to: '/rekap-ritase/import' }
];

const formatNum = (v, digits = 2) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export default function ImportRitaseScreen() {
  const { permissions } = useRitaseRekapAccess();

  // Navigation tab: 0 = Import Baru / Preview, 1 = Riwayat Batch
  const [mainTab, setMainTab] = useState(0);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetName, setSheetName] = useState('Input Ritase');
  const [bisnisId, setBisnisId] = useState(3); // Default MTK
  const [cabangId, setCabangId] = useState('');
  const [confirmDuplicateFile, setConfirmDuplicateFile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Active Batch state
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchFileMeta, setBatchFileMeta] = useState(null);

  // Rows table filter & pagination
  const [rowStatusFilter, setRowStatusFilter] = useState('ALL');
  const [rowParams, setRowParams] = useState({ page: 1, perPage: 25 });

  const rowsQuery = useMemo(() => ({
    page: rowParams.page,
    perPage: rowParams.perPage,
    status: rowStatusFilter === 'ALL' ? undefined : rowStatusFilter
  }), [rowParams, rowStatusFilter]);

  const {
    rows: previewRows,
    page: currentPage,
    perPage: currentPerPage,
    total: totalRowsCount,
    lastPage: totalLastPage,
    loading: loadingRows,
    refresh: refreshRows
  } = useGetImportRows(activeBatchId, rowsQuery, Boolean(activeBatchId));

  // Edit Row Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [savingRow, setSavingRow] = useState(false);
  const [editRowError, setEditRowError] = useState(null);

  // Bulk Patch Dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkMatchField, setBulkMatchField] = useState('Pile ID');
  const [bulkMatchValue, setBulkMatchValue] = useState('');
  const [bulkSetField, setBulkSetField] = useState('dom_id');
  const [bulkSetValue, setBulkSetValue] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [bulkResultMsg, setBulkResultMsg] = useState(null);

  // Commit state
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState(null);
  const [commitResult, setCommitResult] = useState(null);
  const [commitSuccessOpen, setCommitSuccessOpen] = useState(false);

  // Batch history state
  const [historyParams, setHistoryParams] = useState({ page: 1, perPage: 10 });
  const {
    batches: batchList,
    page: histPage,
    total: histTotal,
    lastPage: histLastPage,
    loading: loadingBatches,
    refresh: refreshBatches
  } = useGetImportBatches(historyParams, mainTab === 1);

  // Selected history batch detail dialog
  const [selectedHistoryBatchId, setSelectedHistoryBatchId] = useState(null);
  const { batch: historyBatchDetail, loading: loadingHistDetail } = useGetImportBatchDetail(
    selectedHistoryBatchId,
    Boolean(selectedHistoryBatchId)
  );

  // File change handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Ukuran file melebihi batas 10 MB (FILE_TOO_LARGE)');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // Upload preview handler
  const handleUploadPreview = async () => {
    if (!selectedFile) {
      setUploadError('Pilih file .xlsx terlebih dahulu');
      return;
    }
    if (!bisnisId) {
      setUploadError('Unit bisnis wajib dipilih');
      return;
    }
    if (!cabangId) {
      setUploadError('Cabang wajib dipilih');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sheet_name', sheetName || 'Input Ritase');
    formData.append('bisnis_id', String(bisnisId));
    formData.append('cabang_id', String(cabangId));
    if (confirmDuplicateFile) {
      formData.append('confirm_duplicate_file', 'true');
    }

    try {
      const res = await uploadImportPreview(formData);
      setActiveBatchId(res.batch_id);
      setBatchSummary(res.summary);
      setBatchFileMeta({
        file_name: res.file_name,
        expires_at: res.expires_at,
        duplicate_file: res.duplicate_file
      });
      setRowParams({ page: 1, perPage: 25 });
    } catch (err) {
      setUploadError(err.message || 'Gagal memproses preview import');
    } finally {
      setUploading(false);
    }
  };

  // Row Edit Dialog
  const handleOpenEditRow = (row) => {
    setEditingRow({
      row_no: row.row_no,
      status: row.status,
      raw: row.raw,
      messages: row.messages || [],
      resolved: {
        excavator_id: row.resolved?.excavator_id || '',
        dumptruck_id: row.resolved?.dumptruck_id || '',
        shift_id: row.resolved?.shift_id || '',
        startpit_id: row.resolved?.startpit_id || '',
        penyewa_id: row.resolved?.penyewa_id || '',
        material_id: row.resolved?.material_id || '',
        distance_km: row.resolved?.distance_km ?? '',
        tf_ton: row.resolved?.tf_ton ?? '',
        tf_bcm: row.resolved?.tf_bcm ?? '',
        allocations: Array.isArray(row.resolved?.allocations) ? row.resolved.allocations.map(a => ({ ...a })) : [],
        allocation_confirmed: Boolean(row.resolved?.allocation_confirmed),
        skip: Boolean(row.status === 'SKIPPED')
      }
    });
    setEditRowError(null);
    setEditDialogOpen(true);
  };

  const handleSaveEditRow = async () => {
    if (!editingRow || !activeBatchId) return;
    setSavingRow(true);
    setEditRowError(null);

    const body = {
      excavator_id: editingRow.resolved.excavator_id ? Number(editingRow.resolved.excavator_id) : undefined,
      dumptruck_id: editingRow.resolved.dumptruck_id ? Number(editingRow.resolved.dumptruck_id) : undefined,
      shift_id: editingRow.resolved.shift_id ? Number(editingRow.resolved.shift_id) : undefined,
      startpit_id: editingRow.resolved.startpit_id ? Number(editingRow.resolved.startpit_id) : undefined,
      penyewa_id: editingRow.resolved.penyewa_id ? Number(editingRow.resolved.penyewa_id) : undefined,
      material_id: editingRow.resolved.material_id ? Number(editingRow.resolved.material_id) : undefined,
      distance_km: editingRow.resolved.distance_km ? Number(editingRow.resolved.distance_km) : undefined,
      tf_ton: editingRow.resolved.tf_ton ? Number(editingRow.resolved.tf_ton) : undefined,
      tf_bcm: editingRow.resolved.tf_bcm ? Number(editingRow.resolved.tf_bcm) : undefined,
      allocations: editingRow.resolved.allocations,
      allocation_confirmed: Boolean(editingRow.resolved.allocation_confirmed),
      skip: Boolean(editingRow.resolved.skip)
    };

    try {
      const res = await patchImportRow(activeBatchId, editingRow.row_no, body);
      if (res?.summary) {
        setBatchSummary(res.summary);
      }
      setEditDialogOpen(false);
      refreshRows();
    } catch (err) {
      setEditRowError(err.message || 'Gagal menyimpan perubahan baris');
    } finally {
      setSavingRow(false);
    }
  };

  // Quick Confirm Split from Row Table
  const handleQuickConfirmSplit = async (row) => {
    if (!activeBatchId) return;
    try {
      const res = await patchImportRow(activeBatchId, row.row_no, {
        allocation_confirmed: true
      });
      if (res?.summary) {
        setBatchSummary(res.summary);
      }
      refreshRows();
    } catch (err) {
      alert(`Gagal konfirmasi split: ${err.message}`);
    }
  };

  // Bulk Patch
  const handleApplyBulkPatch = async () => {
    if (!activeBatchId || !bulkMatchValue || !bulkSetValue) return;
    setApplyingBulk(true);
    setBulkResultMsg(null);

    const body = {
      match: {
        field: bulkMatchField,
        raw_value: bulkMatchValue
      },
      set: {
        [bulkSetField]: bulkSetValue
      }
    };

    try {
      const res = await bulkPatchImportRows(activeBatchId, body);
      setBulkResultMsg(`Berhasil memperbarui ${res?.affected_rows ?? 0} baris`);
      if (res?.summary) {
        setBatchSummary(res.summary);
      }
      refreshRows();
      setTimeout(() => {
        setBulkDialogOpen(false);
        setBulkResultMsg(null);
        setBulkMatchValue('');
        setBulkSetValue('');
      }, 1200);
    } catch (err) {
      setBulkResultMsg(`Gagal: ${err.message}`);
    } finally {
      setApplyingBulk(false);
    }
  };

  // Commit Handler (AC-11: button disabled while error_rows > 0 or unconfirmed warning split)
  const isCommitBlocked = useMemo(() => {
    if (!batchSummary) return true;
    if (batchSummary.error_rows > 0) return true;
    return false;
  }, [batchSummary]);

  const handleCommit = async () => {
    if (!activeBatchId || isCommitBlocked) return;
    setCommitting(true);
    setCommitError(null);

    try {
      const res = await commitImportBatch(activeBatchId, {
        confirm_duplicate_file: confirmDuplicateFile
      });
      setCommitResult(res);
      setCommitSuccessOpen(true);
      setActiveBatchId(null);
      setBatchSummary(null);
    } catch (err) {
      setCommitError(err.message || 'Gagal menyimpan import ke database');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Import Rekap Ritase (Excel)" links={breadcrumbLinks} />

      <Stack spacing={3}>
        {/* TOP TABS: IMPORT BARU vs RIWAYAT */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={mainTab} onChange={(_, val) => setMainTab(val)}>
            <Tab label="Import & Preview Excel" />
            <Tab label="Riwayat Batch Import" />
          </Tabs>
        </Box>

        {mainTab === 0 && (
          <>
            {/* UPLOAD FORM (Shown when no active preview batch) */}
            {!activeBatchId && (
              <MainCard title="Unggah File Excel (.xlsx)">
                <Grid container spacing={2}>
                  {uploadError && (
                    <Grid item xs={12}>
                      <Alert severity="error">{uploadError}</Alert>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6} md={3}>
                    <OptionBisnisUnit
                      value={bisnisId}
                      name="bisnisId"
                      label="Unit Bisnis Default"
                      setFieldValue={(_, val) => setBisnisId(val)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <OptionCabang
                      value={cabangId}
                      name="cabangId"
                      label="Cabang / Site Tujuan"
                      setFieldValue={(_, val) => setCabangId(val)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Nama Sheet"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      helperText="Default: Input Ritase"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ height: 42, mt: 0.5 }}
                      startIcon={<DocumentUpload />}
                    >
                      {selectedFile ? selectedFile.name : 'Pilih File .xlsx'}
                      <input
                        type="file"
                        hidden
                        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={confirmDuplicateFile}
                          onChange={(e) => setConfirmDuplicateFile(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Izinkan file dengan SHA-256 yang sudah pernah di-import (confirm duplicate file)"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleUploadPreview}
                        disabled={uploading || !selectedFile}
                        startIcon={uploading ? <CircularProgress size={16} /> : <DocumentUpload />}
                      >
                        {uploading ? 'Memproses File...' : 'Mulai Analisa & Preview'}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </MainCard>
            )}

            {/* BATCH PREVIEW SECTION */}
            {activeBatchId && (
              <Stack spacing={3}>
                {/* SUMMARY STATS CARD */}
                <MainCard
                  title={
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="h4" fontWeight={700}>
                        Preview Batch: {batchFileMeta?.file_name}
                      </Typography>
                      <Chip label="PREVIEW" color="info" size="small" />
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<Flash size={16} />}
                        onClick={() => setBulkDialogOpen(true)}
                      >
                        Bulk Patch
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          setActiveBatchId(null);
                          setBatchSummary(null);
                        }}
                      >
                        Ganti File
                      </Button>
                    </Stack>
                  }
                >
                  <Grid container spacing={2}>
                    {commitError && (
                      <Grid item xs={12}>
                        <Alert severity="error">{commitError}</Alert>
                      </Grid>
                    )}

                    {batchSummary?.error_rows > 0 && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          Terdapat <strong>{batchSummary.error_rows} baris ERROR</strong>. Anda harus memperbaiki baris yang error sebelum tombol <strong>Simpan ke Database</strong> dapat diaktifkan (AC-11).
                        </Alert>
                      </Grid>
                    )}

                    {/* STATS TILES */}
                    <Grid item xs={6} sm={2.4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary">Total Baris</Typography>
                        <Typography variant="h4" fontWeight={700}>{batchSummary?.total_rows || 0}</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6} sm={2.4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.lighter' }}>
                        <Typography variant="caption" color="success.dark">OK (Siap Simpan)</Typography>
                        <Typography variant="h4" fontWeight={700} color="success.main">{batchSummary?.ok_rows || 0}</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6} sm={2.4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.lighter' }}>
                        <Typography variant="caption" color="warning.dark">Warning (Perlu Cek)</Typography>
                        <Typography variant="h4" fontWeight={700} color="warning.main">{batchSummary?.warning_rows || 0}</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6} sm={2.4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5, bgcolor: 'error.lighter' }}>
                        <Typography variant="caption" color="error.dark">Error (Gagal Validasi)</Typography>
                        <Typography variant="h4" fontWeight={700} color="error.main">{batchSummary?.error_rows || 0}</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6} sm={2.4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.100' }}>
                        <Typography variant="caption" color="text.secondary">Skipped</Typography>
                        <Typography variant="h4" fontWeight={700} color="text.secondary">{batchSummary?.skipped_rows || 0}</Typography>
                      </Card>
                    </Grid>

                    {/* TOTALS COMPARISON: FILE vs SYSTEM */}
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                          Total dari File Excel:
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Typography variant="caption">Total Ritasi</Typography>
                            <Typography variant="body1" fontWeight={700}>{batchSummary?.file_totals?.ritase ?? '-'}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption">Total Ton</Typography>
                            <Typography variant="body1" fontWeight={700}>{formatNum(batchSummary?.file_totals?.ton)}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption">Total BCM</Typography>
                            <Typography variant="body1" fontWeight={700}>{formatNum(batchSummary?.file_totals?.bcm)}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                          Total Perhitungan Sistem:
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Typography variant="caption">Total Ritasi</Typography>
                            <Typography variant="body1" fontWeight={700}>{batchSummary?.system_totals?.ritase ?? '-'}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption">Total Ton</Typography>
                            <Typography variant="body1" fontWeight={700}>{formatNum(batchSummary?.system_totals?.ton)}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption">Total BCM</Typography>
                            <Typography variant="body1" fontWeight={700}>{formatNum(batchSummary?.system_totals?.bcm)}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </MainCard>

                {/* PREVIEW ROWS TABLE */}
                <MainCard
                  title={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h5" fontWeight={700}>
                        Daftar Baris Preview
                      </Typography>
                      <Chip label={`Menampilkan ${previewRows.length} dari ${totalRowsCount} baris`} size="small" />
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" sx={{ width: 140 }}>
                        <InputLabel>Filter Status</InputLabel>
                        <Select
                          value={rowStatusFilter}
                          label="Filter Status"
                          onChange={(e) => {
                            setRowStatusFilter(e.target.value);
                            setRowParams((p) => ({ ...p, page: 1 }));
                          }}
                        >
                          <MenuItem value="ALL">Semua Status</MenuItem>
                          <MenuItem value="OK">Hanya OK</MenuItem>
                          <MenuItem value="WARNING">Hanya WARNING</MenuItem>
                          <MenuItem value="ERROR">Hanya ERROR</MenuItem>
                          <MenuItem value="SKIPPED">Hanya SKIPPED</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton onClick={() => refreshRows()} size="small" color="primary">
                        <Refresh size={18} />
                      </IconButton>
                    </Stack>
                  }
                  content={false}
                >
                  <TableContainer component={Paper} sx={{ border: 'none', borderRadius: 0, overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 1000 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell sx={{ fontWeight: 700, width: 60 }}>Baris</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 100 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Data Mentah Excel</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Hasil Resolusi Sistem</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Pesan & Validasi</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">Aksi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingRows ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                              <CircularProgress size={32} />
                              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                                Memuat baris preview...
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : previewRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                Tidak ada baris untuk status filter ini.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          previewRows.map((row) => {
                            const isOk = row.status === 'OK';
                            const isWarn = row.status === 'WARNING';
                            const isErr = row.status === 'ERROR';
                            const isSkip = row.status === 'SKIPPED';
                            const needsSplitReview = (row.messages || []).some(
                              (m) => m.code === 'SPLIT_NEEDS_REVIEW' && !row.resolved?.allocation_confirmed
                            );

                            return (
                              <TableRow
                                key={row.row_no}
                                hover
                                sx={{
                                  bgcolor: isErr
                                    ? 'error.lighter'
                                    : isWarn
                                      ? 'warning.lighter'
                                      : isSkip
                                        ? 'grey.100'
                                        : 'inherit'
                                }}
                              >
                                <TableCell sx={{ fontWeight: 700 }}>#{row.row_no}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={row.status}
                                    color={isOk ? 'success' : isWarn ? 'warning' : isErr ? 'error' : 'default'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" display="block">
                                    <strong>DT:</strong> {row.raw?.Hauler || '-'} | <strong>Loader:</strong> {row.raw?.Loader || '-'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    <strong>From:</strong> {row.raw?.From || '-'} &rarr; <strong>To:</strong> {row.raw?.To || '-'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    <strong>Pile ID:</strong> {row.raw?.['Pile ID'] || '-'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Rit: {row.raw?.['Total Ritasi'] || 0} | Tgl: {row.raw?.Tanggal || '-'} | Shift: {row.raw?.Shift || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" display="block">
                                    DT ID: {row.resolved?.dumptruck_id || 'Belum cocok'} | EXC ID: {row.resolved?.excavator_id || 'Belum cocok'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    PIT: {row.resolved?.startpit_id || '-'} | Mat: {row.resolved?.material_id || '-'}
                                  </Typography>
                                  {Array.isArray(row.resolved?.allocations) && row.resolved.allocations.length > 0 && (
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                      {row.resolved.allocations.map((a, aidx) => (
                                        <Chip
                                          key={aidx}
                                          size="small"
                                          variant="outlined"
                                          label={`${a.dom_id}: ${a.ritase} rit`}
                                        />
                                      ))}
                                    </Stack>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {Array.isArray(row.messages) && row.messages.length > 0 ? (
                                    <Stack spacing={0.5}>
                                      {row.messages.map((m, midx) => (
                                        <Typography
                                          key={midx}
                                          variant="caption"
                                          sx={{
                                            color: m.level === 'ERROR' ? 'error.main' : 'warning.main',
                                            fontWeight: 600,
                                            display: 'block'
                                          }}
                                        >
                                          • {m.text || m.code}
                                        </Typography>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Typography variant="caption" color="success.main">
                                      Valid
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={0.5} justifyContent="center">
                                    {needsSplitReview && (
                                      <Tooltip title="Konfirmasi Usulan Split">
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="warning"
                                          onClick={() => handleQuickConfirmSplit(row)}
                                          sx={{ py: 0.2, px: 0.8, fontSize: '0.75rem', textTransform: 'none' }}
                                        >
                                          Konfirmasi
                                        </Button>
                                      </Tooltip>
                                    )}
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleOpenEditRow(row)}
                                      title="Edit Baris"
                                    >
                                      <Edit size={16} />
                                    </IconButton>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Paginate
                      page={currentPage}
                      total={totalRowsCount}
                      lastPage={totalLastPage}
                      perPage={currentPerPage}
                      onPageChange={(newPage) => setRowParams((prev) => ({ ...prev, page: newPage }))}
                    />
                  </Box>
                </MainCard>

                {/* BOTTOM COMMIT ACTION */}
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setActiveBatchId(null);
                      setBatchSummary(null);
                    }}
                  >
                    Batal & Unggah Ulang
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={handleCommit}
                    disabled={committing || isCommitBlocked}
                    startIcon={committing ? <CircularProgress size={16} /> : <TickCircle />}
                  >
                    {committing ? 'Menyimpan...' : 'Simpan ke Database (Commit)'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </>
        )}

        {/* TAB 1: RIWAYAT BATCH IMPORT */}
        {mainTab === 1 && (
          <MainCard
            title={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h4" fontWeight={700}>
                  Riwayat Batch Import Ritase
                </Typography>
                <Chip label={`Total: ${histTotal} Batch`} size="small" />
              </Stack>
            }
            secondary={
              <IconButton onClick={() => refreshBatches()} size="small" color="primary">
                <Refresh size={18} />
              </IconButton>
            }
            content={false}
          >
            <TableContainer component={Paper} sx={{ border: 'none', borderRadius: 0, overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 700 }}>ID Batch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nama File / Sheet</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sumber</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Baris</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Ritasi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Ton</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Waktu Dibuat</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingBatches ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                          Memuat riwayat batch...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : batchList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Belum ada riwayat batch import.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchList.map((b) => (
                      <TableRow key={b.batch_id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {b.batch_id ? `${b.batch_id.slice(0, 8)}...` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {b.file_name || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sheet: {b.sheet_name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" variant="outlined" label={b.source || 'EXCEL_IMPORT'} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={b.status === 'COMMITTED' ? 'success' : b.status === 'PREVIEW' ? 'info' : 'default'}
                            label={b.status}
                          />
                        </TableCell>
                        <TableCell align="right">{b.total_rows || 0}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {b.total_ritase || 0}
                        </TableCell>
                        <TableCell align="right">{formatNum(b.total_ton)}</TableCell>
                        <TableCell>
                          {b.created_at ? moment(b.created_at).format('DD/MM/YYYY HH:mm') : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setSelectedHistoryBatchId(b.batch_id)}
                            title="Lihat Detail Batch"
                          >
                            <Eye size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Paginate
                page={histPage}
                total={histTotal}
                lastPage={histLastPage}
                perPage={historyParams.perPage}
                onPageChange={(newPage) => setHistoryParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Box>
          </MainCard>
        )}
      </Stack>

      {/* DIALOG EDIT BARIS PREVIEW */}
      <Dialog open={editDialogOpen} onClose={() => !savingRow && setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Koreksi Baris #{editingRow?.row_no}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          {editRowError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editRowError}
            </Alert>
          )}

          {editingRow && (
            <Stack spacing={2.5}>
              <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Data Mentah dari Excel:
                </Typography>
                <Typography variant="body2">
                  DT: <strong>{editingRow.raw?.Hauler}</strong> | Loader: <strong>{editingRow.raw?.Loader}</strong> | From: <strong>{editingRow.raw?.From}</strong> | To: <strong>{editingRow.raw?.To}</strong> | Pile ID: <strong>{editingRow.raw?.['Pile ID']}</strong> | Ritasi: <strong>{editingRow.raw?.['Total Ritasi']}</strong>
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <OptionEquipment
                    value={editingRow.resolved.dumptruck_id}
                    name="edit_dt"
                    label="Pilih Dump Truck"
                    setFieldValue={(_, val) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, dumptruck_id: val }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <OptionEquipment
                    value={editingRow.resolved.excavator_id}
                    name="edit_exc"
                    label="Pilih Excavator / Loader"
                    setFieldValue={(_, val) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, excavator_id: val }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <OptionLokasiPit
                    value={editingRow.resolved.startpit_id}
                    name="edit_pit"
                    label="Pilih PIT Asal"
                    setFieldValue={(_, val) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, startpit_id: val }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <OptionMaterialMining
                    value={editingRow.resolved.material_id}
                    name="edit_mat"
                    label="Pilih Jenis Material"
                    setFieldValue={(_, val) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, material_id: val }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Jarak (km)"
                    value={editingRow.resolved.distance_km}
                    onChange={(e) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, distance_km: e.target.value }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Truck Factor (Ton/rit)"
                    value={editingRow.resolved.tf_ton}
                    onChange={(e) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, tf_ton: e.target.value }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Truck Factor (BCM/rit)"
                    value={editingRow.resolved.tf_bcm}
                    onChange={(e) => setEditingRow((prev) => ({
                      ...prev,
                      resolved: { ...prev.resolved, tf_bcm: e.target.value }
                    }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editingRow.resolved.allocation_confirmed}
                        onChange={(e) => setEditingRow((prev) => ({
                          ...prev,
                          resolved: { ...prev.resolved, allocation_confirmed: e.target.checked }
                        }))}
                        color="success"
                      />
                    }
                    label="Konfirmasi Usulan Alokasi Split DOM (hilangkan warning SPLIT_NEEDS_REVIEW)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editingRow.resolved.skip}
                        onChange={(e) => setEditingRow((prev) => ({
                          ...prev,
                          resolved: { ...prev.resolved, skip: e.target.checked }
                        }))}
                        color="error"
                      />
                    }
                    label="Abaikan (Skip) baris ini saat commit"
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setEditDialogOpen(false)} disabled={savingRow}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEditRow}
            disabled={savingRow}
            startIcon={savingRow ? <CircularProgress size={16} /> : <TickCircle />}
          >
            {savingRow ? 'Menyimpan...' : 'Simpan Koreksi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG BULK PATCH */}
      <Dialog open={bulkDialogOpen} onClose={() => !applyingBulk && setBulkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Flash color="#1976d2" size={20} />
            <Typography variant="h5" fontWeight={700}>
              Bulk Patch Baris Preview
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Alert severity="info">
              Perbaikan massal untuk nilai teks yang sering berulang (contoh typo pada nama DOM, Excavator, atau PIT).
            </Alert>

            {bulkResultMsg && (
              <Alert severity={bulkResultMsg.startsWith('Berhasil') ? 'success' : 'error'}>
                {bulkResultMsg}
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Kolom Pencocokan (Match Field)</InputLabel>
              <Select
                value={bulkMatchField}
                label="Kolom Pencocokan (Match Field)"
                onChange={(e) => setBulkMatchField(e.target.value)}
              >
                <MenuItem value="Pile ID">Pile ID (DOM)</MenuItem>
                <MenuItem value="Loader">Loader (Excavator)</MenuItem>
                <MenuItem value="Hauler">Hauler (Dump Truck)</MenuItem>
                <MenuItem value="From">From (PIT)</MenuItem>
                <MenuItem value="To">To (Stockpile)</MenuItem>
                <MenuItem value="Shift">Shift</MenuItem>
                <MenuItem value="Material">Material</MenuItem>
                <MenuItem value="IUP">IUP</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Teks Persis yang Dicocokkan (Raw Value)"
              value={bulkMatchValue}
              onChange={(e) => setBulkMatchValue(e.target.value)}
              placeholder="Contoh: IM 1026 BTS1 15"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Target Properti yang Diubah</InputLabel>
              <Select
                value={bulkSetField}
                label="Target Properti yang Diubah"
                onChange={(e) => setBulkSetField(e.target.value)}
              >
                <MenuItem value="dom_id">dom_id (Kode DOM DB)</MenuItem>
                <MenuItem value="excavator_id">excavator_id</MenuItem>
                <MenuItem value="dumptruck_id">dumptruck_id</MenuItem>
                <MenuItem value="startpit_id">startpit_id</MenuItem>
                <MenuItem value="material_id">material_id</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Nilai Pengganti (Target Value)"
              value={bulkSetValue}
              onChange={(e) => setBulkSetValue(e.target.value)}
              placeholder="Contoh: IM 1026 BTSI 15"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setBulkDialogOpen(false)} disabled={applyingBulk}>
            Tutup
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyBulkPatch}
            disabled={applyingBulk || !bulkMatchValue || !bulkSetValue}
            startIcon={applyingBulk ? <CircularProgress size={16} /> : <Flash />}
          >
            {applyingBulk ? 'Memproses...' : 'Terapkan Bulk Patch'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG HASIL COMMIT */}
      <Dialog open={commitSuccessOpen} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <TickCircle color="#2e7d32" size={24} />
            <Typography variant="h5" fontWeight={700} color="success.main">
              Import Berhasil Disimpan ke Database
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Alert severity="success">
              Batch import telah berhasil di-commit dengan ID:{' '}
              <strong>{commitResult?.batch_id}</strong>
            </Alert>

            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Baris Disimpan</Typography>
                  <Typography variant="body1" fontWeight={700}>{commitResult?.committed_rows} Baris</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Ritasi</Typography>
                  <Typography variant="body1" fontWeight={700}>{commitResult?.totals?.ritase} Rit</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Ton</Typography>
                  <Typography variant="body1" fontWeight={700}>{formatNum(commitResult?.totals?.ton)} T</Typography>
                </Grid>
              </Grid>
            </Box>

            {Array.isArray(commitResult?.dom_status) && commitResult.dom_status.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700}>
                  Status DOM Terkait:
                </Typography>
                <Stack spacing={1}>
                  {commitResult.dom_status.map((ds, dsIdx) => (
                    <Box
                      key={dsIdx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: ds.full ? 'error.main' : 'divider',
                        bgcolor: ds.full ? 'error.lighter' : 'background.paper'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {ds.dom_id}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption">
                            {ds.current_ret} / {ds.target_ret} rit
                          </Typography>
                          {ds.full && <Chip size="small" color="error" label="PENUH" />}
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
          <Link href="/rekap-ritase" passHref style={{ textDecoration: 'none' }}>
            <Button variant="contained" color="primary">
              Lihat Daftar Rekap Ritase
            </Button>
          </Link>
        </DialogActions>
      </Dialog>

      {/* DIALOG DETAIL BATCH RIWAYAT */}
      <Dialog
        open={Boolean(selectedHistoryBatchId)}
        onClose={() => setSelectedHistoryBatchId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Detail Batch Import #{selectedHistoryBatchId}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          {loadingHistDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Nama File</Typography>
                    <Typography variant="body2" fontWeight={600}>{historyBatchDetail?.file_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Sheet</Typography>
                    <Typography variant="body2" fontWeight={600}>{historyBatchDetail?.sheet_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Typography variant="body2" fontWeight={600}>{historyBatchDetail?.status || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Total Ritasi</Typography>
                    <Typography variant="body2" fontWeight={700}>{historyBatchDetail?.total_ritase || 0} Rit</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Total Tonase</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatNum(historyBatchDetail?.total_ton)} T</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Total BCM</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatNum(historyBatchDetail?.total_bcm)} BCM</Typography>
                  </Grid>
                </Grid>
              </Box>

              {historyBatchDetail?.summary && (
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="caption">Total</Typography>
                      <Typography variant="h6">{historyBatchDetail.summary.total_rows || 0}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="caption" color="success.main">OK</Typography>
                      <Typography variant="h6" color="success.main">{historyBatchDetail.summary.ok_rows || 0}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="caption" color="warning.main">Warning</Typography>
                      <Typography variant="h6" color="warning.main">{historyBatchDetail.summary.warning_rows || 0}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="caption" color="error.main">Error</Typography>
                      <Typography variant="h6" color="error.main">{historyBatchDetail.summary.error_rows || 0}</Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setSelectedHistoryBatchId(null)}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
