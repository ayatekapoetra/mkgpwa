'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Box1, DocumentDownload, DocumentText, Filter, MoneyRecive, Refresh } from 'iconsax-react';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import {
  downloadMonitoringSparepartStock,
  useMonitoringSparepartStock,
  useMonitoringSparepartStockAccess
} from 'api/monitoring-sparepart-stock';
import MonitoringSparepartStockDetail from './detail';
import MonitoringSparepartStockFilter from './filter';
import MonitoringSparepartStockList, { formatMoney } from './list';

const defaults = () => ({
  bisnis_id: '',
  gudang_id: '',
  rack_id: '',
  kode: '',
  numpart: '',
  nama: '',
  is_min_stok: false,
  stock_used_zero: false,
  page: 1,
  perPage: 25
});
const errorMessage = (error, fallback = 'Gagal memuat Stock Monitoring.') =>
  error?.response?.data?.diagnostic?.message || error?.diagnostic?.message || error?.message || fallback;
const filterKeys = ['bisnis_id', 'gudang_id', 'rack_id', 'kode', 'numpart', 'nama', 'is_min_stok', 'stock_used_zero'];

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

function SummaryCard({ label, value, icon, color = 'primary', featured = false, hint }) {
  return (
    <Box sx={{ flex: { xs: 'unset', sm: 1 }, width: { xs: '100%', sm: 'unset' } }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.75,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: featured ? `${color}.lighter` : 'background.paper',
          borderColor: featured ? `${color}.light` : 'divider'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant={featured ? 'h4' : 'h5'} color={featured ? `${color}.dark` : 'text.primary'} sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
            {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>{icon}</Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default function MonitoringSparepartStockScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const [params, setParams] = useState(defaults);
  const [draftParams, setDraftParams] = useState(defaults);
  const [openFilter, setOpenFilter] = useState(false);
  const [detailContext, setDetailContext] = useState(null);
  const [exporting, setExporting] = useState(null);
  const access = useMonitoringSparepartStockAccess();
  const result = useMonitoringSparepartStock(params, access.canRead);
  const activeFilterCount = filterKeys.filter((key) => Boolean(params[key])).length;

  const openFilterDrawer = () => {
    setDraftParams({ ...params });
    setOpenFilter(true);
  };
  const applyFilter = () => {
    setParams({ ...draftParams, page: 1, perPage: params.perPage });
    setOpenFilter(false);
  };
  const resetFilter = () => setDraftParams({ ...defaults(), perPage: params.perPage });
  const download = async (format) => {
    if (exporting) return;
    try {
      setExporting(format);
      enqueueSnackbar(`Menyiapkan ${format.toUpperCase()}...`, { variant: 'info' });
      saveBlob(await downloadMonitoringSparepartStock(params, format));
      enqueueSnackbar(`Stock Monitoring ${format.toUpperCase()} berhasil diunduh`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Gagal mengunduh laporan.'), { variant: 'error' });
    } finally {
      setExporting(null);
    }
  };

  if (access.loading) {
    return <MainCard title="Stock Monitoring"><Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}><CircularProgress /><Typography color="text.secondary">Memeriksa akses laporan...</Typography></Stack></MainCard>;
  }
  if (access.error || !access.canRead) {
    return <MainCard title="Stock Monitoring"><Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => access.retry()}>Retry</Button>}>{access.error ? errorMessage(access.error) : 'Anda tidak memiliki hak baca laporan ini.'}</Alert></MainCard>;
  }

  const summary = result.summary;
  return (
    <MainCard
      title="Stock Monitoring"
      secondary={
        <Stack direction="row" gap={0.5}>
          <Tooltip title="Refresh data"><span><IconButton aria-label="Refresh Stock Monitoring" color="primary" disabled={result.refreshing} onClick={() => result.retry()} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}><Refresh /></IconButton></span></Tooltip>
          <Tooltip title="Download PDF"><span><IconButton aria-label="Download PDF" color="error" disabled={Boolean(exporting)} onClick={() => download('pdf')} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>{exporting === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <DocumentDownload />}</IconButton></span></Tooltip>
          <Tooltip title="Download Excel"><span><IconButton aria-label="Download Excel" color="success" disabled={Boolean(exporting)} onClick={() => download('excel')} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>{exporting === 'excel' ? <CircularProgress size={20} color="inherit" /> : <DocumentText />}</IconButton></span></Tooltip>
          <Tooltip title={activeFilterCount ? `${activeFilterCount} filter aktif` : 'Filter'}>
            <Badge badgeContent={activeFilterCount} color="secondary">
              <IconButton aria-label={`Filter${activeFilterCount ? `, ${activeFilterCount} aktif` : ''}`} color="secondary" onClick={() => (openFilter ? setOpenFilter(false) : openFilterDrawer())} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}><Filter /></IconButton>
            </Badge>
          </Tooltip>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
          <Box>
            <Typography variant="body2" fontWeight={600}>Current stock per warehouse dan rack</Typography>
            <Typography variant="caption" color="text.secondary">Generated {result.generatedAt ? new Date(result.generatedAt).toLocaleString('id-ID') : 'belum tersedia'}</Typography>
          </Box>
          {result.refreshing ? <Typography variant="caption" color="primary">Memperbarui data...</Typography> : null}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
          <SummaryCard label="Total Items" value={Number(summary.total_distinct_items || 0).toLocaleString('id-ID')} icon={<Box1 size={24} />} />
          <SummaryCard label="Stock Value (Avg)" value={formatMoney(Math.round(summary.grand_total_avg_value || 0))} icon={<MoneyRecive size={26} />} color="secondary" featured />
          <SummaryCard label="Stock Value (Actual)" value={formatMoney(Math.round(summary.grand_total_actual_value || 0))} icon={<MoneyRecive size={26} />} color="success" featured />
        </Stack>
        {activeFilterCount ? <Alert severity="info" icon={<Filter size={20} />}>{activeFilterCount} filter aktif{params.is_min_stok ? ' (minimum stock hanya diterapkan saat export)' : ''}</Alert> : null}
        {result.error ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => result.retry()}>Retry</Button>}>{errorMessage(result.error)}</Alert> : null}
        <MonitoringSparepartStockList {...result} onPageChange={(page) => setParams((previous) => ({ ...previous, page }))} onRowsPerPageChange={(perPage) => setParams((previous) => ({ ...previous, page: 1, perPage }))} onDetail={setDetailContext} />
      </Stack>
      <MonitoringSparepartStockFilter open={openFilter} count={result.total} draftParams={draftParams} setDraftParams={setDraftParams} onApply={applyFilter} onReset={resetFilter} onClose={() => setOpenFilter(false)} />
      <MonitoringSparepartStockDetail context={detailContext} onClose={() => setDetailContext(null)} />
    </MainCard>
  );
}
