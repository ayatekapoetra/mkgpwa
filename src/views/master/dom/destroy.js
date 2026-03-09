'use client';

import { Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Box, Typography, Alert, Stack, Chip } from '@mui/material';

// THIRD - PARTY
import { Trash, Warning2 } from 'iconsax-react';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import axiosServices from 'utils/axios';

// HOOK
import { openNotification } from 'api/notification';
import { useShowDom } from 'api/dom';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Dom berhasil dihapus...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Dom', to: '/dom' }, { title: 'Destroy' }];

export default function DestroyDomScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { data: domData, dataLoading } = useShowDom(id);

  const handleDelete = async () => {
    try {
      await axiosServices.post(`/api/master/dom/${id}/destroy`);
      route.push('/dom');
      openNotification(msgSuccess);
    } catch (error) {
      openNotification({ ...msgError, message: error?.diagnostic?.error || 'Gagal menghapus DOM' });
    }
  };

  if (dataLoading) {
    return <div>Loading data...</div>;
  }

  if (!domData) {
    return <div>Data tidak ditemukan</div>;
  }

  const cargoDisplay = domData.cargo_type === 'MPR' ? 'MPR (Import)' : domData.cargo_type === 'B' ? 'IMN (Barge)' : domData.cargo_type;
  const truckDisplay = domData.truck_type === '10_RODA' ? '10 Roda' : domData.truck_type === '12_RODA' ? '12 Roda' : domData.truck_type;

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Delete Dom'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/dom'} />} secondary={null} content={true}>
        <Grid container spacing={3}>
          {/* Warning Alert */}
          <Grid item xs={12}>
            <Alert 
              severity="error" 
              icon={<Warning2 variant="Bold" />}
              sx={{ 
                border: '2px solid',
                borderColor: 'error.main',
                backgroundColor: 'error.lighter'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                ⚠️ Peringatan: Hapus DOM
              </Typography>
              <Typography variant="body2">
                Anda akan menghapus DOM ini secara permanen. Data yang sudah dihapus <strong>tidak dapat dikembalikan</strong>.
                <br />
                Pastikan Anda yakin sebelum melanjutkan.
              </Typography>
            </Alert>
          </Grid>

          {/* DOM Info */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 3, 
              border: '1px solid', 
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
                Informasi DOM
              </Typography>
              
              <Stack spacing={2}>
                <InfoRow label="Kode DOM" value={domData.kode} highlight />
                <InfoRow label="Tanggal Ops" value={domData.date_ops} />
                <InfoRow label="Cargo Type" value={cargoDisplay} />
                <InfoRow label="Contractor" value={domData.contractor_code} />
                <InfoRow label="Cabang" value={domData.cabang?.nama || '-'} />
                <InfoRow label="Pit Source" value={domData.pitSource?.nama || '-'} />
                <InfoRow label="Material" value={domData.material?.nama || '-'} />
                <InfoRow label="Truck Type" value={truckDisplay} />
                <InfoRow 
                  label="Ritase" 
                  value={`${domData.current_ret || 0}/${domData.target_ret || 0}`} 
                />
                <InfoRow 
                  label="Status" 
                  value={
                    <Chip 
                      label={domData.status || '-'} 
                      size="small"
                      color={domData.status === 'OPEN' ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  } 
                />
              </Stack>
            </Box>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
              <Button component={Link} href="/dom" variant="outlined" color="secondary" size="large">
                Batal
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="contained" 
                color="error" 
                size="large"
                startIcon={<Trash variant="Bold" />}
              >
                Ya, Hapus DOM
              </Button>
            </CardActions>
          </Grid>
        </Grid>
      </MainCard>
    </Fragment>
  );
}

// Component untuk menampilkan info row
function InfoRow({ label, value, highlight = false }) {
  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography 
        variant="body2" 
        sx={{ 
          minWidth: 150, 
          fontWeight: 600,
          color: 'text.secondary' 
        }}
      >
        {label}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          flex: 1,
          fontWeight: highlight ? 700 : 400,
          fontFamily: highlight ? 'monospace' : 'inherit',
          fontSize: highlight ? '1rem' : 'inherit'
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
