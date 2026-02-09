'use client';

import { useState } from 'react';
import moment from 'moment';
import MainCard from 'components/MainCard';
import { Card, CardContent, Stack, Chip, IconButton, Button } from '@mui/material';
import { HashtagDown, Filter } from 'iconsax-react';
import Paginate from 'components/Paginate';

import { useMonthlyAttendance } from 'api/absensi';
import AbsensiTable from './table';
import FilterAbsensi from './filter';

const AbsensiKaryawanScreen = () => {
  const defaultPeriode = moment().format('YYYY-MM');
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    periode: defaultPeriode,
    cabang_id: '',
    karyawan_id: ''
  });

  const { attendance, attendanceLoading, attendanceError, total } = useMonthlyAttendance(params);
  const page = params.page || 1;
  const perPages = params.perPages || 25;

  const toggleFilterHandle = () => setOpenFilter((prev) => !prev);

  return (
    <MainCard
      title={<Button variant="contained" startIcon={<HashtagDown size={18} />} href="/absensi-karyawan/import-mesin">Import Mesin</Button>}
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton aria-label="filter" variant="dashed" color="primary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Card elevation={0} sx={{ borderRadius: 0 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {attendanceLoading ? <Chip label="Loading..." size="small" color="info" /> : null}
              {attendanceError ? <Chip label="Error memuat data" size="small" color="error" /> : null}
            </Stack>

            <AbsensiTable rows={attendance} loading={attendanceLoading} error={attendanceError} />

            <Paginate
              page={page}
              total={total || 0}
              lastPage={Math.max(1, Math.ceil((total || 0) / perPages))}
              perPage={perPages}
              onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
            />
          </Stack>
        </CardContent>
      </Card>

      <FilterAbsensi
        data={params}
        setData={setParams}
        open={openFilter}
        count={total}
        onClose={toggleFilterHandle}
      />
    </MainCard>
  );
};

export default AbsensiKaryawanScreen;
