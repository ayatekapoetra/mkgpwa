'use client';

import { useParams, useRouter } from 'next/navigation';

import { Alert, Stack } from '@mui/material';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import { APP_DEFAULT_PATH } from 'config';
import { usePengajuanDanaAccess, usePengajuanDanaPermissions, useShowPengajuanDana } from 'api/pengajuan-dana';

import PengajuanDanaForm from './form';

export default function PengajuanDanaFormPage({ mode = 'create' }) {
  const params = useParams();
  const router = useRouter();
  const isEdit = mode === 'edit';
  const { permissions: access, loading: accessLoading, error: accessError } = usePengajuanDanaAccess();
  const canRead = !accessLoading && !accessError && access.can_read;
  const { row, rowLoading, rowError } = useShowPengajuanDana(isEdit ? params.id : null, isEdit && canRead);
  const { permissions, loading: permissionsLoading, error: permissionsError } = usePengajuanDanaPermissions(
    isEdit ? params.id : null,
    isEdit && canRead
  );

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Pengajuan Dana', to: '/pengajuan-dana' },
    { title: isEdit ? 'Edit' : 'Create' }
  ];

  if (accessLoading || (isEdit && canRead && (rowLoading || permissionsLoading))) {
    return <LoadingScreen fullScreen={false} message="Memuat form pengajuan" />;
  }

  if (accessError || (isEdit && (rowError || permissionsError))) {
    return <ErrorScreen error={accessError || rowError || permissionsError} variant="data" showDetails={false} />;
  }

  if ((!isEdit && !access.can_insert) || (isEdit && !access.can_read)) {
    return <ErrorScreen error={{ message: 'Anda tidak memiliki hak akses untuk halaman Pengajuan Dana ini.' }} variant="data" showDetails={false} />;
  }

  if (isEdit && !permissions.can_update) {
    return <ErrorScreen error={{ message: 'Anda tidak memiliki hak akses untuk mengubah Pengajuan Dana ini.' }} variant="data" showDetails={false} />;
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
