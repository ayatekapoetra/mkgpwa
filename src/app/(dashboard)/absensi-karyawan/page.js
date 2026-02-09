'use client';

import { useMemo } from 'react';
import MainCard from 'components/MainCard';
import { Card, CardContent, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const sampleData = [
  {
    periode: '2025-02',
    kode: 'EMP-001',
    nama: 'Budi Santoso',
    days: {
      1: 'H',
      2: 'H',
      3: 'I',
      4: 'H',
      5: 'H',
      6: 'H',
      7: 'L',
      8: 'H',
      9: 'H'
    }
  },
  {
    periode: '2025-02',
    kode: 'EMP-002',
    nama: 'Siti Rahma',
    days: {
      1: 'H',
      2: 'H',
      3: 'H',
      4: 'H',
      5: 'C',
      6: 'C',
      7: 'L'
    }
  },
  {
    periode: '2025-02',
    kode: 'EMP-003',
    nama: 'Andi Wijaya',
    days: {
      1: 'H',
      2: 'S',
      3: 'S',
      4: 'H',
      5: 'H'
    }
  }
];

const AbsensiKaryawanPage = () => {
  const dayColumns = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')), []);

  return (
    <MainCard title="Absensi Karyawan" content={false}>
      <Card elevation={0} sx={{ borderRadius: 0 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Tabel rekap kehadiran bulanan per karyawan (periode YYYY-MM) beserta status harian.
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 100 }}>Periode</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Kode Karyawan</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Nama Karyawan</TableCell>
                    {dayColumns.map((day) => (
                      <TableCell key={day} align="center" sx={{ minWidth: 48 }}>
                        {day}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.map((row) => (
                    <TableRow key={`${row.periode}-${row.kode}`} hover>
                      <TableCell>{row.periode}</TableCell>
                      <TableCell>{row.kode}</TableCell>
                      <TableCell>{row.nama}</TableCell>
                      {dayColumns.map((day) => (
                        <TableCell key={day} align="center">
                          {row.days[parseInt(day, 10)] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>
    </MainCard>
  );
};

export default AbsensiKaryawanPage;
