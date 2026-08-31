'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { Filter } from 'iconsax-react';
import Tooltip from '@mui/material/Tooltip';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useGetWarehouseTransfers } from 'api/warehouse-transfer';
import FilterWarehouseTransfers from './filter';
import axiosServices from 'utils/axios';

moment.locale('id');

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Warehouse Transfer', to: '/warehouse/transfers' }
];

const statusColor = {
  draft: 'default',
  delivering: 'warning',
  partially_received: 'info',
  received: 'success',
  cancelled: 'error'
};

export default function WarehouseTransferScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState({ page: 1, limit: 20, kode: '', narasi: '', status: '', gudang_src: '', gudang_target: '' });
  const { data, dataLoading, dataError } = useGetWarehouseTransfers(filters);
  const [openFilter, setOpenFilter] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('');

  const saveBlob = ({ blob, filename }) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (format) => {
    try {
      setDownloadFormat(format);
      const query = new URLSearchParams(filters).toString();
      const endpoint = format === 'pdf' ? `/warehouse/transfers/download-pdf?${query}` : `/warehouse/transfers/download-excel?${query}`;
      const response = await axiosServices.get(endpoint, { responseType: 'blob', skipOfflineQueue: true });
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `warehouse-transfers.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveBlob({ blob, filename });
      enqueueSnackbar(`Warehouse Transfer ${format.toUpperCase()} berhasil di-download`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Gagal download dokumen', { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Warehouse Transfer'} links={breadcrumbLinks} />
      <MainCard
        title={<Button variant="contained" component={Link} href="/warehouse/transfers/create">Buat Transfer</Button>}
        secondary={
          <Stack direction="row" gap={1}>
            <Tooltip title="Download PDF">
              <span>
                <IconButton aria-label="download-pdf" color="error" onClick={() => handleDownload('pdf')} disabled={Boolean(downloadFormat)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                  {downloadFormat === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download Excel">
              <span>
                <IconButton aria-label="download-excel" color="success" onClick={() => handleDownload('excel')} disabled={Boolean(downloadFormat)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                  {downloadFormat === 'excel' ? <CircularProgress size={20} color="inherit" /> : <DescriptionOutlinedIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Filter">
              <IconButton color="secondary" onClick={() => setOpenFilter((prev) => !prev)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}><Filter /></IconButton>
            </Tooltip>
          </Stack>
        }
        content={false}
      >
        <FilterWarehouseTransfers count={data?.meta?.total} data={filters} setData={setFilters} open={openFilter} onClose={() => setOpenFilter(false)} />
        {dataError ? (
          <Alert severity="warning" sx={{ m: 2 }}>Gagal memuat data transfer.</Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : (
          <Stack>
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999 }
              }}
            >
              <Table
                sx={{
                  minWidth: 1100,
                  tableLayout: 'auto',
                  '& .MuiTableCell-root': { whiteSpace: 'nowrap', verticalAlign: 'top' }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Aksi</TableCell>
                    <TableCell>Kode</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Gudang Sumber</TableCell>
                    <TableCell>Gudang Tujuan</TableCell>
                    <TableCell align="right">Qty Pakai</TableCell>
                    <TableCell align="right">Qty Order</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.items || []).map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell align="right"><Button component={Link} href={`/warehouse/transfers/${row.id}`} size="small">Detail</Button></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{row.kode}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.narasi || '-'}</Typography>
                      </TableCell>
                      <TableCell>{row.trx_date ? moment(row.trx_date).format('DD-MM-YYYY') : '-'}</TableCell>
                      <TableCell>{row.gudang_src ? `${row.gudang_src.kode} - ${row.gudang_src.nama}` : '-'}</TableCell>
                      <TableCell>{row.gudang_target ? `${row.gudang_target.kode} - ${row.gudang_target.nama}` : '-'}</TableCell>
                      <TableCell align="right">{row.summary?.total_qty_pakai || 0}</TableCell>
                      <TableCell align="right">{row.summary?.total_qty_order || 0}</TableCell>
                      <TableCell align="right">{row.summary?.progress_percent || 0}%</TableCell>
                      <TableCell><Chip size="small" label={String(row.status || '-').replaceAll('_', ' ')} color={statusColor[row.status] || 'default'} sx={{ textTransform: 'capitalize' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Paginate
              page={data?.meta?.page || filters.page}
              total={data?.meta?.total || 0}
              lastPage={data?.meta?.last_page || 1}
              perPage={data?.meta?.limit || filters.limit}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}
