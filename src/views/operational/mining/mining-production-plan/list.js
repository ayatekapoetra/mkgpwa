'use client';

import Link from 'next/link';
import moment from 'moment'

import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper
} from '@mui/material';

const formatMt = (value) => {
  const num = Number(value || 0);
  return `${num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
};

export default function MiningProductionPlanList({ rows, onToggleActive }) {
  if (!rows || rows.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Belum ada data mining production plan sesuai filter.
        </Typography>
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">Aksi</TableCell>
            <TableCell>Periode</TableCell>
            <TableCell>Contractor</TableCell>
            <TableCell>IUP Owner</TableCell>
            <TableCell>Lokasi</TableCell>
            <TableCell>Material</TableCell>
            <TableCell align="right">Value Plan</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const aktif = String(row.aktif || 'Y') === 'Y';

            return (
              <TableRow key={row.id} hover>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" component={Link} href={`/mining-production-plan/${row.id}`}>
                      Edit
                    </Button>
                  </Stack>
                </TableCell>
                <TableCell>{moment(row.periode, 'YYYYMM').format('YYYY-MM') || '-'}</TableCell>
                <TableCell>{row.nmcontractor || '-'}</TableCell>
                <TableCell>{row.nmiupowner || '-'}</TableCell>
                <TableCell>{row.nmlokasi || '-'}</TableCell>
                <TableCell>{row.nmmaterial || '-'}</TableCell>
                <TableCell align="right">{formatMt(row.valueplan)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
