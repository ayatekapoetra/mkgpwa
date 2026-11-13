'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// MATERIAL - UI
import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Filter, Add, DocumentUpload, Eye, Edit } from 'iconsax-react';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import Paginate from 'components/Paginate';
import { APP_DEFAULT_PATH } from 'config';

import RekapRitaseFilter from './filter';
import { useGetRekapRitase, useRitaseRekapAccess } from 'api/ritase-rekap';
import moment from 'moment';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Operational Mining', to: '/rekap-ritase' },
  { title: 'Rekap Ritase', to: '/rekap-ritase' }
];

const formatNum = (v, digits = 2) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export default function RekapRitaseScreen() {
  const router = useRouter();
  const [openFilter, setOpenFilter] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    bisnis_id: '',
    cabang_id: '',
    penyewa_id: '',
    shift_id: '',
    start_date: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    end_date: moment().format('YYYY-MM-DD')
  });

  const { permissions } = useRitaseRekapAccess();
  const { rows, page, perPage, total, lastPage, loading, error, refresh } = useGetRekapRitase(params);

  const buildGroupQuery = (row) => {
    const q = new URLSearchParams();
    q.set('date_ops', row.date_ops || '');
    q.set('shift_id', row.shift_id ?? '');
    q.set('excavator_id', row.excavator_id ?? '');
    q.set('startpit_id', row.startpit_id ?? '');
    q.set('material_id', row.material_id ?? '');
    if (row.bisnis_id != null) q.set('bisnis_id', row.bisnis_id);
    if (row.penyewa_id != null) q.set('penyewa_id', row.penyewa_id);
    if (row.fleet_name) q.set('fleet_name', row.fleet_name);
    return q.toString();
  };

  const handleOpenEdit = (row) => {
    router.push(`/rekap-ritase/edit?${buildGroupQuery(row)}`);
  };

  const handleOpenDetail = (row) => {
    // Detail sekarang berupa halaman penuh, bukan dialog, agar visualisasi
    // (KPI, grafik, tabel alokasi) punya ruang lebih luas.
    router.push(`/rekap-ritase/detail?${buildGroupQuery(row)}`);
  };

  const handleResetFilter = () => {
    setParams({
      page: 1,
      perPage: 25,
      bisnis_id: '',
      cabang_id: '',
      penyewa_id: '',
      shift_id: '',
      start_date: moment().subtract(7, 'days').format('YYYY-MM-DD'),
      end_date: moment().format('YYYY-MM-DD')
    });
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Rekap Ritase PIT & Stockpile" links={breadcrumbLinks} />

      <MainCard
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4" fontWeight={700}>
              Daftar Rekap Ritase
            </Typography>
            <Chip size="small" label={`Total: ${total} grup`} color="default" />
          </Stack>
        }
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            {permissions?.can_create && (
              <>
                <Link href="/rekap-ritase/create" passHref style={{ textDecoration: 'none' }}>
                  <Button variant="contained" color="primary" startIcon={<Add />} size="small">
                    Tambah Rekap
                  </Button>
                </Link>
                <Link href="/rekap-ritase/import" passHref style={{ textDecoration: 'none' }}>
                  <Button variant="outlined" color="primary" startIcon={<DocumentUpload />} size="small">
                    Import Excel
                  </Button>
                </Link>
              </>
            )}
            <IconButton
              color="primary"
              variant="outlined"
              onClick={() => setOpenFilter(true)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <Filter size={18} />
            </IconButton>
          </Stack>
        }
        content={false}
      >
        <RekapRitaseFilter
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          params={params}
          setParams={setParams}
          onReset={handleResetFilter}
        />

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error.message || 'Gagal memuat data rekap ritase'}</Alert>
          </Box>
        )}

        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            overflowX: 'auto',
            border: 'none',
            borderRadius: 0,
            minHeight: 280
          }}
        >
          <Table sx={{ minWidth: 960 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Tanggal</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unit / IUP</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fleet / Loader</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PIT Asal</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>DT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Ritase</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tonase</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>BCM</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sumber</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      Memuat data rekap ritase...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      Tidak ada data rekap ritase untuk filter yang dipilih.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.group_key || index} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {row.date_ops ? moment(row.date_ops).format('DD/MM/YYYY') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.shift_nama || `Shift ${row.shift_id}`}
                        variant="outlined"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.bisnis_initial || row.bisnis_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.penyewa_abbr || row.penyewa_id || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.fleet_name || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.excavator_kode || `EXC #${row.excavator_id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.startpit_nama || row.startpit_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.material_nama || row.material_id}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {row.total_dumptruck || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {row.total_ritase || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatNum(row.total_ton)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatNum(row.total_bcm)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(row.input_sources || []).map((src, sIdx) => (
                          <Chip
                            key={sIdx}
                            size="small"
                            label={src === 'EXCEL_IMPORT' ? 'Excel' : src === 'WEB_FORM' ? 'Web' : src}
                            color={src === 'EXCEL_IMPORT' ? 'success' : 'primary'}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDetail(row)} title="Buka halaman detail">
                          <Eye size={18} />
                        </IconButton>
                        {permissions?.can_create && (
                          <IconButton size="small" color="warning" onClick={() => handleOpenEdit(row)} title="Ubah rekap ritase">
                            <Edit size={18} />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Paginate
            page={page}
            total={total}
            lastPage={lastPage}
            perPage={perPage}
            onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          />
        </Box>
      </MainCard>
    </Fragment>
  );
}
