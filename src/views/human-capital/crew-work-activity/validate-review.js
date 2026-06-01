'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { useSnackbar } from 'notistack';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { ArrowLeft, TaskSquare, TickCircle, CloseCircle } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { validateCrewWorkActivity } from 'api/crew-work-activity';

const REVIEW_STORAGE_KEY = 'crewWorkActivityValidateSelection';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Crew Work Activity', to: '/crew-work-activity' },
  { title: 'Review Validate' }
];

const formatDate = (value) => (value ? moment(value).format('DD MMM YYYY') : '-');
const formatTime = (value) => (value ? String(value).slice(0, 5) : '-');
const formatHour = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
};

const getRelationName = (row, key) => row?.[key]?.nama || row?.[key]?.name || '-';
const normalizeUniqueEligibleRows = (rows = []) => {
  const byId = new Map();

  rows.forEach((row) => {
    if (!row?.id || row.status !== 'A' || row.aktif === 'N') return;
    if (!byId.has(row.id)) byId.set(row.id, row);
  });

  return Array.from(byId.values());
};

export default function CrewWorkActivityValidateReviewScreen() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loadingSelection, setLoadingSelection] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processedIds, setProcessedIds] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(REVIEW_STORAGE_KEY) || '[]');
      const uniqueRows = normalizeUniqueEligibleRows(Array.isArray(parsed) ? parsed : []);
      setRows(uniqueRows);

      if (uniqueRows.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
        sessionStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(uniqueRows));
      }
    } catch (error) {
      setRows([]);
      sessionStorage.removeItem(REVIEW_STORAGE_KEY);
    } finally {
      setLoadingSelection(false);
    }
  }, []);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalProductiveHours += Number(row.jam_kerja_produktif || 0);
        acc.totalOvertimeHours += Number(row.jam_lembur || 0);
        return acc;
      },
      { totalProductiveHours: 0, totalOvertimeHours: 0 }
    );
  }, [rows]);

  const progressValue = rows.length > 0 ? Math.round((processedIds.length / rows.length) * 100) : 0;
  const successCount = results.filter((item) => item.status === 'success').length;
  const failedCount = results.filter((item) => item.status === 'failed').length;

  const handleBack = () => router.push('/crew-work-activity');

  const handleBulkValidate = async () => {
    if (processing || rows.length === 0) return;

    const successfulIds = new Set(results.filter((item) => item.status === 'success').map((item) => item.id));
    const rowsToProcess = rows.filter((row) => !successfulIds.has(row.id));

    if (rowsToProcess.length === 0) return;

    setProcessing(true);

    const nextResults = results.filter((item) => item.status === 'success');
    const alreadyProcessed = new Set(nextResults.map((item) => item.id));

    for (const row of rowsToProcess) {
      if (alreadyProcessed.has(row.id)) continue;
      alreadyProcessed.add(row.id);

      try {
        const response = await validateCrewWorkActivity(row.id);
        const isError = response?.diagnostic?.error;

        if (isError) {
          nextResults.push({ id: row.id, status: 'failed', message: response?.diagnostic?.message || 'Gagal validate' });
        } else {
          nextResults.push({ id: row.id, status: 'success', message: response?.diagnostic?.message || 'Berhasil validate' });
          const successfulStorageIds = new Set(nextResults.filter((item) => item.status === 'success').map((item) => item.id));
          sessionStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(rows.filter((item) => !successfulStorageIds.has(item.id))));
        }
      } catch (error) {
        nextResults.push({
          id: row.id,
          status: 'failed',
          message: error?.diagnostic?.message || error?.message || 'Gagal validate'
        });
      } finally {
        setProcessedIds((prev) => (prev.includes(row.id) ? prev : [...prev, row.id]));
        setResults([...nextResults]);
      }
    }

    setProcessing(false);

    const finalSuccessCount = nextResults.filter((item) => item.status === 'success').length;
    const finalFailedCount = nextResults.filter((item) => item.status === 'failed').length;

    if (finalSuccessCount === rows.length) {
      sessionStorage.removeItem(REVIEW_STORAGE_KEY);
      enqueueSnackbar(`${finalSuccessCount} data berhasil divalidasi`, { variant: 'success' });
    } else {
      enqueueSnackbar(`Validasi selesai: ${finalSuccessCount} berhasil, ${finalFailedCount} gagal`, { variant: 'warning' });
    }
  };

  return (
    <>
      <Breadcrumbs custom heading="Review Bulk Validate Crew Work Activity" links={breadcrumbLinks} />
      <MainCard
        title={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Stack spacing={0.25}>
              <Typography variant="h5">Review Validate</Typography>
              <Typography variant="caption" color="text.secondary">
                Cek kembali data approved sebelum dikunci menjadi validated.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="secondary" startIcon={<ArrowLeft size={18} />} onClick={handleBack} disabled={processing}>
                Kembali
              </Button>
              <Button variant="contained" color="primary" startIcon={<TaskSquare size={18} />} onClick={handleBulkValidate} disabled={processing || rows.length === 0 || successCount === rows.length}>
                Bulk Validate
              </Button>
            </Stack>
          </Stack>
        }
      >
        <Stack spacing={2.5}>
          {loadingSelection ? <Alert severity="info">Memuat data pilihan...</Alert> : null}
          {!loadingSelection && rows.length === 0 ? (
            <Alert severity="warning">
              Tidak ada data eligible untuk divalidasi. Pilih data dengan status Approved dari halaman Crew Work Activity.
            </Alert>
          ) : null}

          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`${rows.length} data siap validate`} color="info" variant="light" />
                  <Chip label={`Produktif ${summary.totalProductiveHours.toFixed(2)} jam`} color="primary" variant="light" />
                  <Chip label={`Lembur ${summary.totalOvertimeHours.toFixed(2)} jam`} color="success" variant="light" />
                </Stack>
                <Stack spacing={0.5} sx={{ minWidth: { xs: '100%', md: 360 } }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Progress validasi</Typography>
                    <Typography variant="caption" color="text.secondary">{processedIds.length}/{rows.length} ({progressValue}%)</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progressValue} />
                  {results.length > 0 ? (
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" icon={<TickCircle size={14} />} label={`${successCount} berhasil`} color="success" variant="light" />
                      <Chip size="small" icon={<CloseCircle size={14} />} label={`${failedCount} gagal`} color={failedCount > 0 ? 'error' : 'default'} variant="light" />
                    </Stack>
                  ) : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Table size="small" stickyHeader sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider', verticalAlign: 'middle', whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 80 }}>ID</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Tanggal</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Crew</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Cabang / Area</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Jam Kerja</TableCell>
                  <TableCell align="right" sx={{ minWidth: 110 }}>Produktif</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Lembur</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Pengawas</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Hasil Validate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const result = results.find((item) => item.id === row.id);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>#{row.id}</TableCell>
                      <TableCell>{formatDate(row.tanggal)}</TableCell>
                      <TableCell>{getRelationName(row, 'crew')}</TableCell>
                      <TableCell>{row?.cabang?.nama || row.area || '-'}</TableCell>
                      <TableCell>{formatTime(row.jam_mulai)} - {formatTime(row.jam_selesai)}</TableCell>
                      <TableCell align="right">{formatHour(row.jam_kerja_produktif)}</TableCell>
                      <TableCell align="right">{formatHour(row.jam_lembur)}</TableCell>
                      <TableCell>{getRelationName(row, 'supervisor')}</TableCell>
                      <TableCell><Chip label="Approved" color="success" size="small" variant="light" /></TableCell>
                      <TableCell>
                        {result ? (
                          <Chip
                            size="small"
                            label={result.status === 'success' ? 'Berhasil' : result.message}
                            color={result.status === 'success' ? 'success' : 'error'}
                            variant="light"
                          />
                        ) : processedIds.includes(row.id) ? (
                          <Chip size="small" label="Diproses" color="info" variant="light" />
                        ) : (
                          <Chip size="small" label="Menunggu" color="default" variant="light" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Catatan: data yang sama otomatis dibuang berdasarkan ID, dan hanya status Approved yang diproses. Backend tetap menjadi validasi final.
            </Typography>
          </Box>
        </Stack>
      </MainCard>
    </>
  );
}
