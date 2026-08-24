'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import MainCard from 'components/MainCard';
import CircularLoader from 'components/CircularLoader';
import { useGetCustomersProductivityDetail } from 'api/customers-productivity';

const TYPE_LABELS = {
  standby: 'Standby',
  opportunity: 'Opportunity',
  operating: 'Operating'
};

const TYPE_COLORS = {
  standby: 'warning',
  opportunity: 'info',
  operating: 'primary'
};

const CATEGORY_COLORS = {
  breakdown: 'error',
  no_operator_driver: 'warning',
  no_job: 'default',
  fuel: 'success',
  hujan: 'info',
  jalan_licin: 'secondary',
  public: 'primary',
  arahan: 'info',
  commissioning: 'secondary',
  operating: 'primary'
};

const formatDecimal = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0.0';
  return parsed.toFixed(1);
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function CustomersProductivityDetailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const theme = useTheme();

  const type = searchParams.get('type') || '';
  const equipmentId = searchParams.get('equipment_id') || '';
  const penyewaName = searchParams.get('penyewa_name') || '';
  const equipmentCode = searchParams.get('equipment_code') || '';
  const startdate = searchParams.get('startdate') || '';
  const enddate = searchParams.get('enddate') || '';

  const params = useMemo(
    () => ({
      type,
      equipment_id: equipmentId,
      startdate,
      enddate
    }),
    [type, equipmentId, startdate, enddate]
  );

  const isCustomer =
    session?.authPortal === 'customers' ||
    String(session?.usertype || '').toLowerCase() === 'customers';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login-customers');
      return;
    }
    if (status === 'authenticated' && !isCustomer) {
      router.push('/home');
    }
  }, [status, isCustomer, router]);

  const { data, dataLoading, dataError, pelangganNama } = useGetCustomersProductivityDetail(
    status === 'authenticated' && isCustomer ? params : null
  );

  const typeLabel = TYPE_LABELS[type] || type;
  const displayName = penyewaName || pelangganNama || session?.pelanggan_nama || '-';

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <Box sx={{ p: 4 }}>
        <CircularLoader />
      </Box>
    );
  }

  if (!isCustomer) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              aria-label="back"
              variant="dashed"
              color="secondary"
              onClick={() => router.push('/customers/productivity')}
            >
              <KeyboardArrowDownIcon style={{ transform: 'rotate(90deg)' }} />
            </IconButton>
            <Box>
              <Typography variant="h4">Detail {typeLabel}</Typography>
              <Typography variant="caption" color="text.secondary">
                {displayName} • {equipmentCode} • {formatDate(startdate)} s/d {formatDate(enddate)}
              </Typography>
            </Box>
          </Stack>
        }
        content={false}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          {dataError ? (
            <Alert severity="error">{dataError?.diagnostic?.message || dataError?.message || 'Gagal memuat detail.'}</Alert>
          ) : null}

          {dataLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : null}

          {!dataLoading && data ? (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Total Hours"
                    value={`${formatDecimal(data.total_hours)} h`}
                    icon={
                      <Avatar
                        sx={{
                          bgcolor: theme.palette[TYPE_COLORS[type]]?.main || theme.palette.primary.main,
                          width: 40,
                          height: 40
                        }}
                      >
                        ⏱
                      </Avatar>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Periode"
                    value={`${formatDate(startdate)} - ${formatDate(enddate)}`}
                    icon={<Avatar sx={{ bgcolor: theme.palette.grey[500], width: 40, height: 40 }}>📅</Avatar>}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Hari Kerja"
                    value={`${data.data?.length || 0} hari`}
                    icon={<Avatar sx={{ bgcolor: theme.palette.info.main, width: 40, height: 40 }}>📊</Avatar>}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Rata-rata/hari"
                    value={`${data.data?.length ? formatDecimal(data.total_hours / data.data.length) : '0.0'} h`}
                    icon={<Avatar sx={{ bgcolor: theme.palette.success.main, width: 40, height: 40 }}>📈</Avatar>}
                  />
                </Grid>
              </Grid>

              {data.category_totals?.length > 0 ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Breakdown per Kategori
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {data.category_totals.map((cat) => (
                        <Chip
                          key={cat.category_key}
                          label={`${cat.category}: ${formatDecimal(cat.total_hours)} h`}
                          color={CATEGORY_COLORS[cat.category_key] || 'default'}
                          variant={cat.category_key === 'breakdown' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600 }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              <DetailTable data={data.data || []} type={type} theme={theme} />
            </>
          ) : null}

          {!dataLoading && !data && !dataError ? <Alert severity="info">Tidak ada data detail tersedia.</Alert> : null}
        </Stack>
      </MainCard>
    </Container>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          {icon}
          <Box>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailTable({ data = [], type, theme }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (date) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const isOperating = type === 'operating';

  const itemColumns = isOperating
    ? ['Kegiatan', 'Lokasi', 'Start', 'Finish', 'SMU Start', 'SMU Finish', 'Hours']
    : ['Kategori', 'Kegiatan', 'Start Time', 'Finish Time', 'Duration'];

  const headerCellSx = {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    borderBottom: `1px solid ${theme.palette.divider}`,
    whiteSpace: 'nowrap',
    fontWeight: 700,
    fontSize: '0.75rem'
  };

  return (
    <TableContainer component={Card} variant="outlined" sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx} padding="checkbox" />
            <TableCell sx={headerCellSx}>
              Tanggal
            </TableCell>
            <TableCell sx={headerCellSx}>Shift</TableCell>
            {isOperating ? <TableCell sx={headerCellSx}>Operator</TableCell> : null}
            <TableCell sx={headerCellSx} align="center">
              Items
            </TableCell>
            <TableCell sx={headerCellSx} align="right">
              Total Hours
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isOperating ? 6 : 5} align="center">
                <Typography variant="body2" sx={{ py: 2 }}>
                  Tidak ada data
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((entry) => {
              const isOpen = expandedRows.has(entry.date_ops);
              const entryTotal = entry.items.reduce(
                (sum, item) => sum + (Number(item.duration_hours) || Number(item.operating_hours) || 0),
                0
              );

              return (
                <DetailRowGroup
                  key={entry.date_ops}
                  entry={entry}
                  isOpen={isOpen}
                  onToggle={() => toggleRow(entry.date_ops)}
                  isOperating={isOperating}
                  itemColumns={itemColumns}
                  headerCellSx={headerCellSx}
                  entryTotal={entryTotal}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DetailRowGroup({ entry, isOpen, onToggle, isOperating, itemColumns, headerCellSx, entryTotal }) {
  return (
    <>
      <TableRow hover onClick={onToggle} sx={{ cursor: 'pointer' }}>
        <TableCell padding="checkbox" sx={{ whiteSpace: 'nowrap' }}>
          <IconButton size="small" aria-label="expand">
            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatDate(entry.date_ops)}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.shift_name || '-'}</TableCell>
        {isOperating ? <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.karyawan_name || '-'}</TableCell> : null}
        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
          <Chip size="small" label={entry.items.length} color="primary" variant="outlined" />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
          {formatDecimal(entryTotal)} h
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0, borderBottom: isOpen ? `1px solid` : 'none' }} colSpan={isOperating ? 6 : 5}>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {itemColumns.map((col) => (
                      <TableCell key={col} sx={{ ...headerCellSx, fontSize: '0.7rem' }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entry.items.map((item, idx) => (
                    <TableRow key={idx} hover>
                      {isOperating ? (
                        <>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.kegiatan_name || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.lokasi_name || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {item.starttime ? formatDateTime(item.starttime) : '-'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {item.endtime ? formatDateTime(item.endtime) : '-'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>{item.smustart || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>{item.smufinish || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600 }}>
                            {formatDecimal(item.operating_hours)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Chip
                              size="small"
                              label={item.category}
                              color={CATEGORY_COLORS[item.category_key] || 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal' }}>{item.kegiatan_name || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {item.start_time ? formatDateTime(item.start_time) : '-'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {item.finish_time ? formatDateTime(item.finish_time) : '-'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600 }}>
                            {formatDecimal(item.duration_hours)} h
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
