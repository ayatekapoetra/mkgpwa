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
  const { data, dataLoading, dataError, page, perPage, total, lastPage } = useGetEquipment(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

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
        <FilterEquipment data={params} setData={setParams} open={openFilter} count={total || data?.total} onClose={toggleFilterHandle} />

        {dataError ? (
          <Typography variant="body2" color="error">
            Error fetching data
          </Typography>
        ) : null}

        {dataLoading ? <Typography variant="body2">Loading...</Typography> : null}

        {!dataError && (
          <>
            {isCard ? <CardListEquipment data={data} /> : <ListTableEquipment data={data} />}

            <Stack sx={{ p: 2 }}>
              <Paginate
                page={page || params.page}
                total={total ?? data?.rows?.length ?? 0}
                lastPage={lastPage || 1}
                perPage={perPage || params.perPages}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Stack>
          </>
        )}
      </Stack>
    </MainCard>
  );
};

export default EquipmentScreen;
