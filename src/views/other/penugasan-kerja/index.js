'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';

// THIRD - PARTY
import { Filter } from 'iconsax-react';
import ListPenugasanKerja from './list';

// SWR
import { useGetPenugasanKerjaItems } from 'api/penugasan-kerja';
import FilterPenugasanKerja from './filter';
import useUser from 'hooks/useUser';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Penugasan Kerja', to: '/penugasan-kerja' }
];

export default function PenugasanKerjaScreen() {
  const users = useUser();
  const isAdmin = ['developer', 'administrator'].includes(users.role);
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    kode: '',
    type: '',
    assigner_id: isAdmin ? '' : users?.employee_id,
    assigned_id: isAdmin ? '' : users?.employee_id,
    startDate: '',
    endDate: ''
  });
  const { data, dataLoading } = useGetPenugasanKerjaItems(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Tugas Kerja'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/penugasan-kerja/create">
            Buat Penugasan
          </Button>
        }
        secondary={
          <IconButton shape="rounded" color="secondary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        }
        content={false}
      >
        <FilterPenugasanKerja data={params} setData={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} />
        {!dataLoading && <ListPenugasanKerja data={data} setParams={setParams} />}
      </MainCard>
    </Fragment>
  );
}
