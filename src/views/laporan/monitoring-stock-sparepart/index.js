'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DocumentDownload, DocumentText, Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import { downloadMonitoringStock, useMonitoringStock, useMonitoringStockAccess } from 'api/monitoring-stock-sparepart';
import MonitoringStockDetail from './detail';
import MonitoringStockFilter from './filter';
import MonitoringStockList, { formatMoney } from './list';

const defaults = () => ({
  bisnis_id: '',
  gudang_id: '',
  rack_ids: [],
  kategori_id: '',
  item_search: '',
  stock_status: [],
  include_zero: true,
  include_inactive_master: true,
  page: 1,
  perPage: 25
});
const cloneParams = (params) => ({ ...params, rack_ids: [...params.rack_ids], stock_status: [...params.stock_status] });
const errorMessage = (error, fallback = 'Gagal memuat laporan Monitoring Stock Sparepart.') =>
  error?.response?.data?.diagnostic?.message || error?.diagnostic?.message || error?.message || fallback;

const saveBlob = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
};

function SummaryCard({ label, value, color = 'text.primary', wide = false }) {
  return (
    <Grid item xs={wide ? 12 : 6} sm={wide ? 8 : 4} lg={wide ? 4 : 2}>
      <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h4" color={color} sx={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
      </Paper>
    </Grid>
  );
}

export default function MonitoringStockSparepartScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const [params, setParams] = useState(defaults);
  const [draftParams, setDraftParams] = useState(() => cloneParams(defaults()));
  const [openFilter, setOpenFilter] = useState(false);
  const [detailContext, setDetailContext] = useState(null);
  const [exporting, setExporting] = useState(null);
  const access = useMonitoringStockAccess();
  const result = useMonitoringStock(params, access.canRead);

  const openFilterDrawer = () => {
    setDraftParams(cloneParams(params));
    setOpenFilter(true);
  };
  const applyFilter = () => {
    setParams({ ...cloneParams(draftParams), page: 1, perPage: params.perPage });
    setOpenFilter(false);
  };
  const resetFilter = () => setDraftParams({ ...defaults(), perPage: params.perPage });
  const download = async (format) => {
    if (exporting) return;
    try {
      setExporting(format);
      enqueueSnackbar(`Menyiapkan ${format.toUpperCase()}...`, { variant: 'info' });
      saveBlob(await downloadMonitoringStock(params, format));
      enqueueSnackbar(`Monitoring Stock ${format.toUpperCase()} berhasil diunduh`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Gagal mengunduh laporan.'), { variant: 'error' });
    } finally {
      setExporting(null);
    }
  };

  if (access.loading) {
    return <MainCard title="Monitoring Stock Sparepart"><Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}><CircularProgress /><Typography color="text.secondary">Memeriksa akses laporan...</Typography></Stack></MainCard>;
  }
  if (access.error || !access.canRead) {
    return <MainCard title="Monitoring Stock Sparepart"><Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => access.retry()}>Retry</Button>}>{access.error ? errorMessage(access.error) : 'Anda tidak memiliki hak baca laporan ini.'}</Alert></MainCard>;
  }

  const summary = result.summary;
  return (
    <MainCard
      title="Monitoring Stock Sparepart"
      secondary={<Stack direction="row" gap={1}>
        <Tooltip title="Download PDF Report"><span><IconButton aria-label="download-pdf" color="error" disabled={Boolean(exporting)} onClick={() => download('pdf')} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>{exporting === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <DocumentDownload />}</IconButton></span></Tooltip>
        <Tooltip title="Download Excel Report"><span><IconButton aria-label="download-excel" color="success" disabled={Boolean(exporting)} onClick={() => download('excel')} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>{exporting === 'excel' ? <CircularProgress size={20} color="inherit" /> : <DocumentText />}</IconButton></span></Tooltip>
        <Tooltip title="Filter"><IconButton aria-label="filter" color="secondary" onClick={() => (openFilter ? setOpenFilter(false) : openFilterDrawer())} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}><Filter /></IconButton></Tooltip>
      </Stack>}
      content={false}
    >
      <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box>
          <Typography variant="body2" color="text.secondary">Current balance{result.generatedAt ? ` | Diperbarui ${new Date(result.generatedAt).toLocaleString('id-ID')}` : ''}</Typography>
          {exporting ? <Typography variant="caption" color="primary">Menyiapkan {exporting.toUpperCase()}, mohon tunggu...</Typography> : null}
        </Box>
        <Grid container spacing={1.5}>
          <SummaryCard label="Available" value={Number(summary.available_rows || 0).toLocaleString('id-ID')} color="success.main" />
          <SummaryCard label="Low Stock" value={Number(summary.low_stock_rows || 0).toLocaleString('id-ID')} color="warning.main" />
          <SummaryCard label="Out of Stock" value={Number(summary.out_of_stock_rows || 0).toLocaleString('id-ID')} color="text.secondary" />
          <SummaryCard label="Negative" value={Number(summary.negative_stock_rows || 0).toLocaleString('id-ID')} color="error.main" />
          <SummaryCard label="Total Stock Value" value={formatMoney(summary.total_stock_value || 0)} wide />
        </Grid>
        {result.error ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => result.retry()}>Retry</Button>}>{errorMessage(result.error)}</Alert> : null}
        <MonitoringStockList {...result} onPageChange={(page) => setParams((previous) => ({ ...previous, page }))} onRowsPerPageChange={(perPage) => setParams((previous) => ({ ...previous, page: 1, perPage }))} onDetail={setDetailContext} />
      </Stack>
      <MonitoringStockFilter open={openFilter} count={result.total} draftParams={draftParams} setDraftParams={setDraftParams} onApply={applyFilter} onReset={resetFilter} onClose={() => setOpenFilter(false)} />
      <MonitoringStockDetail context={detailContext} onClose={() => setDetailContext(null)} />
    </MainCard>
  );
}
