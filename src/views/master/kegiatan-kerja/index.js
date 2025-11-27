'use client';

import { useState } from 'react';
import Link from 'next/link';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';

import MainCard from 'components/MainCard';
import ListTableKegiatanKerja from './listtable';
import FilterKegiatanKerja from './filter';

import { useGetKegiatanKerja } from 'api/kegiatan-kerja';
import Paginate from 'components/Paginate';
import { Filter } from 'iconsax-react';

const KegiatanKerjaScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 25,
    nama: '',
    grpequipment: ''
  });
  const { kegiatanKerja, kegiatanKerjaLoading, kegiatanKerjaError, page, perPage, total, lastPage } = useGetKegiatanKerja(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (kegiatanKerjaLoading) return <Typography variant="body1">Loading...</Typography>;
  if (kegiatanKerjaError) {
    console.log('Data error details:', kegiatanKerjaError);
    return <p>Error fetching data: {JSON.stringify(kegiatanKerjaError)}</p>;
  }

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/kegiatan-kerja/create`}>
          Add Kegiatan Kerja
        </Button>
      }
      secondary={
        <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
          <ListItemButton onClick={toggleFilterHandle}>
            <ListItemIcon>
              <Filter />
            </ListItemIcon>
          </ListItemButton>
        </List>
      }
      content={false}
    >
      <Stack spacing={2}>
        <ListTableKegiatanKerja data={{ data: kegiatanKerja || [] }} />

        <Stack sx={{ p: 2 }}>
          <Paginate
            page={page || 1}
            total={total || 0}
            lastPage={lastPage || 1}
            perPage={perPage || 25}
            onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          />
        </Stack>
      </Stack>

      <FilterKegiatanKerja 
        data={params} 
        setData={setParams} 
        open={openFilter} 
        count={total || 0} 
        onClose={toggleFilterHandle} 
      />
    </MainCard>
  );
};

export default KegiatanKerjaScreen;
