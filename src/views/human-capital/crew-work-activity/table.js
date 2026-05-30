'use client';

import Link from 'next/link';
import moment from 'moment';
import {
  Box,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Calendar, Clock, Eye, Location, Profile2User, Timer1 } from 'iconsax-react';

const statusMap = {
  P: { label: 'Pending', color: 'warning' },
  A: { label: 'Approved', color: 'success' },
  R: { label: 'Rejected', color: 'error' }
};

const formatDate = (value) => (value ? moment(value).format('DD MMM YYYY') : '-');
const formatTime = (value) => (value ? String(value).slice(0, 5) : '-');
const formatHour = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
};

const getRelation = (row, key) => {
  const value = row?.[key];
  if (value?.nama) return value;
  if (value?.name) return { ...value, nama: value.name };
  return null;
};

export default function CrewWorkActivityTable({ rows = [], loading, error }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return <CrewWorkActivityMobileList rows={rows} loading={loading} error={error} />;
  }

  return <CrewWorkActivityDesktopTable rows={rows} loading={loading} error={error} />;
}

function CrewWorkActivityDesktopTable({ rows = [], loading, error }) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto', position: 'relative' }}>
      <Table
        size="small"
        stickyHeader
        sx={{
          '& td, & th': { border: '1px solid', borderColor: 'divider', verticalAlign: 'middle', whiteSpace: 'nowrap' },
          '& thead': { position: 'sticky', top: 0, zIndex: 3, backgroundColor: 'grey.100' },
          '& thead th': { backgroundColor: 'grey.400', fontWeight: 700, color: 'text.primary' }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ minWidth: 80 }}>Detail</TableCell>
            <TableCell sx={{ minWidth: 120 }}>Tanggal</TableCell>
            <TableCell sx={{ minWidth: 240 }}>Crew</TableCell>
            <TableCell sx={{ minWidth: 220 }}>Cabang / Area</TableCell>
            <TableCell sx={{ minWidth: 150 }}>Jam Kerja</TableCell>
            <TableCell sx={{ minWidth: 150 }}>Istirahat</TableCell>
            <TableCell align="right" sx={{ minWidth: 110 }}>Produktif</TableCell>
            <TableCell align="right" sx={{ minWidth: 100 }}>Lembur</TableCell>
            <TableCell sx={{ minWidth: 230 }}>Pengawas</TableCell>
            <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
            <TableCell sx={{ minWidth: 300, maxWidth: 360 }}>Keterangan</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const crew = getRelation(row, 'crew') || getRelation(row, 'karyawan');
            const supervisor = getRelation(row, 'supervisor');
            const cabang = getRelation(row, 'cabang');
            const status = statusMap[row.status] || { label: row.status || '-', color: 'default' };

            return (
              <TableRow key={row.id} hover>
                <TableCell align="center">
                  <IconButton size="small" color="primary" component={Link} href={`/crew-work-activity/${row.id}/show`}>
                    <Eye size={18} />
                  </IconButton>
                </TableCell>
                <TableCell>{formatDate(row.tanggal)}</TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>{crew?.nama || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{crew?.nik || crew?.section || '-'}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">{cabang?.nama || row.area || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{cabang?.kode || cabang?.area || row.area || '-'}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{formatTime(row.jam_mulai)} - {formatTime(row.jam_selesai)}</TableCell>
                <TableCell>{formatTime(row.istirahat_mulai)} - {formatTime(row.istirahat_selesai)}</TableCell>
                <TableCell align="right">{formatHour(row.jam_kerja_produktif)}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={Number(row.jam_lembur || 0) > 0 ? 'success.main' : 'text.primary'}
                    fontWeight={Number(row.jam_lembur || 0) > 0 ? 700 : 400}
                  >
                    {formatHour(row.jam_lembur)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">{supervisor?.nama || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{supervisor?.nik || supervisor?.section || '-'}</Typography>
                  </Stack>
                </TableCell>
                <TableCell><Chip label={status.label} color={status.color} size="small" variant="light" /></TableCell>
                <TableCell sx={{ maxWidth: 360 }}>
                  <Typography
                    variant="body2"
                    title={row.keterangan || '-'}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 340 }}
                  >
                    {row.keterangan || '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
          {!loading && !error && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} align="center">
                <Typography variant="body2">Tidak ada data</Typography>
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={11} align="center">
                <Typography variant="body2">Memuat data...</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CrewWorkActivityMobileList({ rows = [], loading, error }) {
  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" align="center">Memuat data...</Typography>
      </Box>
    );
  }

  if (!error && rows.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" align="center">Tidak ada data</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {rows.map((row) => {
        const crew = getRelation(row, 'crew') || getRelation(row, 'karyawan');
        const supervisor = getRelation(row, 'supervisor');
        const cabang = getRelation(row, 'cabang');
        const status = statusMap[row.status] || { label: row.status || '-', color: 'default' };
        const isOvertime = Number(row.jam_lembur || 0) > 0;

        return (
          <Card
            key={row.id}
            variant="outlined"
            sx={{ borderRadius: 2.5, overflow: 'hidden', boxShadow: 1, '&:hover': { boxShadow: 3 } }}
          >
            <Box
              sx={{
                p: 2,
                color: 'common.white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                <Stack spacing={0.5} minWidth={0}>
                  <Typography variant="h6" fontWeight={800} noWrap>{crew?.nama || '-'}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                    <Calendar size={14} />
                    <Typography variant="caption" sx={{ opacity: 0.95 }}>{formatDate(row.tanggal)}</Typography>
                  </Stack>
                </Stack>
                <IconButton
                  size="small"
                  component={Link}
                  href={`/crew-work-activity/${row.id}/show`}
                  sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.18)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
                >
                  <Eye size={18} />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ p: 2 }}>
              <Stack spacing={1.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Chip label={status.label} color={status.color} size="small" variant="light" />
                  <Typography variant="caption" color="text.secondary">ID #{row.id}</Typography>
                </Stack>

                <InfoLine icon={Profile2User} label="Crew" value={crew?.nik || crew?.section || '-'} />
                <InfoLine icon={Location} label="Cabang / Area" value={cabang?.nama || row.area || '-'} subValue={cabang?.kode || cabang?.area || row.area || '-'} />

                <Divider />

                <Box>
                  <Grid container spacing={1.25}>
                    <MetricTile icon={Clock} label="Jam Kerja" value={`${formatTime(row.jam_mulai)} - ${formatTime(row.jam_selesai)}`} />
                    <MetricTile icon={Timer1} label="Istirahat" value={`${formatTime(row.istirahat_mulai)} - ${formatTime(row.istirahat_selesai)}`} />
                    <MetricTile icon={Timer1} label="Produktif" value={`${formatHour(row.jam_kerja_produktif)} jam`} />
                    <MetricTile icon={Timer1} label="Lembur" value={`${formatHour(row.jam_lembur)} jam`} color={isOvertime ? 'success.main' : 'text.primary'} />
                  </Grid>
                </Box>

                <Divider />

                <InfoLine icon={Profile2User} label="Pengawas" value={supervisor?.nama || '-'} subValue={supervisor?.nik || supervisor?.section || '-'} />

                <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">Keterangan</Typography>
                  <Typography
                    variant="body2"
                    title={row.keterangan || '-'}
                    sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {row.keterangan || '-'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );
}

function InfoLine({ icon: Icon, label, value, subValue }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: 'primary.lighter', color: 'primary.dark', flexShrink: 0 }}>
        <Icon size={18} />
      </Box>
      <Stack spacing={0.15} minWidth={0}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={700} noWrap>{value}</Typography>
        {subValue ? <Typography variant="caption" color="text.secondary" noWrap>{subValue}</Typography> : null}
      </Stack>
    </Stack>
  );
}

function MetricTile({ icon: Icon, label, value, color = 'text.primary' }) {
  return (
    <Grid item xs={6}>
      <Box sx={{ p: 1.15, height: '100%', borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={0.75} alignItems="center" color="primary.main">
          <Icon size={16} />
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Stack>
        <Typography variant="body2" fontWeight={800} color={color} sx={{ mt: 0.5 }}>{value}</Typography>
      </Box>
    </Grid>
  );
}
