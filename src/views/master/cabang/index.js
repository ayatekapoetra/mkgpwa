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
  const { cabang, cabangLoading, cabangError, page, perPage, total, lastPage } = useGetCabang(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

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
        {cabangError ? (
          <Typography variant="body2" color="error">
            Error fetching data: {JSON.stringify(cabangError)}
          </Typography>
        ) : null}

        {cabangLoading ? <Typography variant="body2">Loading...</Typography> : null}

        {!cabangError && (
          <>
            <ListTableCabang data={{ data: cabang?.rows || [] }} />

            <Stack sx={{ p: 2 }}>
              <Paginate
                page={page || params.page}
                total={total ?? cabang?.rows?.length ?? 0}
                lastPage={lastPage || 1}
                perPage={perPage || params.perPages}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Stack>
          </>
        )}
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
