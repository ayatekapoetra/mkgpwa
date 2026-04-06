import { useMemo, useState } from 'react';
import moment from 'moment';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Refresh, RestartAlt } from '@mui/icons-material';
import OptionOperatorDriver from 'components/OptionOperatorDriver';
import postTimesheetReconcil from 'api/timesheet-reconcil';
import { APP_DEFAULT_PATH } from 'config';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: num % 1 === 0 ? 0 : 2 });
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatDate = (value) => (value ? moment(value).format('DD MMM YYYY') : '-');
const formatTime = (value) => (value ? moment(value).format('HH:mm') : '-');

const defaultRange = () => {
  const end = moment();
  const start = moment().subtract(6, 'days');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};

const TimesheetReconcil = () => {
  const [filters, setFilters] = useState(() => ({ ...defaultRange(), karyawan_id: '', karyawan: null }));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [expanded, setExpanded] = useState({});

  const handleField = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = async () => {
    setError('');
    setApplied(false);
    setRows([]);

    if (!filters.startDate || !filters.endDate) {
      setError('Silakan isi tanggal mulai dan tanggal akhir.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        karyawan_id: filters.karyawan_id || undefined,
      };

      const data = await postTimesheetReconcil(payload);

      if (data?.diagnostic?.error) {
        setError(data.diagnostic.error);
        setRows([]);
        setApplied(false);
      } else {
        setRows(data?.rows || []);
        setApplied(true);
      }
    } catch (err) {
      const message = err?.message || 'Gagal memuat data';
      setError(message);
      setApplied(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ ...defaultRange(), karyawan_id: '', karyawan: null });
    setRows([]);
    setError('');
    setApplied(false);
  };

  const totals = useMemo(() => {
    const count = rows?.length || 0;
    const grand = rows?.reduce((sum, r) => sum + Number(r?.grandtotal_earning || 0), 0) || 0;
    return { count, grand };
  }, [rows]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderRow = (row) => {
    const isOpen = expanded[row.id];
    return (
      <>
        <TableRow hover key={row.id} sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell padding="checkbox">
            <IconButton size="small" onClick={() => toggleExpand(row.id)}>
              {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell>{formatDate(row.date_ops)}</TableCell>
          <TableCell>
            <Stack spacing={0.5}>
              <Typography fontWeight={700}>{row.nmkaryawan}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {row.karyawan_id}</Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack spacing={0.3}>
              <Typography variant="body2">{`${formatTime(row.starttime)} - ${formatTime(row.endtime)}`}</Typography>
              <Typography variant="caption" color="text.secondary">Rest: {formatNumber(row.totresttime, 2)} jam</Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack spacing={0.3}>
              <Typography variant="body2">Start: {row.smustart}</Typography>
              <Typography variant="body2">Finish: {row.smufinish}</Typography>
              <Typography variant="caption" color="text.secondary">Used: {row.usedsmu}</Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack spacing={0.3}>
              <Typography variant="body2">Kerja: {formatNumber(row.totworktime, 2)}h</Typography>
              <Typography variant="body2">OT: {formatNumber(row.totovertime, 2)}h</Typography>
            </Stack>
          </TableCell>
          <TableCell align="right">{formatCurrency(row.totworkhours_earning)}</TableCell>
          <TableCell align="right">{formatCurrency(row.totovertime_earning)}</TableCell>
          <TableCell align="right">{formatCurrency(row.totinsentifages_earning)}</TableCell>
          <TableCell align="right">{formatCurrency(row.totinsentiftipes_earning)}</TableCell>
          <TableCell align="right">{formatCurrency(row.totinsentiftools_earning)}</TableCell>
          <TableCell align="center">{row.totritasetrip}</TableCell>
          <TableCell align="right">
            <Typography fontWeight={700}>{formatCurrency(row.grandtotal_earning)}</Typography>
          </TableCell>
          <TableCell>
            <Stack spacing={0.5}>
              {row.narasi ? <Chip size="small" label={row.narasi} color="info" variant="outlined" /> : null}
              {row.iserr && (
                <Chip
                  size="small"
                  label={row.iserr === 'A' ? 'Valid' : 'Err'}
                  color={row.iserr === 'A' ? 'success' : 'error'}
                  variant="outlined"
                />
              )}
              {row.errmsg && <Typography variant="caption" color="error">{row.errmsg}</Typography>}
            </Stack>
          </TableCell>
        </TableRow>

        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={13}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detail Items ({row.items?.length || 0})
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={1} direction="column">
                  {(row.items || []).map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                        <Stack spacing={0.3}>
                          <Typography variant="subtitle2">{item.nmkegiatan || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.kdequipment || ''} • {item.nmmaterial || ''}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.startlokasi || ''}</Typography>
                        </Stack>
                        <Stack spacing={0.3} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                          <Typography variant="body2">{formatTime(item.starttime)} - {formatTime(item.endtime)}</Typography>
                          <Typography variant="caption" color="text.secondary">Work: {item.workhours}h • OT: {item.overtime}h</Typography>
                          <Typography variant="body2" fontWeight={700}>{formatCurrency(item.totalearning)}</Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {`Home > Timesheet-Reconcil`}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
        <TextField
          label="Tanggal Mulai"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(e) => handleField('startDate', e.target.value)}
        />
        <TextField
          label="Tanggal Akhir"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={(e) => handleField('endDate', e.target.value)}
        />
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <OptionOperatorDriver
            value={filters.karyawan_id}
            setFieldValue={(name, value) => handleField(name, value)}
            name="karyawan_id"
            objValue="karyawan"
            label="Pilih Karyawan"
          />
        </Box>
        <Stack direction={{ xs: 'row', md: 'row' }} spacing={1}>
          <Button variant="contained" startIcon={<Refresh />} onClick={handleApply} disabled={loading}>
            Terapkan
          </Button>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} disabled={loading}>
            Reset
          </Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress />}

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {applied && !loading && rows?.length === 0 && !error && (
        <Alert severity="info">Tidak ada data untuk filter yang dipilih.</Alert>
      )}

      {applied && rows?.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
            <Stack spacing={0.2}>
              <Typography variant="h6">Rekonsiliasi Timesheet</Typography>
              <Typography variant="body2" color="text.secondary">
                Periode {formatDate(filters.startDate)} s/d {formatDate(filters.endDate)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip label={`Baris: ${totals.count}`} color="primary" variant="outlined" />
              <Chip label={`Grand Total: ${formatCurrency(totals.grand)}`} color="success" variant="filled" />
            </Stack>
          </Stack>

          <TableContainer component={Box} sx={{ overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Karyawan</TableCell>
                  <TableCell>Jam</TableCell>
                  <TableCell>SMU</TableCell>
                  <TableCell>Durasi</TableCell>
                  <TableCell align="right">Earning Kerja</TableCell>
                  <TableCell align="right">Earning OT</TableCell>
                  <TableCell align="right">Insentif Ages</TableCell>
                  <TableCell align="right">Insentif Tipes</TableCell>
                  <TableCell align="right">Insentif Tools</TableCell>
                  <TableCell align="center">Trip</TableCell>
                  <TableCell align="right">Grand Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => renderRow(row))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  );
};

export default TimesheetReconcil;
