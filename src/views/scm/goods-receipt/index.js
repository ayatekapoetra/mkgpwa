'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import { Eye, Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

import { useGetGoodsReceipt } from 'api/goods-receipt';
import ListGoodsReceipt from './list';
import FilterGoodsReceipt from './filter';
import axiosServices from 'utils/axios';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Terima Barang', to: '/goods-receipt' }
];

export default function GoodsReceiptScreen() {
  const columns = DataColumn();
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 25,
    kodeReceipt: '',
    kodeSj: '',
    narasi: '',
    startDate: '',
    endDate: '',
    gudangId: ''
  });
  const { data, dataLoading, dataError } = useGetGoodsReceipt(filters);
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
      const endpoint = format === 'pdf' ? `/scm/terima-barang/download-pdf?${query}` : `/scm/terima-barang/download-excel?${query}`;
      const response = await axiosServices.get(endpoint, { responseType: 'blob', skipOfflineQueue: true });
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `goods-receipt.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveBlob({ blob, filename });
      enqueueSnackbar(`Goods Receipt ${format.toUpperCase()} berhasil di-download`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Gagal download dokumen', { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Terima Barang'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/goods-receipt/create">
            Buat Penerimaan
          </Button>
        }
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
              <IconButton color="secondary" onClick={() => setOpenFilter((prev) => !prev)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                <Filter />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        content={false}
      >
        <FilterGoodsReceipt count={data?.total} data={filters} setData={setFilters} open={openFilter} onClose={() => setOpenFilter(false)} />
        {dataError ? (
          <Alert severity="warning" sx={{ m: 2 }}>Gagal memuat data terima barang.</Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : (
          <Stack>
            <ListGoodsReceipt
              columns={columns}
              data={data?.data || []}
              paginate={
                <Paginate
                  page={data?.page || filters.page}
                  total={data?.total || 0}
                  lastPage={data?.lastPage || 1}
                  perPage={data?.perPage || filters.perPage}
                  onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                />
              }
            />
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}

function DataColumn() {
  return useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center', maxWidth: 5 }}>ACT</div>,
        accessor: 'index',
        width: 60,
        disableSortBy: true,
        disableFilters: true,
        Cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Box sx={{ width: 30, textAlign: 'center' }}>
              <IconButton component={Link} href={`/goods-receipt/${id}/show`} variant="dashed" color="primary">
                <Eye />
              </IconButton>
            </Box>
          );
        }
      },
      {
        Header: 'Kode Receipt',
        accessor: 'reff_rcp',
        minWidth: 140,
        Cell: ({ row }) => (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={700}>{row.original.reff_rcp}</Typography>
            <Typography variant="caption" color="text.secondary">{row.original.receivedDateLabel}</Typography>
          </Stack>
        )
      },
      {
        Header: 'Surat Jalan',
        accessor: 'kode_sj',
        minWidth: 140,
        Cell: ({ row }) => <Typography variant="body2">{row.original.kode_sj || '-'}</Typography>
      },
      {
        Header: 'Gudang',
        accessor: 'gudang.nama',
        minWidth: 220,
        Cell: ({ row }) => (
          <Typography variant="body2">{row.original.gudang?.nama || row.original.gudang_id || '-'}</Typography>
        )
      },
      {
        Header: 'Narasi',
        accessor: 'narasi',
        minWidth: 280,
        Cell: ({ row }) => <Typography variant="body2">{row.original.narasi || '-'}</Typography>
      },
      {
        Header: 'Items',
        accessor: 'itemCount',
        minWidth: 100,
        Cell: ({ row }) => <Typography variant="body2">{row.original.itemCount || 0}</Typography>
      }
    ],
    []
  );
}
