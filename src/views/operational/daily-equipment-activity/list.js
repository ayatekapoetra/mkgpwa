import React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  Chip,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import { Edit } from 'iconsax-react';
import Paginate from 'components/Paginate';
import moment from 'moment';

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
  const meta = data?.meta || data?.pagination || {};

  return (
    <Paper
      sx={{
        overflowX: "auto",
        width: "100%",
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Table
        sx={{
          tableLayout: "auto",
          minWidth: 1950,
        }}
        size="small"
      >
        <TableHead>
          <TableRow>
            <TableCell 
              align="center"
              sx={{ 
                minWidth: 80,
                position: "sticky",
                left: 0,
                backgroundColor: "background.paper",
                zIndex: 3,
                fontWeight: "bold",
              }}
            >
              Aksi
            </TableCell>
                <TableCell sx={{ minWidth: 120, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Tanggal
                </TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Equipment
                </TableCell>
                <TableCell sx={{ minWidth: 250, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Operator/Driver
                </TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Status
                </TableCell>
                <TableCell sx={{ minWidth: 250, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Lokasi
                </TableCell>
                <TableCell sx={{ minWidth: 250, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Lokasi Tujuan
                </TableCell>
                <TableCell sx={{ minWidth: 250, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Kegiatan
                </TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Material
                </TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: "bold", whiteSpace: 'nowrap' }}>
                  Cabang
                </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const statusColor = statusColors[row.status] || 'default';
            const shiftColor = shiftColors[row.shift] || 'default';

            return (
              <TableRow key={row.id} hover>
                <TableCell 
                  align="center"
                  sx={{ 
                    position: "sticky",
                    left: 0,
                    backgroundColor: "background.paper",
                    zIndex: 1,
                  }}
                >
                  <Tooltip title="Edit">
                    <IconButton 
                      color="primary" 
                      component={Link} 
                      href={`/daily-equipment-activity/${row.id}/show`}
                      size="small"
                    >
                      <Edit variant="Outline" size={18} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {moment(row.date_ops).format('DD-MM-YYYY')}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {row.equipment?.kode || `EQ-${row.equipment_id}`}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.karyawan?.nama || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Stack gap={1} direction="row">
                    <Chip 
                      label={row.shift || '-'} 
                      size="small" 
                      color={shiftColor} 
                      variant="outlined" 
                      sx={{ fontWeight: 700 }} 
                    />
                    <Chip
                      label={row.status || '-'}
                      size="small"
                      color={statusColor}
                      sx={{ fontWeight: 700 }}
                      variant="outlined"
                    />
                  </Stack>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">
                    {row.lokasi?.nama || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">
                    {row.lokasiTujuan?.nama || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">
                    {row.kegiatan?.nama || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">
                    {row.material?.nama || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">
                    {row.cabang?.nama || '-'}
                  </Typography>
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
        <TableFooter>
          <TableRow>
            <TableCell colSpan={11}>
              <Paginate
                page={meta?.page || meta?.currentPage || 1}
                total={meta?.total || meta?.pagination?.total || 0}
                lastPage={meta?.lastPage || meta?.pagination?.lastPage || 1}
                perPage={meta?.perPage || meta?.pagination?.perPage || 25}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
  );
}
