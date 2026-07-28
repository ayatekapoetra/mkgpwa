'use client';

import { useParams, useRouter } from 'next/navigation';

import { Alert, Stack } from '@mui/material';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import { APP_DEFAULT_PATH } from 'config';
import { useShowPengajuanDana } from 'api/pengajuan-dana';

import PengajuanDanaForm from './form';

export default function PengajuanDanaFormPage({ mode = 'create' }) {
  const params = useParams();
  const router = useRouter();
  const isEdit = mode === 'edit';
  const { row, rowLoading, rowError } = useShowPengajuanDana(isEdit ? params.id : null);

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Pengajuan Dana', to: '/pengajuan-dana' },
    { title: isEdit ? 'Edit' : 'Create' }
  ];

  if (isEdit && rowLoading) {
    return <LoadingScreen fullScreen={false} message="Memuat form pengajuan" />;
  }

  if (isEdit && rowError) {
    return <ErrorScreen error={rowError} variant="data" showDetails={false} />;
  }

  return (
    <>
      <Breadcrumbs custom heading={isEdit ? 'Edit Pengajuan Dana' : 'Create Pengajuan Dana'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/pengajuan-dana" />} content>
        <Stack spacing={2}>
          {isEdit && row?.status !== 'open' && (
            <Alert severity="warning">Dokumen hanya dapat diedit saat status masih open.</Alert>
          )}
          <PengajuanDanaForm mode={mode} initialData={row} onSuccess={(id) => router.push(isEdit ? `/pengajuan-dana/${params.id}` : `/pengajuan-dana/${id}`)} />
        </Stack>
      </MainCard>
    </>
  );
}
