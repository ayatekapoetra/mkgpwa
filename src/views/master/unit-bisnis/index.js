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
import ListTableBisnisUnit from './listtable';
import FilterBisnisUnit from './filter';

import { useGetBisnisUnit } from 'api/bisnis-unit';
import Paginate from 'components/Paginate';
import { Filter } from 'iconsax-react';

const UnitBisnisScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 25,
    name: '',
    kode: ''
  });
  const { bisnisUnit, bisnisUnitLoading, bisnisUnitError } = useGetBisnisUnit(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (bisnisUnitLoading) return <Typography variant="body1">Loading...</Typography>;
  if (bisnisUnitError) {
    console.log('Data error details:', bisnisUnitError);
    return <p>Error fetching data: {JSON.stringify(bisnisUnitError)}</p>;
  }

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/unit-bisnis/create`}>
          Add Unit Bisnis
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
        <ListTableBisnisUnit data={{ data: bisnisUnit?.rows || [] }} />

        <Stack sx={{ p: 2 }}>
          <Paginate
            page={bisnisUnit?.page || 1}
            total={bisnisUnit?.total || 0}
            lastPage={bisnisUnit?.lastPage || 1}
            perPage={bisnisUnit?.perPage || 25}
            onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
          />
        </Stack>
      </Stack>

      <FilterBisnisUnit 
        data={params} 
        setData={setParams} 
        open={openFilter} 
        count={bisnisUnit?.total || 0} 
        onClose={toggleFilterHandle} 
      />
    </MainCard>
  );
};

export default UnitBisnisScreen;
