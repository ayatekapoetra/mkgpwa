"use client";

import moment from 'moment';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  });
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatDate = (value) => (value ? moment(value).format('dddd, DD MMM YYYY') : '-');
const formatTime = (value) => (value ? moment(value).format('HH:mm') : '-');

// Mock detail data (from sample)
const mockRow = {
  id: 26040402832,
  kode: 'Timesheet #26033102083',
  date_ops: '2026-03-30T16:00:00.000Z',
  nmkaryawan: 'Albar',
  karyawan_id: '7409070610980001',
  starttime: '2026-03-31T06:00:00.000Z',
  endtime: '2026-03-31T17:00:00.000Z',
  totworktime: '11.00',
  totresttime: '1.00',
  totovertime: '0.00',
  totworkhours_earning: '220000',
  totinsentifages_earning: '0',
  totinsentiftipes_earning: '0',
  totinsentiftools_earning: '0',
  totritasetrip: 0,
  grandtotal_earning: '220000',
  narasi: '',
  iserr: 'A',
  errmsg: 'material_id wajib di isi kecuali standby/breakdown atau kegiatan mobilisasi',
  items: [
    {
      id: 1,
      kdequipment: 'M63',
      nmkegiatan: 'TUNGGU ARAHAN',
      kategori: 'RENTAL',
      starttime: '2026-03-31T06:00:00.000Z',
      endtime: '2026-03-31T09:00:00.000Z',
      startlokasi: '[Tapunopaka] Pit Asaki',
      endlokasi: '',
      workhours: '3.00',
      resthours: '0.00',
      overtime: '0.00',
      totritasetrip: 0,
      bonusritase: 0,
      inswork: '60000',
      insritase: '0',
      totalearning: '60000',
    },
    {
      id: 2,
      kdequipment: 'M63',
      nmkegiatan: 'GETTING',
      kategori: 'RENTAL',
      starttime: '2026-03-31T09:00:00.000Z',
      endtime: '2026-03-31T18:00:00.000Z',
      startlokasi: '[Tapunopaka] Pit Asaki',
      endlokasi: '',
      workhours: '8.00',
      resthours: '1.00',
      overtime: '0.00',
      totritasetrip: 0,
      bonusritase: 0,
      inswork: '160000',
      insritase: '0',
      totalearning: '160000',
    },
  ],
};

const cardStyle = {
  p: 2,
  borderRadius: 2,
  bgcolor: '#f8fbff',
  border: '1px solid #e6eef8',
};

const TimesheetReconcilShow = ({ data = mockRow }) => {
  const row = data || mockRow;

  const totals = {
    work: row.totworktime,
    rest: row.totresttime,
    overtime: row.totovertime,
    earningWork: row.totworkhours_earning,
    earningOT: row.totovertime_earning,
    earningAges: row.totinsentifages_earning,
    earningTipes: row.totinsentiftipes_earning,
    earningTools: row.totinsentiftools_earning,
    grand: row.grandtotal_earning,
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e6eef8', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">{moment(row.date_ops).format('dddd')}</Typography>
              <Typography variant="h3" fontWeight={800}>{moment(row.date_ops).format('MMM DD')}</Typography>
              <Typography variant="body2" color="text.secondary">{moment(row.date_ops).format('YYYY')}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>{row.kode || `Timesheet #${row.id}`}</Typography>
              <Typography variant="body1" fontWeight={700}>{row.nmkaryawan}</Typography>
              <Typography variant="body2" color="text.secondary">{row.karyawan_id}</Typography>
              <Typography variant="body2" color="text.secondary">MTK TAPUNOPAKA</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3} textAlign={{ xs: 'left', md: 'right' }}>
            <Typography variant="caption" color="text.secondary">Potensi Pendapatan</Typography>
            <Typography variant="h5" fontWeight={800}>{formatCurrency(totals.grand)}</Typography>
            <Typography variant="caption" color="text.secondary">{formatCurrency(20000)}/ Jam</Typography>
          </Grid>
        </Grid>
      </Paper>

      {row.errmsg && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {row.errmsg}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e6eef8', borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={800}>Ringkasan Earning</Typography>
          <Typography variant="caption" color="text.secondary">
            Total jam: {totals.work} • Istirahat: {totals.rest}
          </Typography>
        </Stack>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Jam Kerja</Typography>
              <Typography variant="body1" fontWeight={800}>{formatNumber(totals.work, 2)} jam</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Istirahat</Typography>
              <Typography variant="body1" fontWeight={800}>{formatNumber(totals.rest, 2)} jam</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Overtime</Typography>
              <Typography variant="body1" fontWeight={800}>{formatNumber(totals.overtime, 2)} jam</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Earning Work</Typography>
              <Typography variant="body1" fontWeight={800}>{formatCurrency(totals.earningWork)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Earning Ritase</Typography>
              <Typography variant="body1" fontWeight={800}>{formatCurrency(0)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Earning OT</Typography>
              <Typography variant="body1" fontWeight={800}>{formatCurrency(totals.earningOT)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Earning Ages</Typography>
              <Typography variant="body1" fontWeight={800}>{formatCurrency(totals.earningAges)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={cardStyle}>
              <Typography variant="caption" color="text.secondary">Earning Tools</Typography>
              <Typography variant="body1" fontWeight={800}>{formatCurrency(totals.earningTools)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e6eef8', borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={800}>Rincian Item</Typography>
        </Stack>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Kegiatan</TableCell>
                <TableCell>Waktu Start</TableCell>
                <TableCell>Waktu Finish</TableCell>
                <TableCell>Lokasi Start</TableCell>
                <TableCell>Lokasi Finish</TableCell>
                <TableCell align="right">Durasi</TableCell>
                <TableCell align="right">Rest</TableCell>
                <TableCell align="right">Lembur</TableCell>
                <TableCell align="right">Trip Rit</TableCell>
                <TableCell align="right">Ins.Ritase</TableCell>
                <TableCell align="right">Ins.Work</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.items?.map((item, idx) => (
                <TableRow key={item.id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Stack spacing={0.3}>
                      <Typography fontWeight={700}>{item.kdequipment}</Typography>
                      <Chip label="shift pagi" size="small" variant="outlined" />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.kategori}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.nmkegiatan}</Typography>
                  </TableCell>
                  <TableCell>{`${formatDate(item.starttime)} ${formatTime(item.starttime)}`}</TableCell>
                  <TableCell>{`${formatDate(item.endtime)} ${formatTime(item.endtime)}`}</TableCell>
                  <TableCell>{item.startlokasi || '-'}</TableCell>
                  <TableCell>{item.endlokasi || '-'}</TableCell>
                  <TableCell align="right">{formatNumber(item.workhours, 2)}</TableCell>
                  <TableCell align="right">{formatNumber(item.resthours, 2)}</TableCell>
                  <TableCell align="right">{formatNumber(item.overtime, 2)}</TableCell>
                  <TableCell align="right">{item.totritasetrip}</TableCell>
                  <TableCell align="right">{formatCurrency(item.insritase)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.inswork)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={8} align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totworktime, 2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totresttime, 2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totovertime, 2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{row.totritasetrip}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(0)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(row.grandtotal_earning)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
};

export default TimesheetReconcilShow;
