'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Filter, DocumentText, DocumentDownload, BoxRemove, TickSquare, Clock } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useGetGoodsIssues, useGetGoodsIssuesAccess, downloadGoodsIssueReport } from 'api/goods-issue';
import FilterGoodsIssues from './filter';

moment.locale('id');

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Goods Issues', to: '/goods-issues' }
];

const statusConfig = {
  DRAFT: { color: 'default', icon: <Clock size={16} /> },
  POSTED: { color: 'success', icon: <TickSquare size={16} /> },
  VOIDED: { color: 'error', icon: <BoxRemove size={16} /> }
};

const sourceLabels = {
  MANUAL: 'Manual',
  MATERIAL_REQUEST: 'Material Request',
  API: 'API'
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatCompact = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(amount);
};

function SummaryCard({ label, value, sublabel, icon, accent, loading }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: 'divider',
        bgcolor: (t) => alpha(accent || t.palette.primary.main, 0.03),
        backgroundImage: (t) => `linear-gradient(180deg, ${alpha(accent || t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.background.paper, 0)} 60%)`
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={18} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, color: accent || 'text.primary' }}>
                {value}
              </Typography>
            )}
            {sublabel ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {sublabel}
              </Typography>
            ) : null}
          </Box>
          {icon ? (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: accent,
                bgcolor: (t) => alpha(accent || t.palette.primary.main, 0.12)
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function GoodsIssuesScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 25,
    date_from: moment().startOf('month').format('YYYY-MM-DD'),
    date_to: moment().format('YYYY-MM-DD'),
    kode: '',
    penerima: '',
    narasi: '',
    status: '',
    bisnis_id: '',
    gudang_id: '',
    source_type: ''
  });
  const { permissions, loading: permLoading } = useGetGoodsIssuesAccess();
  const { rows, summary, total, page, perPage, lastPage, dataLoading, dataError, mutate } = useGetGoodsIssues(filters);
  const [openFilter, setOpenFilter] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('');

  const canInsert = permissions?.can_insert ?? false;

  const handleDownload = async (format) => {
    try {
      setDownloadFormat(format);
      const { blob, filename } = await downloadGoodsIssueReport(filters, format);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(`Laporan Goods Issues ${format.toUpperCase()} berhasil diunduh`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Gagal mengunduh laporan', { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Goods Issues" links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/goods-issues/create" disabled={!canInsert}>
            Buat Goods Issue
          </Button>
        }
        secondary={
          <Stack direction="row" gap={1}>
            <Tooltip title="Download PDF Report">
              <span>
                <IconButton aria-label="download-pdf" color="error" onClick={() => handleDownload('pdf')} disabled={Boolean(downloadFormat)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                  {downloadFormat === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <DocumentDownload />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download Excel Report">
              <span>
                <IconButton aria-label="download-excel" color="success" onClick={() => handleDownload('excel')} disabled={Boolean(downloadFormat)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                  {downloadFormat === 'excel' ? <CircularProgress size={20} color="inherit" /> : <DocumentText />}
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
        <FilterGoodsIssues count={total} data={filters} setData={setFilters} open={openFilter} onClose={() => setOpenFilter(false)} />

        <Box sx={{ p: 2.5, pb: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 1.5
            }}
          >
            <SummaryCard
              label="Total Document"
              value={total || 0}
              sublabel="Semua status"
              icon={<DocumentText size={20} variant="Bold" />}
              accent={theme.palette.primary.main}
              loading={dataLoading}
            />
            <SummaryCard
              label="Draft"
              value={summary?.draft || 0}
              sublabel="Menunggu posting"
              icon={<Clock size={20} variant="Bold" />}
              accent={theme.palette.grey[500]}
              loading={dataLoading}
            />
            <SummaryCard
              label="Posted"
              value={summary?.posted || 0}
              sublabel="Transaksi aktif"
              icon={<TickSquare size={20} variant="Bold" />}
              accent={theme.palette.success.main}
              loading={dataLoading}
            />
            <SummaryCard
              label="Total Posted Value"
              value={formatCompact(summary?.total_posted_value)}
              sublabel={formatCurrency(summary?.total_posted_value)}
              icon={<BoxRemove size={20} variant="Bold" />}
              accent={theme.palette.warning.main}
              loading={dataLoading}
            />
          </Box>
        </Box>

        {dataError ? (
          <Alert severity="warning" sx={{ m: 2.5 }}>
            Gagal memuat data Goods Issues.
          </Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack sx={{ p: 2.5 }}>
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
                    <TableCell align="center">No</TableCell>
                    <TableCell>Kode</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Bisnis</TableCell>
                    <TableCell>Gudang</TableCell>
                    <TableCell>Penerima</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">Tidak ada Goods Issues sesuai filter.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => {
                      const status = statusConfig[row.status] || statusConfig.DRAFT;
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell align="center">{(page - 1) * perPage + index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {row.kode || '-'}
                            </Typography>
                            {row.narasi ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {row.narasi}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>{row.trx_date ? moment(row.trx_date).format('DD-MM-YYYY') : '-'}</TableCell>
                          <TableCell>{row.bisnis_name || '-'}</TableCell>
                          <TableCell>{row.gudang_code ? `${row.gudang_code} - ${row.gudang_name || ''}` : '-'}</TableCell>
                          <TableCell>{row.penerima || '-'}</TableCell>
                          <TableCell>
                            {row.source_type ? (
                              <Chip size="small" label={sourceLabels[row.source_type] || row.source_type} variant="outlined" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="right">{row.item_count || 0}</TableCell>
                          <TableCell align="right">{formatCurrency(row.total_value)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.status || '-'}
                              color={status.color}
                              icon={status.icon}
                              sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button component={Link} href={`/goods-issues/${row.id}`} size="small" variant="outlined">
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
            <Paginate
              page={page}
              total={total}
              lastPage={lastPage}
              perPage={perPage}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}
