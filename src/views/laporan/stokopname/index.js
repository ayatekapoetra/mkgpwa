'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DocumentDownload, DocumentText, Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import { downloadStokopnameReport, useStokopnameReport, useStokopnameReportAccess } from 'api/stokopname-report';
import StokopnameReportFilter from './filter';
import StokopnameReportList from './list';

const defaultParams = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return {
    bisnis_id: '',
    cabang_id: '',
    gudang_id: '',
    date_from: `${year}-${month}-01`,
    date_to: `${year}-${month}-${new Date(year, today.getMonth() + 1, 0).getDate()}`,
    rack_search: '',
    page: 1,
    perPage: 25
  };
};

const cloneParams = (params) => ({ ...params });

const messageFromError = (error) => error?.diagnostic?.message || error?.message || 'Gagal memuat laporan Stockopname.';

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

export default function StokopnameReportScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const [params, setParams] = useState(defaultParams);
  const [draftParams, setDraftParams] = useState(() => cloneParams(defaultParams()));
  const [openFilter, setOpenFilter] = useState(false);
  const [exporting, setExporting] = useState(null);
  const access = useStokopnameReportAccess();
  const result = useStokopnameReport(params, access.canRead);

  const openFilterDrawer = () => {
    setDraftParams(cloneParams(params));
    setOpenFilter(true);
  };
  const applyFilter = () => {
    setParams({ ...cloneParams(draftParams), page: 1, perPage: params.perPage });
    setOpenFilter(false);
  };
  const resetFilter = () => setDraftParams({ ...defaultParams(), perPage: params.perPage });
  const download = async (format) => {
    try {
      setExporting(format);
      enqueueSnackbar(`Menyiapkan ${format.toUpperCase()}...`, { variant: 'info' });
      saveBlob(await downloadStokopnameReport(params, format));
      enqueueSnackbar(`Laporan Stockopname ${format.toUpperCase()} berhasil diunduh`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(messageFromError(error), { variant: 'error' });
    } finally {
      setExporting(null);
    }
  };

  if (access.loading) {
    return (
      <MainCard title="Laporan Stockopname">
        <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
          <CircularProgress />
          <Typography color="text.secondary">Memeriksa akses laporan...</Typography>
        </Stack>
      </MainCard>
    );
  }

  if (access.error || !access.canRead) {
    return (
      <MainCard title="Laporan Stockopname">
        <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => access.retry()}>Retry</Button>}>
          {messageFromError(access.error) || 'Anda tidak memiliki hak baca laporan ini.'}
        </Alert>
      </MainCard>
    );
  }

  const summary = result.summary || {};

  return (
    <MainCard
      title="Laporan Stockopname"
      secondary={
        <Stack direction="row" gap={1}>
          <Tooltip title="Download PDF Report">
            <span>
              <IconButton aria-label="download-pdf" color="error" onClick={() => download('pdf')} disabled={Boolean(exporting)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                {exporting === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <DocumentDownload />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download Excel Report">
            <span>
              <IconButton aria-label="download-excel" color="success" onClick={() => download('excel')} disabled={Boolean(exporting)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
                {exporting === 'excel' ? <CircularProgress size={20} color="inherit" /> : <DocumentText />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton color="secondary" onClick={() => (openFilter ? setOpenFilter(false) : openFilterDrawer())} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
              <Filter />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Periode {params.date_from} sampai {params.date_to}
          </Typography>
          {exporting ? <Typography variant="caption" color="primary">Menyiapkan {exporting.toUpperCase()}, mohon tunggu...</Typography> : null}
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`Total Rack: ${summary.total_racks || 0}`} variant="outlined" />
          <Chip size="small" label={`Total Item SO: ${summary.total_items || 0}`} variant="outlined" />
          <Chip size="small" label={`Draft: ${summary.total_draft || 0}`} variant="outlined" />
          <Chip size="small" label={`Open: ${summary.total_open || 0}`} variant="outlined" color="info" />
          <Chip size="small" label={`Approval: ${summary.total_approval || 0}`} variant="outlined" color="warning" />
          <Chip size="small" label={`Close: ${summary.total_close || 0}`} variant="outlined" color="success" />
          <Chip size="small" label={`Rack Terkunci: ${summary.total_locked || 0}`} color="error" />
        </Stack>

        {result.error ? (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => result.retry()}>Retry</Button>}>
            {messageFromError(result.error)}
          </Alert>
        ) : null}

        <StokopnameReportList
          {...result}
          onPageChange={(page) => setParams((previous) => ({ ...previous, page }))}
          onRowsPerPageChange={(perPage) => setParams((previous) => ({ ...previous, page: 1, perPage }))}
        />
      </Stack>

      <StokopnameReportFilter open={openFilter} count={result.total} draftParams={draftParams} setDraftParams={setDraftParams} onApply={applyFilter} onReset={resetFilter} onClose={() => setOpenFilter(false)} />
    </MainCard>
  );
}
