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
import ListTablePenyewa from './listtable';
import FilterPenyewa from './filter';

import { useGetPenyewa } from 'api/penyewa';
import Paginate from 'components/Paginate';
import { Filter } from 'iconsax-react';

const PenyewaScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 25,
    nama: '',
    kode: '',
    abbr: '',
    bisnis_id: ''
  });
  const { penyewa, penyewaLoading, penyewaError, page, perPage, total, lastPage } = useGetPenyewa(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (penyewaLoading) return <Typography variant="body1">Loading...</Typography>;
  if (penyewaError) {
    console.log('Data error details:', penyewaError);
    return <p>Error fetching data: {JSON.stringify(penyewaError)}</p>;
  }

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/penyewa/create`}>
          Add Penyewa
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
        <ListTablePenyewa data={{ data: penyewa || [] }} />

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

      <FilterPenyewa 
        data={params} 
        setData={setParams} 
        open={openFilter} 
        count={total || 0} 
        onClose={toggleFilterHandle} 
      />
    </MainCard>
  );
};

export default PenyewaScreen;
