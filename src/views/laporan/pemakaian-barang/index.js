'use client';

// PROJECT IMPORTS
import { useState } from 'react';

// MATERIAL - UI
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from 'components/@extended/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';
import { useGetPemakaianBarang } from 'api/pemakaian-barang';
import FilterPemakaianBarang from 'views/laporan/pemakaian-barang/filter';
import ListPemakaianBarang from 'views/laporan/pemakaian-barang/list';
import ChartPart from 'views/laporan/pemakaian-barang/chart-part';

// EXCEL EXPORT
import * as XLSX from 'xlsx';

const LaporanEvaluasiPartScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    thnbln: '2025-03',
    equipment_id: '',
    cabang_id: '',
    kategori_equipment: ''
  });
  const { data, dataLoading, dataError } = useGetPemakaianBarang(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pemakaian Barang');
    XLSX.writeFile(wb, 'laporan-pemakaian-barang.xlsx');
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;
  if (dataError) return <p>Error fetching data</p>;

  return (
    <MainCard
      title="Laporan Pemakaian Barang"
      secondary={
        <Stack direction="row" gap={1}>
          <IconButton aria-label="export" variant="dashed" color="secondary" onClick={handleExport}>
            <FileDownloadIcon />
          </IconButton>
          <IconButton aria-label="filter" variant="dashed" color="primary" onClick={toggleFilterHandle}>
            <FilterListIcon />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ px: 1, pb: 2 }}>
        <FilterPemakaianBarang open={openFilter} count={data?.length} params={params} setParams={setParams} onClose={toggleFilterHandle} />
        <ListPemakaianBarang data={data} params={params} onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))} />
        <ChartPart data={data} params={params} />
      </Stack>
    </MainCard>
  );
};

export default LaporanEvaluasiPartScreen;
