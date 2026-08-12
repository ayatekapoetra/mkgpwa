'use client';

import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import {
  downloadOperatingHistory,
  downloadOperatingHistoryDetail,
  useGetOperatingHistory,
  useGetOperatingHistoryDetail
} from 'api/operating-history';
import FilterOperatingHistory from './filter';
import ListOperatingHistory from './list';

const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return { startdate: `${year}-${month}-01`, enddate: `${year}-${month}-${day}` };
};

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

export default function OperatingHistoryScreen({ detail = false }) {
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const { enqueueSnackbar } = useSnackbar();
  const [openFilter, setOpenFilter] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('');
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    startdate: defaultDates.startdate,
    enddate: defaultDates.enddate,
    penyewa_ids: [],
    shift_ids: [],
    kegiatan_ids: [],
    equipment_ids: []
  });
  const summaryResult = useGetOperatingHistory(detail ? null : params);
  const detailResult = useGetOperatingHistoryDetail(detail ? params : null);
  const result = detail ? detailResult : summaryResult;
  const title = detail ? 'Operating History Detail' : 'Operating History';

  const handleDownload = async (format) => {
    try {
      setDownloadFormat(format);
      const download = detail ? downloadOperatingHistoryDetail : downloadOperatingHistory;
      saveBlob(await download(params, format));
      enqueueSnackbar(`${title} ${format.toUpperCase()} berhasil di-download`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || `Gagal download ${title}`, { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  if (result.dataError) {
    return <Typography color="error">Gagal memuat laporan {title}.</Typography>;
  }

  return (
    <MainCard
      title={title}
      secondary={
        <Stack direction="row" gap={1}>
          <Tooltip title="Download PDF">
            <span>
              <IconButton
                aria-label="download-pdf"
                variant="dashed"
                color="error"
                onClick={() => handleDownload('pdf')}
                disabled={Boolean(downloadFormat)}
              >
                {downloadFormat === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download Excel">
            <span>
              <IconButton
                aria-label="download-excel"
                variant="dashed"
                color="success"
                onClick={() => handleDownload('excel')}
                disabled={Boolean(downloadFormat)}
              >
                {downloadFormat === 'excel' ? <CircularProgress size={20} color="inherit" /> : <DescriptionOutlinedIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton aria-label="filter" variant="dashed" color="primary" onClick={() => setOpenFilter((open) => !open)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ px: 1, pb: 2 }}>
        {result.dataLoading && !result.data.length ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress />
          </Box>
        ) : null}
        <FilterOperatingHistory
          open={openFilter}
          count={result.total}
          params={params}
          setParams={setParams}
          onClose={() => setOpenFilter(false)}
          title={title}
        />
        <ListOperatingHistory
          detail={detail}
          data={result.data}
          total={result.total}
          page={result.page}
          perPage={result.perPage}
          lastPage={result.lastPage}
          loading={result.dataLoading}
          onPageChange={(page) => setParams((previous) => ({ ...previous, page }))}
          onRowsPerPageChange={(perPage) => setParams((previous) => ({ ...previous, perPage, page: 1 }))}
        />
      </Stack>
    </MainCard>
  );
}
