'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/id';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Calendar, DocumentDownload, Filter, Refresh, DocumentText, Chart21 } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  useBreakdownList,
  useBreakdownStatistics,
  downloadBreakdownPdf,
  getBreakdownMasters
} from 'api/daily-breakdown-form';
import { downloadSummaryBreakdownPdf } from 'api/summary-breakdown';
import {
  BREAKDOWN_STATUS,
  buildCompactParams,
  calculateDuration,
  defaultFilters,
  formatBreakdownAt,
  formatDateIssue,
  getStatusInfo,
  hasActiveFilters
} from './utils';

moment.locale('id');

const saveDownload = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const SUMMARY_CARDS = [
  { key: 'total', label: 'Total', color: '#6366f1', bg: '#eef2ff', field: 'total' },
  { key: 0, label: 'Tunggu Teknisi', color: '#92400e', bg: '#fef3c7', field: 'waiting_teknisi' },
  { key: 1, label: 'Tunggu Part', color: '#831843', bg: '#fef9c3', field: 'waiting_part' },
  { key: 8, label: 'Sedang Dikerjakan', color: '#1e40af', bg: '#dbeafe', field: 'in_progress' },
  { key: 9, label: 'Selesai', color: '#064e3b', bg: '#d1fae5', field: 'completed' }
];

export default function BreakdownList() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));

  const [filters, setFilters] = useState(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportAnchor, setReportAnchor] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState('');
  const [masters, setMasters] = useState({ cabangs: [], equipments: [], lokasis: [], penyewas: [], shifts: [], pengawases: [] });

  const compactParams = useMemo(() => buildCompactParams(filters), [filters]);
  const { data, total, dataLoading, dataError, mutate } = useBreakdownList(compactParams, true);
  const { data: statistics, dataLoading: statLoading } = useBreakdownStatistics(compactParams, true);

  useEffect(() => {
    let mounted = true;
    getBreakdownMasters()
      .then((result) => {
        if (mounted) {
          setMasters(result);
          if (result._failed.length > 0) {
            openNotification({
              open: true,
              message: `Beberapa data master gagal dimuat: ${result._failed.join(', ')}`,
              alert: { color: 'warning', variant: 'filled' },
              variant: 'alert'
            });
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));

  const filtered = hasActiveFilters(filters);

  const handleApplyFilter = (nextFilters) => {
    setFilters({ ...nextFilters, page: 1 });
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setFilters({ ...defaultFilters });
    setFilterOpen(false);
  };

  const handleOutstandingReport = async () => {
    setReportAnchor(null);
    if (downloadingReport) return;
    setDownloadingReport('outstanding');
    try {
      const apiFilters = buildCompactParams(filters);
      const today = moment().format('YYYY-MM-DD');
      const params = {
        ...apiFilters,
        startdate: apiFilters.startdate || today,
        enddate: apiFilters.enddate || today
      };
      const { blob, filename } = await downloadBreakdownPdf(params);
      saveDownload({ blob, filename });
      openNotification({ open: true, message: 'Laporan outstanding berhasil diunduh', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
    } catch (error) {
      openNotification({ open: true, message: error?.message || 'Gagal mengunduh laporan', alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setDownloadingReport('');
    }
  };

  const handleDowntimeReport = async () => {
    setReportAnchor(null);
    if (downloadingReport) return;
    setDownloadingReport('downtime');
    try {
      const apiFilters = buildCompactParams(filters);
      const startdate = apiFilters.startdate || moment().startOf('month').format('YYYY-MM-DD');
      const enddate = apiFilters.enddate || moment().format('YYYY-MM-DD');
      const params = {
        startdate,
        enddate,
        equipment_ids: apiFilters.equipment_id || undefined,
        lokasi_ids: apiFilters.lokasi_id || undefined
      };
      const { blob, filename } = await downloadSummaryBreakdownPdf(params);
      saveDownload({ blob, filename });
      openNotification({ open: true, message: 'Laporan downtime berhasil diunduh', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
    } catch (error) {
      openNotification({ open: true, message: error?.message || 'Gagal mengunduh laporan', alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setDownloadingReport('');
    }
  };

  const rows = useMemo(() => data || [], [data]);

  const equipmentOption = (id) => masters.equipments.find((item) => String(item.id) === String(id)) || null;
  const cabangOption = (row) => {
    if (!row?.cabang) return null;
    return masters.cabangs.find((item) => String(item.id) === String(row.cabang.id)) || row.cabang;
  };
  const lokasiOption = (id) => masters.lokasis.find((item) => String(item.id) === String(id)) || null;

  return (
    <>
      <Breadcrumbs custom heading="Daily Breakdown" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Maintenances' }, { title: 'Daily Breakdown', to: '/daily-breakdown' }]} />

      <SummaryCards statistics={statistics} loading={statLoading} />

      <MainCard
        sx={{ mt: 2 }}
        title={
          <Button component={Link} href="/daily-breakdown/create" variant="contained" startIcon={<Add size={18} />}>
            Buat Breakdown
          </Button>
        }
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Filter">
              <IconButton color={filtered ? 'primary' : 'default'} onClick={() => setFilterOpen(true)} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Filter size={20} variant={filtered ? 'Bold' : 'Outline'} />
                {filtered && <Box component="span" sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={() => mutate()} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Refresh size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Report">
              <IconButton onClick={(event) => setReportAnchor(event.currentTarget)} disabled={!!downloadingReport} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                {downloadingReport ? <CircularProgress size={18} /> : <DocumentDownload size={20} />}
              </IconButton>
            </Tooltip>
          </Stack>
        }
        content={false}
      >
        {dataError && (
          <Alert severity="error" sx={{ m: 2.5, mb: 0 }}>
            {dataError?.message || 'Gagal memuat data breakdown'}
          </Alert>
        )}

        {dataLoading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {!dataLoading && rows.length === 0 && (
          <Alert severity="info" sx={{ m: 2.5 }}>
            Tidak ada data breakdown
          </Alert>
        )}

        {!dataLoading && mobile && rows.length > 0 && (
          <Stack spacing={1.5} sx={{ p: 2 }}>
            {rows.map((row) => {
              const statusInfo = getStatusInfo(row.status);
              const eq = equipmentOption(row.equipment_id);
              return (
                <Card key={row.id} variant="outlined" component={Link} href={`/daily-breakdown/${row.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {row.equipment?.kode || eq?.kode || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.cabang?.area || '-'} {row.cabang?.nama || '-'}
                        </Typography>
                      </Box>
                      <Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.text, fontWeight: 600 }} />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Calendar size={14} />
                        <Typography variant="body2">{formatDateIssue(row.date_issue)}</Typography>
                      </Stack>
                      <Typography variant="body2">{formatBreakdownAt(row.breakdown_at)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, px: 1, py: 0.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption">Problems: {row.items?.length || 0} issue</Typography>
                      <Typography variant="caption">Durasi: {calculateDuration(row.breakdown_at, row.ready_at).text}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Lokasi: {row.lokasi?.nama || '-'}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {!dataLoading && !mobile && rows.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                  <TableCell>No</TableCell>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Cabang</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>BD At</TableCell>
                  <TableCell align="center">Issues</TableCell>
                  <TableCell>Durasi</TableCell>
                  <TableCell>Lokasi</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => {
                  const statusInfo = getStatusInfo(row.status);
                  const eq = equipmentOption(row.equipment_id);
                  const cb = cabangOption(row);
                  const lk = lokasiOption(row.lokasi_id);
                  const no = (filters.page - 1) * filters.perPage + index + 1;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{no}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {row.equipment?.kode || eq?.kode || '-'}
                        </Typography>
                        <Typography variant="body2" color={"text.secondary"} sx={{ fontSize: 10, lineHeight: 1.2 }}>
                          {row.equipment?.model || eq?.manufaktur || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="overline" color="text.primary">
                          {cb?.nama || row.cabang?.nama || '-'}
                        </Typography>
                        <Typography variant="body2" color={"text.secondary"} sx={{ fontSize: 10, lineHeight: 1.2 }}>
                          {cb?.area || row.cabang?.area || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDateIssue(row.date_issue)}</TableCell>
                      <TableCell>{formatBreakdownAt(row.breakdown_at)}</TableCell>
                      <TableCell align="center">
                        <Chip label={row.items?.length || 0} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{calculateDuration(row.breakdown_at, row.ready_at).text}</Typography>
                      </TableCell>
                      <TableCell>{lk?.nama || row.lokasi?.nama || '-'}</TableCell>
                      <TableCell>
                        <Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.text, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Button size="small" variant="outlined" component={Link} href={`/daily-breakdown/${row.id}`}>
                            Detail
                          </Button>
                          <Button size="small" variant="contained" color="warning" component={Link} href={`/daily-breakdown/${row.id}/edit`}>
                            Edit
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={total || 0}
          page={filters.page - 1}
          onPageChange={(_e, page) => setFilter('page', page + 1)}
          rowsPerPage={filters.perPage}
          onRowsPerPageChange={(e) => setFilters((current) => ({ ...current, perPage: Number(e.target.value), page: 1 }))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
        />
      </MainCard>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
        masters={masters}
      />

      <ReportMenu
        anchorEl={reportAnchor}
        onClose={() => setReportAnchor(null)}
        onOutstanding={handleOutstandingReport}
        onDowntime={handleDowntimeReport}
        downloading={downloadingReport}
      />
    </>
  );
}

function SummaryCards({ statistics, loading }) {
  const values = {
    total: statistics?.total || 0,
    waiting_teknisi: statistics?.by_status?.waiting_teknisi || 0,
    waiting_part: statistics?.by_status?.waiting_part || 0,
    in_progress: statistics?.by_status?.in_progress || 0,
    completed: statistics?.by_status?.completed || 0
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      {SUMMARY_CARDS.map((card) => (
        <Box
          key={card.key}
          sx={{
            flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 0' },
            minWidth: 0
          }}
        >
          <Card variant="outlined" sx={{ height: '100%', borderColor: card.color, bgcolor: 'background.paper' }}>
            <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 }, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 6, height: 28, borderRadius: 1, bgcolor: card.color, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ color: card.color, fontWeight: 700, lineHeight: 1.2 }}>
                  {loading ? <CircularProgress size={14} /> : values[card.field]}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}

function FilterDrawer({ open, onClose, filters, onApply, onReset, masters }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  const toggleStatus = (code) => {
    setLocal((prev) => {
      const arr = Array.isArray(prev.status) ? prev.status : [];
      return {
        ...prev,
        status: arr.includes(code) ? arr.filter((s) => s !== code) : [...arr, code]
      };
    });
  };

  const isFiltered = useMemo(() => hasActiveFilters(local), [local]);

  return (
    <Drawer open={open} onClose={onClose} anchor="right" PaperProps={{ sx: { width: { xs: 350, sm: 474 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Filter Daily Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Pilih kriteria untuk memfilter data
        </Typography>

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Status Breakdown
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {BREAKDOWN_STATUS.map((opt) => {
                  const active = local.status?.includes(opt.code);
                  return (
                    <Chip
                      key={opt.code}
                      label={opt.label}
                      size="small"
                      onClick={() => toggleStatus(opt.code)}
                      color={active ? 'primary' : 'default'}
                      variant={active ? 'filled' : 'outlined'}
                      sx={{
                        bgcolor: active ? opt.color : 'transparent',
                        color: active ? '#fff' : 'text.primary',
                        borderColor: opt.color,
                        '&:hover': { bgcolor: active ? opt.color : `${opt.bg}` }
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Cabang / Equipment / Lokasi
              </Typography>
              <Stack spacing={2}>
                <Autocomplete
                  options={masters.cabangs}
                  getOptionLabel={(option) => (option?.nama ? `[${option.kode || ''}] ${option.nama}` : '')}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={masters.cabangs.find((item) => String(item.id) === String(local.cabang_id)) || null}
                  onChange={(_e, value) => setLocal((prev) => ({ ...prev, cabang_id: value?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="Cabang" size="small" />}
                />
                <Autocomplete
                  options={masters.equipments}
                  getOptionLabel={(option) => (option?.kode ? `${option.kode} - ${option.nama || ''}` : option?.nama || '')}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={masters.equipments.find((item) => String(item.id) === String(local.equipment_id)) || null}
                  onChange={(_e, value) => setLocal((prev) => ({ ...prev, equipment_id: value?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="Equipment" size="small" />}
                />
                <Autocomplete
                  options={masters.lokasis}
                  getOptionLabel={(option) => option?.nama || option?.nama_lokasi || ''}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={masters.lokasis.find((item) => String(item.id) === String(local.lokasi_id)) || null}
                  onChange={(_e, value) => setLocal((prev) => ({ ...prev, lokasi_id: value?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="Lokasi" size="small" />}
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Rentang Tanggal
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Mulai"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={local.startdate}
                  onChange={(e) => setLocal((prev) => ({ ...prev, startdate: e.target.value }))}
                />
                <TextField
                  label="Selesai"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={local.enddate}
                  onChange={(e) => setLocal((prev) => ({ ...prev, enddate: e.target.value }))}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Format: YYYY-MM-DD
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" fullWidth onClick={onReset} disabled={!isFiltered}>
            Reset
          </Button>
          <Button variant="contained" fullWidth onClick={() => onApply(local)}>
            Terapkan Filter
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

function ReportMenu({ anchorEl, onClose, onOutstanding, onDowntime, downloading }) {
  return (
    <Drawer anchor="right" open={!!anchorEl} onClose={onClose} PaperProps={{ sx: { width: { xs: 320, sm: 380 } } }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Laporan Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Pilih jenis laporan yang ingin diunduh
        </Typography>

        <MenuList>
          <MenuItem onClick={onOutstanding} disabled={!!downloading}>
            <ListItemIcon>
              {downloading === 'outstanding' ? <CircularProgress size={20} /> : <DocumentText size={22} variant="Bold" />}
            </ListItemIcon>
            <ListItemText
              primary="Outstanding Breakdown Report"
              secondary={downloading === 'outstanding' ? 'Mengunduh PDF...' : 'Unduh PDF laporan breakdown (filter aktif)'}
            />
          </MenuItem>
          <MenuItem onClick={onDowntime} disabled={!!downloading}>
            <ListItemIcon>
              {downloading === 'downtime' ? <CircularProgress size={20} /> : <Chart21 size={22} variant="Bold" />}
            </ListItemIcon>
            <ListItemText
              primary="Equipment Downtime Report"
              secondary={downloading === 'downtime' ? 'Mengunduh PDF...' : 'Unduh PDF summary downtime'}
            />
          </MenuItem>
        </MenuList>

        <Button variant="outlined" fullWidth sx={{ mt: 3 }} onClick={onClose}>
          Batal
        </Button>
      </Box>
    </Drawer>
  );
}