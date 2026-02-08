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
import ListTableLokasiKerja from './listtable';
import FilterLokasiKerja from './filter';

import { useGetLokasiKerja } from 'api/lokasi-kerja';
import Paginate from 'components/Paginate';
import { Filter } from 'iconsax-react';

const LokasiKerjaScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 25,
    nama: '',
    cabang_id: '',
    type: '',
    abbr: '',
    area: ''
  });
  const { lokasiKerja, lokasiKerjaLoading, lokasiKerjaError, page, perPage, total, lastPage } = useGetLokasiKerja(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/lokasi-kerja/create`}>
          Add Lokasi Kerja
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
        {lokasiKerjaError ? (
          <Typography variant="body2" color="error">
            Error fetching data: {JSON.stringify(lokasiKerjaError)}
          </Typography>
        ) : null}

        {lokasiKerjaLoading ? <Typography variant="body2">Loading...</Typography> : null}

        {!lokasiKerjaError && (
          <>
            <ListTableLokasiKerja data={{ data: lokasiKerja || [] }} />

            <Stack sx={{ p: 2 }}>
              <Paginate
                page={page || params.page}
                total={total || 0}
                lastPage={lastPage || 1}
                perPage={perPage || params.perPages}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Stack>
          </>
        )}
      </Stack>

      <FilterLokasiKerja 
        data={params} 
        setData={setParams} 
        open={openFilter} 
        count={total || 0} 
        onClose={toggleFilterHandle} 
      />
    </MainCard>
  );
};

export default LokasiKerjaScreen;
