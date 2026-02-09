'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import MainCard from 'components/MainCard';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Box,
  Chip
} from '@mui/material';
import { Calendar } from 'iconsax-react';
import { useMonthlyAttendance } from 'api/absensi';

const AbsensiKaryawanPage = () => {
  const defaultPeriode = dayjs().format('YYYY-MM');
  const [filters, setFilters] = useState({ periode: defaultPeriode });

  const { attendance, attendanceLoading, attendanceError, total } = useMonthlyAttendance(filters);

  const dayColumns = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')), []);

  const handlePeriodeChange = (e) => {
    setFilters((prev) => ({ ...prev, periode: e.target.value }));
  };

  return (
    <MainCard title="Absensi Karyawan" content={false}>
      <Card elevation={0} sx={{ borderRadius: 0 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Rekap kehadiran bulanan per karyawan (periode YYYY-MM) beserta status harian.
              </Typography>
              <TextField
                type="month"
                label="Periode"
                size="small"
                value={filters.periode}
                onChange={handlePeriodeChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label={`Total data: ${total || 0}`} size="small" />
              {attendanceLoading ? <Chip label="Loading..." size="small" color="info" /> : null}
              {attendanceError ? <Chip label="Error memuat data" size="small" color="error" /> : null}
            </Stack>

            <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 100 }}>Periode</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Kode Karyawan</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Nama Karyawan</TableCell>
                    {dayColumns.map((day) => (
                      <TableCell key={day} align="center" sx={{ minWidth: 42 }}>
                        {day}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((row) => (
                    <TableRow key={`${row.periode}-${row.nik || row.ktp || row.id}`} hover>
                      <TableCell>{row.periode}</TableCell>
                      <TableCell>{row.nik || row.ktp || '-'}</TableCell>
                      <TableCell>{row.nama || '-'}</TableCell>
                      {dayColumns.map((day) => (
                        <TableCell key={day} align="center">
                          <Box component="span" sx={{ fontWeight: 600 }}>{row.days[parseInt(day, 10)] || ''}</Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {!attendanceLoading && !attendanceError && attendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={34} align="center">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
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
