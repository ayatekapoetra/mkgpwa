'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { Search, Add, Refresh } from '@mui/icons-material';
import { useGetBreakdownList } from 'api/breakdown';
import { usePublicCabang } from 'api/cabang';
import moment from 'moment';
import Link from 'next/link';

export default function BreakdownPage() {
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    search: '',
    cabang_id: '',
    status: '',
    kategori: ''
  });

  const { data, total, page, lastPage, perPage, dataLoading, mutate } = useGetBreakdownList(params);
  const { data: cabangList } = usePublicCabang();

  const handleChangePage = (event, newPage) => {
    setParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    setParams((prev) => ({ ...prev, perPage: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleSearch = (event) => {
    setParams((prev) => ({ ...prev, search: event.target.value, page: 1 }));
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      '0': { label: 'Open', color: 'warning' },
      '1': { label: 'In Progress', color: 'info' },
      '2': { label: 'Resolved', color: 'success' },
      '3': { label: 'Closed', color: 'default' }
    };
    return statusMap[status] || { label: 'Unknown', color: 'default' };
  };

  const getKategoriLabel = (kategori) => {
    const kategoriMap = {
      HE: 'Heavy Equipment',
      DT: 'Dump Truck'
    };
    return kategoriMap[kategori] || kategori;
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Daily Breakdown</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/breakdown/create">
          Add Breakdown
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search..."
                value={params.search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cabang</InputLabel>
                <Select
                  value={params.cabang_id}
                  label="Cabang"
                  onChange={(e) => setParams((prev) => ({ ...prev, cabang_id: e.target.value, page: 1 }))}
                >
                  <MenuItem value="">All Cabang</MenuItem>
                  {cabangList?.map((cabang) => (
                    <MenuItem key={cabang.id} value={cabang.id}>
                      [{cabang.kode}] {cabang.nama}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={params.kategori}
                  label="Kategori"
                  onChange={(e) => setParams((prev) => ({ ...prev, kategori: e.target.value, page: 1 }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="HE">Heavy Equipment</MenuItem>
                  <MenuItem value="DT">Dump Truck</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={params.status}
                  label="Status"
                  onChange={(e) => setParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="0">Open</MenuItem>
                  <MenuItem value="1">In Progress</MenuItem>
                  <MenuItem value="2">Resolved</MenuItem>
                  <MenuItem value="3">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button fullWidth variant="outlined" startIcon={<Refresh />} onClick={() => mutate()} sx={{ height: '56px' }}>
                Refresh
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kode</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Lokasi</TableCell>
                  <TableCell>Breakdown At</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.map((row) => {
                    const statusInfo = getStatusLabel(row.status);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {row.kode || `BD-${String(row.id).padStart(6, '0')}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.equipment?.kode || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.equipment?.nama}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.lokasi?.nama || '-'}</TableCell>
                        <TableCell>{row.breakdown_at ? moment(row.breakdown_at, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY HH:mm') : '-'}</TableCell>
                        <TableCell>
                          <Chip label={getKategoriLabel(row.kategori)} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={statusInfo.label} size="small" color={statusInfo.color} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.items?.length || 0} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" component={Link} href={`/breakdown/${row.id}`}>
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={perPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
