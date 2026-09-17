'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { ArrowRight2, Clock, Filter, Refresh } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { getBreakdownMasters } from 'api/daily-breakdown-form';
import { useWorkOrderList } from 'api/work-order';
import { getWorkOrderStatusInfo, parseApiDate, WORK_ORDER_STATUS } from '../breakdown/utils';

const INITIAL_FILTERS = {
  page: 1,
  perPage: 25,
  status: [],
  cabang_id: '',
  equipment_id: '',
  lokasi_id: '',
  startdate: '',
  enddate: '',
  search_kode: '',
  search_issue: ''
};

const formatDateTime = (value) => {
  const date = parseApiDate(value);
  return date ? date.format('DD MMM YYYY, HH:mm') : '-';
};

const buildParams = (filters) => {
  const params = { page: filters.page, perPage: filters.perPage };
  if (filters.status.length) params.status = filters.status.join(',');
  ['cabang_id', 'equipment_id', 'lokasi_id', 'startdate', 'enddate', 'search_kode', 'search_issue'].forEach((key) => {
    if (filters[key]) params[key] = filters[key];
  });
  return params;
};

const hasActiveFilters = (filters) =>
  filters.status.length > 0 ||
  ['cabang_id', 'equipment_id', 'lokasi_id', 'startdate', 'enddate', 'search_kode', 'search_issue'].some((key) => !!filters[key]);

const latestAction = (actions = []) =>
  actions
    .filter((action) => action.aktif !== 'N')
    .sort((a, b) => (parseApiDate(b.starttime)?.valueOf() || 0) - (parseApiDate(a.starttime)?.valueOf() || 0))[0];

const twoLineText = {
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  lineHeight: 1.45
};

export default function WorkOrderList() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [masters, setMasters] = useState({ cabangs: [], equipments: [], lokasis: [] });
  const params = useMemo(() => buildParams(filters), [filters]);
  const { data, total, dataLoading, dataError, mutate } = useWorkOrderList(params);

  useEffect(() => {
    let active = true;
    getBreakdownMasters()
      .then((result) => {
        if (active) setMasters(result);
      })
      .catch(() => {
        if (active) setMasters({ cabangs: [], equipments: [], lokasis: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const setPage = (page) => setFilters((current) => ({ ...current, page }));
  const filtered = hasActiveFilters(filters);

  return (
    <>
      <Breadcrumbs
        custom
        heading="Daily Work Order"
        links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Maintenances' }, { title: 'Daily Work Order', to: '/daily-work-order' }]}
      />

      <MainCard
        title={
          <Box>
            <Typography variant="h4">Daftar Work Order</Typography>
            <Typography variant="caption" color="text.secondary">Monitoring tindakan perbaikan equipment</Typography>
          </Box>
        }
        secondary={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Filter">
              <IconButton color={filtered ? 'primary' : 'default'} onClick={() => setFilterOpen(true)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Filter size={20} variant={filtered ? 'Bold' : 'Outline'} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={() => mutate()} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Refresh size={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        content={false}
      >
        {dataError && <Alert severity="error" sx={{ m: 2.5, mb: 0 }}>{dataError?.message || 'Gagal memuat Work Order'}</Alert>}

        {dataLoading && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {!dataLoading && data.length === 0 && <Alert severity="info" sx={{ m: 2.5 }}>Tidak ada data Work Order</Alert>}

        {!dataLoading && mobile && data.length > 0 && (
          <Stack spacing={1.5} sx={{ p: 2 }}>
            {data.map((row) => {
              const status = getWorkOrderStatusInfo(row.status);
              const action = latestAction(row.actions);
              return (
                <Card key={row.id} variant="outlined" component={Link} href={`/daily-work-order/${row.id}`} sx={{ color: 'inherit', textDecoration: 'none' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{row.equipment?.kode || row.unit || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.kode_wo || 'Tanpa kode WO'}</Typography>
                      </Box>
                      <Chip size="small" label={status.label} sx={{ bgcolor: status.bg, color: status.text, fontWeight: 600 }} />
                    </Stack>
                    <Typography variant="body2" fontWeight={600} sx={{ my: 1 }}>{row.problem_issue || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.breakdown?.cabang?.nama || '-'} · {row.breakdown?.lokasi?.nama || '-'}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Clock size={14} />
                        <Typography variant="caption">{formatDateTime(row.services_at)} - {formatDateTime(row.ready_at)}</Typography>
                      </Stack>
                      <ArrowRight2 size={18} />
                    </Stack>
                    {action && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Aksi terakhir: {action.narasi || '-'}</Typography>}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {!dataLoading && !mobile && data.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1180, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 54, bgcolor: 'grey.100', fontWeight: 700 }}>No</TableCell>
                  <TableCell sx={{ width: 150, bgcolor: 'grey.100', fontWeight: 700 }}>Work Order</TableCell>
                  <TableCell sx={{ width: 170, bgcolor: 'grey.100', fontWeight: 700 }}>Equipment</TableCell>
                  <TableCell sx={{ width: 150, bgcolor: 'grey.100', fontWeight: 700 }}>Breakdown</TableCell>
                  <TableCell sx={{ width: 220, bgcolor: 'grey.100', fontWeight: 700 }}>Problem Issue</TableCell>
                  <TableCell sx={{ width: 210, bgcolor: 'grey.100', fontWeight: 700 }}>Aksi Terakhir</TableCell>
                  <TableCell sx={{ width: 170, bgcolor: 'grey.100', fontWeight: 700 }}>Waktu Perbaikan</TableCell>
                  <TableCell align="center" sx={{ width: 120, bgcolor: 'grey.100', fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ width: 90, bgcolor: 'grey.100', fontWeight: 700 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => {
                  const status = getWorkOrderStatusInfo(row.status);
                  const action = latestAction(row.actions);
                  const breakdownAt = parseApiDate(row.breakdown?.breakdown_at);
                  return (
                    <TableRow key={row.id} hover sx={{ '& > td': { py: 1.5, verticalAlign: 'top' } }}>
                      <TableCell align="center" sx={{ color: 'text.secondary' }}>{(filters.page - 1) * filters.perPage + index + 1}</TableCell>
                      <TableCell sx={{ borderLeft: '3px solid', borderLeftColor: status.color }}>
                        <Typography variant="body2" fontWeight={700}>{row.kode_wo || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{row.breakdown?.cabang?.nama || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{row.breakdown?.lokasi?.nama || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.equipment?.kode || row.unit || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{row.equipment?.model || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{breakdownAt ? breakdownAt.format('DD-MM-YYYY') : '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{breakdownAt ? breakdownAt.format('ddd, HH:mm') : '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={row.problem_issue || '-'} placement="top-start">
                          <Typography variant="body2" sx={twoLineText}>{row.problem_issue || '-'}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={action?.narasi || '-'} placement="top-start">
                          <Typography variant="body2" sx={twoLineText}>{action?.narasi || '-'}</Typography>
                        </Tooltip>
                        {action && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {action.karyawan?.nama || 'Teknisi'} · {formatDateTime(action.starttime)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.75}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">Mulai</Typography>
                            <Typography variant="body2">{formatDateTime(row.services_at)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">Selesai</Typography>
                            <Typography variant="body2">{formatDateTime(row.ready_at)}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={status.label} sx={{ bgcolor: status.bg, color: status.text, fontWeight: 700, minWidth: 84 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" component={Link} href={`/daily-work-order/${row.id}`} sx={{ minWidth: 0, px: 1.25 }}>Detail</Button>
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
          onPageChange={(_event, page) => setPage(page + 1)}
          rowsPerPage={filters.perPage}
          onRowsPerPageChange={(event) => setFilters((current) => ({ ...current, page: 1, perPage: Number(event.target.value) }))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
        />
      </MainCard>

      <WorkOrderFilter
        open={filterOpen}
        filters={filters}
        masters={masters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters({ ...next, page: 1 });
          setFilterOpen(false);
        }}
        onReset={() => {
          setFilters(INITIAL_FILTERS);
          setFilterOpen(false);
        }}
      />
    </>
  );
}

function WorkOrderFilter({ open, filters, masters, onClose, onApply, onReset }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  const toggleStatus = (code) => {
    setLocal((current) => ({
      ...current,
      status: current.status.includes(code) ? current.status.filter((item) => item !== code) : [...current.status, code]
    }));
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 350, sm: 474 } } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4">Filter Work Order</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Pilih kriteria pencarian Work Order</Typography>

        <Stack spacing={3} sx={{ flex: 1, overflowY: 'auto' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Status</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {WORK_ORDER_STATUS.map((option) => {
                const selected = local.status.includes(option.code);
                return (
                  <Chip
                    key={option.code}
                    label={`${option.code} · ${option.label}`}
                    size="small"
                    onClick={() => toggleStatus(option.code)}
                    variant={selected ? 'filled' : 'outlined'}
                    sx={{ bgcolor: selected ? option.color : 'transparent', color: selected ? '#fff' : 'text.primary', borderColor: option.color }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Stack spacing={2}>
            <TextField label="Kode Work Order" size="small" value={local.search_kode} onChange={(event) => setLocal((current) => ({ ...current, search_kode: event.target.value }))} />
            <TextField label="Problem Issue" size="small" value={local.search_issue} onChange={(event) => setLocal((current) => ({ ...current, search_issue: event.target.value }))} />
            <Autocomplete
              options={masters.cabangs || []}
              getOptionLabel={(option) => option?.nama || ''}
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              value={(masters.cabangs || []).find((item) => String(item.id) === String(local.cabang_id)) || null}
              onChange={(_event, value) => setLocal((current) => ({ ...current, cabang_id: value?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Cabang" size="small" />}
            />
            <Autocomplete
              options={masters.equipments || []}
              getOptionLabel={(option) => option?.kode ? `${option.kode} - ${option.nama || ''}` : option?.nama || ''}
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              value={(masters.equipments || []).find((item) => String(item.id) === String(local.equipment_id)) || null}
              onChange={(_event, value) => setLocal((current) => ({ ...current, equipment_id: value?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Equipment" size="small" />}
            />
            <Autocomplete
              options={masters.lokasis || []}
              getOptionLabel={(option) => option?.nama || option?.nama_lokasi || ''}
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              value={(masters.lokasis || []).find((item) => String(item.id) === String(local.lokasi_id)) || null}
              onChange={(_event, value) => setLocal((current) => ({ ...current, lokasi_id: value?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Lokasi" size="small" />}
            />
          </Stack>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Tanggal Breakdown</Typography>
            <Stack direction="row" spacing={1.5}>
              <TextField label="Mulai" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={local.startdate} onChange={(event) => setLocal((current) => ({ ...current, startdate: event.target.value }))} />
              <TextField label="Selesai" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={local.enddate} onChange={(event) => setLocal((current) => ({ ...current, enddate: event.target.value }))} />
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" fullWidth onClick={onReset} disabled={!hasActiveFilters(local)}>Reset</Button>
          <Button variant="contained" fullWidth onClick={() => onApply(local)}>Terapkan</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
