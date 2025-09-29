'use client';

// REACT
import { useState } from 'react';
// NEXT
import Link from 'next/link';

// MATERIAL - UI
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import ListDom from './list';
import FilterDom from './filter';

// HOOK & SWR
import { useGetUserAccess } from 'api/menu';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Setting', to: '#' },
  { title: 'Permission', to: '#' }
];

const PermissionScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    user_id: '',
    menu_id: '',
    submenu_id: '',
    page: 1,
    perPages: 25
  });

  const { data, dataLoading, dataError } = useGetUserAccess(params);
  console.log(data);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  if (dataError) return <p>Error fetching data</p>;

  return (
    <>
      <Breadcrumbs custom heading={'User Access'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/user-access/create">
            Add Privillages
          </Button>
        }
        secondary={
          <Stack direction="row">
            <IconButton aria-label="settings" onClick={toggleFilterHandle}>
              <FilterListIcon />
            </IconButton>
          </Stack>
        }
        content={false}
      >
        <Stack>
          <FilterDom data={params} setData={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} />
          {!dataLoading && <ListDom data={data} params={params} setParams={setParams} />}
        </Stack>
      </MainCard>
    </>
  );
};

export default PermissionScreen;
