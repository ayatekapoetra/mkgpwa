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
import ListTableBarang from './listtable';

// HOOK
import { useGetBarang } from 'api/barang';
import Paginate from 'components/Paginate';
import FilterBarang from './filter';

const BarangScreen = () => {
  const [isCard, setIsCard] = useState(false); // Default to table view
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 30,
    nama: '',
    kode: '',
    num_part: '',
    kategori_id: '',
    application_id: '',
    manufacture_id: '',
    brand_id: '',
    satuan: '',
    stn_pakai: ''
  });
  const { data, dataLoading, dataError, pagination } = useGetBarang(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;
  if (dataError) {
    return <Typography color="error">Gagal mengambil data barang.</Typography>;
  }

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/barang/create`}>
          Add Barang
        </Button>
      }
      secondary={
        <Stack direction="row" gap={1}>
          <IconButton aria-label="settings" variant="dashed" color="secondary" onClick={() => setIsCard(!isCard)}>
            <AutoAwesomeMosaicIcon />
          </IconButton>
          <IconButton aria-label="settings" color="primary" onClick={toggleFilterHandle} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
            <FilterListIcon />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2}>
        <FilterBarang data={params} setData={setParams} open={openFilter} count={pagination.total} onClose={toggleFilterHandle} />
        <ListTableBarang data={{ data: data || [] }} />

        <Stack sx={{ p: 2 }}>
          <Paginate
            page={pagination?.page || 1}
            total={pagination?.total || 0}
            lastPage={pagination?.lastPage || 1}
            perPage={pagination?.perPage || 30}
            onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          />
        </Stack>
      </Stack>
    </MainCard>
  );
};

export default BarangScreen;
