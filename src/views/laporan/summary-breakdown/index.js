'use client';

import { useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import { downloadSummaryBreakdownPdf, useGetSummaryBreakdown } from 'api/summary-breakdown';
import FilterSummaryBreakdown from './filter';
import ListSummaryBreakdown from './list';

const getDefaultDates = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const firstDay = `${yyyy}-${mm}-01`;
  const today = `${yyyy}-${mm}-${dd}`;
  return { startdate: firstDay, enddate: today };
};

const SummaryBreakdownScreen = () => {
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [openFilter, setOpenFilter] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    startdate: defaultDates.startdate,
    enddate: defaultDates.enddate,
    areas: [],
    lokasi_ids: [],
    equipment_ids: [],
    penyewa_ids: [],
    status: '',
    problem_issue: ''
  });

  const { data, total, summary, page, perPage, dataLoading, dataError } = useGetSummaryBreakdown(params);

  const toggleFilter = () => setOpenFilter((prev) => !prev);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blobData = await downloadSummaryBreakdownPdf(params);
      const pdfBlob = new Blob([blobData], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
      console.error('Failed to download summary breakdown PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (dataError) {
    return <Typography color="error">Gagal memuat laporan summary breakdown.</Typography>;
  }

  return (
    <MainCard
      title="Laporan Summary Breakdown"
      secondary={
        <Stack direction="row" gap={1}>
          <IconButton aria-label="download-pdf" variant="dashed" color="secondary" onClick={handleDownload} disabled={downloading}>
            <FileDownloadIcon />
          </IconButton>
          <IconButton aria-label="filter" variant="dashed" color="primary" onClick={toggleFilter}>
            <FilterListIcon />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ px: 1, pb: 2 }}>
        {dataLoading && !data.length ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="120px">
            <CircularProgress />
          </Box>
        ) : null}
        <FilterSummaryBreakdown open={openFilter} count={total} params={params} setParams={setParams} onClose={toggleFilter} />
        <ListSummaryBreakdown
          data={data}
          total={total}
          totalDuration={summary?.total_duration || 0}
          totalEquipment={summary?.total_equipment || 0}
          totalStatusOpen={summary?.total_status_open || 0}
          totalStatusClose={summary?.total_status_close || 0}
          page={page}
          perPage={perPage}
          loading={dataLoading}
          onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          onRowsPerPageChange={(rows) => setParams((prev) => ({ ...prev, perPage: rows, page: 1 }))}
        />
      </Stack>
    </MainCard>
  );
};

export default SummaryBreakdownScreen;
