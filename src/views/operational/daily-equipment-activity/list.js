import React from 'react';
import Link from 'next/link';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper
} from '@mui/material';
import { Edit } from 'iconsax-react';
import Paginate from 'components/Paginate';

const statusColors = {
  BEROPERASI: 'success',
  STANDBY: 'info',
  'NO JOB': 'warning',
  'NO OPERATOR': 'secondary',
  'NO DRIVER': 'secondary',
  BREAKDOWN: 'error'
};

const shiftColors = {
  PAGI: 'primary',
  MALAM: 'secondary'
};

export default function ListActivity({ data, loading, error, params, setParams }) {
  const rows = data?.data || [];
  const meta = data?.meta || {};

  return (
    <Stack spacing={1.5}>
      {loading && <LinearProgress />}
      {error && <Typography color="error">Gagal memuat data</Typography>}

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Lokasi</TableCell>
              <TableCell>Lokasi Tujuan</TableCell>
              <TableCell>Kegiatan</TableCell>
              <TableCell>Operator/Driver</TableCell>
              <TableCell>Cabang</TableCell>
              <TableCell>Keterangan</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const statusColor = statusColors[row.status] || 'default';
              const shiftColor = shiftColors[row.shift] || 'default';

              return (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{row.date_ops}</TableCell>
                  <TableCell>
                    <Chip label={row.shift || '-'} size="small" color={shiftColor} variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.3}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {row.equipment?.kode || `EQ-${row.equipment_id}`}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Chip label={row.ctg || row.equipment?.kategori || '-'} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        <Chip
                          label={row.equipment?.model || row.equipment?.nama_unit || ''}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        />
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status || '-'}
                      size="small"
                      color={statusColor}
                      sx={{ fontWeight: 700, minWidth: 120 }}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.lokasi?.nama || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.lokasiTujuan?.nama || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.kegiatan?.nama || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.2}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.karyawan?.nama || '-'}
                      </Typography>
                      {row.karyawan?.section && (
                        <Typography variant="caption" color="text.secondary">
                          {row.karyawan.section}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.cabang?.nama || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                      {row.keterangan || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton color="primary" component={Link} href={`/daily-equipment-activity/${row.id}/show`}>
                        <Edit variant="Outline" size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada data
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paginate meta={meta} setParams={setParams} />
    </Stack>
  );
}
