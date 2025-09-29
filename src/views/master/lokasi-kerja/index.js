'use client';

// REACT
import { useState } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from 'components/@extended/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';

// COMPONENTS
import MainCard from 'components/MainCard';
import ListTableLokasiKerja from './listtable';

// HOOK
import { useGetLokasiKerja } from 'api/lokasi-kerja';
import Paginate from 'components/Paginate';
import FilterLokasiKerja from './filter';

const LokasiKerjaScreen = () => {
  const [isCard, setIsCard] = useState(false); // Default to table view
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 30,
    nama: '',
    cabang_id: '',
    type: '',
    abbr: ''
  });
  const { data, dataLoading, dataError } = useGetLokasiKerja(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;
  if (dataError) return <p>Error fetching data</p>;

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/lokasi-kerja/create`}>
          Add Lokasi Kerja
        </Button>
      }
      secondary={
        <Stack direction="row" gap={1}>
          <IconButton aria-label="settings" variant="dashed" color="secondary" onClick={() => setIsCard(!isCard)}>
            <AutoAwesomeMosaicIcon />
          </IconButton>
          <IconButton aria-label="settings" variant="dashed" color="primary" onClick={toggleFilterHandle}>
            <FilterListIcon />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2}>
        <FilterLokasiKerja data={params} setData={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} />
        <ListTableLokasiKerja data={data} />

        <Stack sx={{ p: 2 }}>
          <Paginate
            page={data?.page}
            total={data?.total || 0}
            lastPage={data?.lastPage || 1}
            perPage={data?.perPage || 30}
            onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          />
        </Stack>
      </Stack>
    </MainCard>
  );
};

export default LokasiKerjaScreen;