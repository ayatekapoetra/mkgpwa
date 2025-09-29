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
import CardListEquipment from './listcard';
import ListTableEquipment from './listtable';

// HOOK
import { useGetEquipment } from 'api/equipment';
import Paginate from 'components/Paginate';
import FilterEquipment from './filter';

const EquipmentScreen = () => {
  const [isCard, setIsCard] = useState(true);
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 30,
    kode: '',
    cabang_id: '',
    kategori: '',
    manufaktur: '',
    tipe: '',
    partner_id: ''
  });
  const { data, dataLoading, dataError } = useGetEquipment(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;
  if (dataError) return <p>Error fetching data</p>;

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/equipment/create`}>
          Add Equipment
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
        <FilterEquipment data={params} setData={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} />
        {isCard ? <CardListEquipment data={data} /> : <ListTableEquipment data={data} />}

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

export default EquipmentScreen;
