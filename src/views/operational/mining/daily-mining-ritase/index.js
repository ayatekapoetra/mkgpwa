'use client';

import { Fragment, useState } from 'react';
// import Link from 'next/link';

// MATERIAL - UI
// import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';

// THIRD - PARTY
import { Filter } from 'iconsax-react';
import { useGetMiningProduksi } from 'api/mining-produksi';
import ListMiningRitase from './list';

// SWR
// import { useGetPenugasanKerjaItems } from 'api/penugasan-kerja';
// import FilterPenugasanKerja from './filter';
// import useUser from 'hooks/useUser';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Mining Ritase', to: '/penugasan-kerja' }
];

export default function DailyMiningProduksiScreen() {
  // const users = useUser();
  // const isAdmin = ['developer', 'administrator'].includes(users.role);
  const [openFilter, setOpenFilter] = useState(false);
  const { data, dataLoading } = useGetMiningProduksi();
  console.log(data);

  // const [params, setParams] = useState({
  //   page: 1,
  //   perPage: 25,
  //   cabang_id: '',
  //   excavator_id: '',
  //   dumptruck_id: '',
  //   material_id: '',
  //   dom_id: ''
  // });

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Daily Mining Ritase'} links={breadcrumbLinks} />
      <MainCard
        title={<div></div>}
        secondary={
          <IconButton shape="rounded" color="secondary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        }
        content={false}
      >
        {/* <FilterPenugasanKerja data={params} setData={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} /> */}
        {!dataLoading && <ListMiningRitase data={data} />}
      </MainCard>
    </Fragment>
  );
}
