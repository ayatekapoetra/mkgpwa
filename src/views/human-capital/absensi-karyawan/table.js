'use client';

import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';

const dayColumns = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function AbsensiTable({ rows = [], loading, error }) {
  const data = useMemo(() => rows || [], [rows]);

  return (
    <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto', position: 'relative' }}>
      <Table
        size="small"
        stickyHeader
        sx={{
          '& td, & th': { border: '1px solid', borderColor: 'divider' },
          '& thead': { position: 'sticky', top: 0, zIndex: 3, backgroundColor: 'grey.100' },
          '& thead th': { backgroundColor: 'grey.400', fontWeight: 700, color: 'text.primary' }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 100 }}>Periode</TableCell>
            <TableCell sx={{ minWidth: 120 }}>Kode</TableCell>
            <TableCell sx={{ minWidth: 260 }}>Nama Karyawan</TableCell>
            {dayColumns.map((day) => (
              <TableCell key={day} align="center" sx={{ minWidth: 42 }}>
                {day}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={`${row.periode}-${row.nik || row.ktp || row.id}`} hover>
              <TableCell>{row.periode}</TableCell>
              <TableCell>{row.nik || row.ktp || '-'}</TableCell>
              <TableCell>{row.nama || '-'}</TableCell>
              {dayColumns.map((day) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    backgroundColor: row.days[parseInt(day, 10)] === 'L' ? 'error.light' : 'inherit',
                    color: row.days[parseInt(day, 10)] === 'L' ? 'error.contrastText' : 'inherit'
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 600 }}>{row.days[parseInt(day, 10)] || ''}</Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
          {!loading && !error && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={34} align="center">
                <Typography variant="body2">Tidak ada data</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
