'use client';

import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import { downloadProductivity, useGetProductivityV2 } from 'api/productivity';
import FilterProductivity from './filter';
import ListProductivity from './list';

const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { startdate: `${year}-${month}-01`, enddate: `${year}-${month}-${day}` };
};

const errorMessage = (error) => error?.diagnostic?.message || error?.message || 'Gagal memuat laporan Productivity.';

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

export default function ProductivityScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [openFilter, setOpenFilter] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('');
  const [draftParams, setDraftParams] = useState({
    startdate: defaultDates.startdate,
    enddate: defaultDates.enddate,
    penyewa_ids: [],
    equipment_ids: [],
    shift_ids: []
  });
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    ...draftParams
  });

  const result = useGetProductivityV2(params);

  const handleDownload = async (format) => {
    try {
      setDownloadFormat(format);
      saveBlob(await downloadProductivity(params, format));
      enqueueSnackbar(`Productivity ${format.toUpperCase()} berhasil di-download`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(errorMessage(error), { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  const applyFilters = () => {
    setParams((previous) => ({ ...previous, ...draftParams, page: 1 }));
    setOpenFilter(false);
  };

  const resetFilters = (resetParams) => {
    setDraftParams(resetParams);
    setParams((previous) => ({ ...previous, ...resetParams, page: 1 }));
  };

  return (
    <MainCard
      title="Laporan Productivity"
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
            <IconButton aria-label="filter" color="primary" onClick={() => setOpenFilter((open) => !open)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ px: 1, pb: 2 }}>
        {result.dataError ? <Alert severity="error">{errorMessage(result.dataError)}</Alert> : null}
        {result.summary ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Terakhir diperbarui: {result.summary.refreshedAt ? new Date(result.summary.refreshedAt).toLocaleString('id-ID') : '-'}
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              color={result.summary.stale ? 'warning' : 'success'}
              label={result.summary.stale ? 'Data stale' : 'Data terbaru'}
            />
            {result.summary.whLiveToday ? (
              <Chip size="small" variant="outlined" color="info" label="WH hari ini: live" />
            ) : null}
          </Stack>
        ) : null}
        {result.dataLoading && !result.data.length ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress />
          </Box>
        ) : null}
        <FilterProductivity
          open={openFilter}
          count={result.total}
          params={draftParams}
          setParams={setDraftParams}
          onApply={applyFilters}
          onReset={resetFilters}
          onClose={() => setOpenFilter(false)}
        />
        <ListProductivity
          data={result.data}
          total={result.total}
          page={result.page}
          perPage={result.perPage}
          lastPage={result.lastPage}
          loading={result.dataLoading}
          filterParams={params}
          onPageChange={(page) => setParams((previous) => ({ ...previous, page }))}
          onRowsPerPageChange={(perPage) => setParams((previous) => ({ ...previous, perPage, page: 1 }))}
        />
      </Stack>
    </MainCard>
  );
}
