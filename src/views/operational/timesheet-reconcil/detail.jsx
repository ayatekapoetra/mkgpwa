"use client";

import moment from 'moment';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTimesheetReconcilDetail } from 'api/timesheet-reconcil';
import {
  Alert,
  Box,
  Chip,
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
import MainCard from 'components/MainCard';
import BtnBack from 'components/BtnBack';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

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

const formatDate = (value) => (value ? moment(value).format('DD-MM-YYYY') : '-');
const formatTime = (value) => (value ? moment(value).format('HH:mm') : '-');

const cardStyle = {
  p: 2,
  borderRadius: 2,
  bgcolor: '#f8fbff',
  border: '1px solid #e6eef8',
};

const TimesheetReconcilShow = ({ params }) => {
  const { id: routeId } = useParams();
  const id = params?.id || routeId;
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await getTimesheetReconcilDetail(id);
        console.log('RES-------------------------', res);
        
        if (res?.diagnostic?.error) {
          setError(res.diagnostic.error);
          setRow(null);
        } else {
          setRow(res?.rows || res?.data || res);
        }
      } catch (err) {
        setError(err?.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const normalized = row || {};
  const totals = {
    work: normalized.totworktime,
    rest: normalized.totresttime,
    overtime: normalized.totovertime,
    earningWork: normalized.totworkhours_earning,
    earningOT: normalized.totovertime_earning,
    earningAges: normalized.totinsentifages_earning,
    earningTipes: normalized.totinsentiftipes_earning,
    earningTools: normalized.totinsentiftools_earning,
    grand: normalized.grandtotal_earning,
  };

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Timesheet-Reconcil', to: '/timesheet-reconcil' },
    { title: 'Show', to: `/timesheet-reconcil/${id || ''}` },
  ];

  if (loading) {
    return (
      <MainCard title={<BtnBack href={'/timesheet'} />} content>
        <Typography>Loading...</Typography>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title={<BtnBack href={'/timesheet'} />} content>
        <Alert severity="error">{error}</Alert>
      </MainCard>
    );
  }

  if (!row) {
    return (
      <MainCard title={<BtnBack href={'/timesheet'} />} content>
        <Alert severity="info">Data tidak tersedia</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={<BtnBack href={'/timesheet-reconcil'} />}
      content
      secondary={<Breadcrumbs custom heading={'Detail Reconcil Timesheet'} links={breadcrumbLinks} />}
    >
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
              <Typography variant="body1" fontWeight={700}>{row.nmkaryawan}</Typography>
              <Typography variant="body2" color="text.secondary">{row.karyawan_id}</Typography>
              <Typography variant="body2" color="text.secondary">MTK TAPUNOPAKA</Typography>
              <Typography variant="subtitle">{row.kode || `Timesheet #${row.id}`}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3} textAlign={{ xs: 'left', md: 'right' }}>
            <Typography variant="caption" color="text.secondary">Potensi Pendapatan</Typography>
            <Typography variant="h5" fontWeight={800}>Rp. -</Typography>
            {/* <Typography variant="h5" fontWeight={800}>{formatCurrency(totals.grand)}</Typography> */}
            <Typography variant="caption" color="text.secondary">{formatCurrency(20000)}/ Jam</Typography>
          </Grid>
        </Grid>
      </Paper>

      {row.errmsg && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {row.errmsg}
        </Alert>
      )}

      {/* <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: (theme) => theme.palette.divider,
          background: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fbff'),
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={800}>Ringkasan Earning</Typography>
          <Typography variant="caption" color="text.secondary">
            Total jam: {totals.work} • Istirahat: {totals.rest}
          </Typography>
        </Stack>
        <Grid container spacing={1.5}>
          {[{ label: 'Jam Kerja', value: `${formatNumber(totals.work, 2)} jam` },
            { label: 'Istirahat', value: `${formatNumber(totals.rest, 2)} jam` },
            { label: 'Overtime', value: `${formatNumber(totals.overtime, 2)} jam` },
            { label: 'Earning Work', value: formatCurrency(totals.earningWork) },
            { label: 'Earning Ritase', value: formatCurrency(0) },
            { label: 'Earning OT', value: formatCurrency(totals.earningOT) },
            { label: 'Earning Ages', value: formatCurrency(totals.earningAges) },
            { label: 'Earning Tools', value: formatCurrency(totals.earningTools) }
          ].map((card, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.05)' : '#eef5ff'),
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.15)' : '#dbeafe'),
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                  minHeight: 90,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {card.label}
                </Typography>
                <Typography variant="body1" fontWeight={800}>{card.value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper> */}

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
                {/* <TableCell align="right">Ins.Ritase</TableCell>
                <TableCell align="right">Ins.Work</TableCell> */}
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
                    <Typography variant="body2">{item.mainact}</Typography>
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
                  {/* <TableCell align="right">{formatCurrency(item.insritase)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.inswork)}</TableCell> */}
                </TableRow>
              ))}
              {/* <TableRow>
                <TableCell colSpan={8} align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totworktime, 2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totresttime, 2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totovertime, 2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{row.totritasetrip}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(0)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(row.grandtotal_earning)}</TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
    </MainCard>
  );
};

export default TimesheetReconcilShow;
