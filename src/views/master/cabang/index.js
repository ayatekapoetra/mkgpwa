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
import ListTableCabang from './listtable';
import FilterCabang from './filter';

import { useGetCabang } from 'api/cabang';
import Paginate from 'components/Paginate';
import { Filter } from 'iconsax-react';

const CabangScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 25,
    nama: '',
    kode: '',
    area: '',
    bisnis_id: '',
    tipe: ''
  });
  const { cabang, cabangLoading, cabangError } = useGetCabang(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (cabangLoading) return <Typography variant="body1">Loading...</Typography>;
  if (cabangError) {
    console.log('Data error details:', cabangError);
    return <p>Error fetching data: {JSON.stringify(cabangError)}</p>;
  }

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/cabang/create`}>
          Add Cabang
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
        <ListTableCabang data={{ data: cabang?.rows || [] }} />

        <Stack sx={{ p: 2 }}>
          <Paginate
            page={cabang?.page || 1}
            total={cabang?.total || 0}
            lastPage={cabang?.lastPage || 1}
            perPage={cabang?.perPage || 25}
            onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          />
        </Stack>
      </Stack>

      <FilterCabang 
        data={params} 
        setData={setParams} 
        open={openFilter} 
        count={cabang?.total || 0} 
        onClose={toggleFilterHandle} 
      />
    </MainCard>
  );
};

export default CabangScreen;
