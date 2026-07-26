'use client';

import { Fragment, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import ScrollX from 'components/ScrollX';
import AlertNotification from 'components/@extended/AlertNotification';
import { APP_DEFAULT_PATH } from 'config';

import moment from 'moment';
import { useParams, useRouter } from 'next/navigation';

import { useShowShippingOrder } from 'api/shipping-order';
import { openNotification } from 'api/notification';
import axiosServices from 'utils/axios';
import { ArchiveBook, Calendar, Location, Profile2User, Trash } from 'iconsax-react';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Shipping Order', to: '/shipping-order' },
  { title: 'Detail' }
];

export default function FormShowScreen() {
  const { id } = useParams();
  const router = useRouter();
  const { data, dataLoading, dataError } = useShowShippingOrder(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await axiosServices.post(`/scm/shipping-order/${id}/destroy`, null, { skipOfflineQueue: true });
      if (!response.data?.success) throw new Error(response.data?.message || response.message || 'Penghapusan belum diproses server');
      openNotification({
        open: true,
        title: 'success',
        message: 'Shipping Order berhasil dihapus...',
        alert: { color: 'success' }
      });
      router.push('/shipping-order');
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.diagnostic?.error || error?.message || 'Shipping Order gagal dihapus...',
        alert: { color: 'error' }
      });
    } finally {
      setIsDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Detail Shipping Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/shipping-order'} />} content>
        <AlertNotification />
        {dataError ? (
          <Alert severity="warning">Shipping order tidak dapat dimuat atau sudah dihapus.</Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : !data ? (
          <Alert severity="info">Shipping order tidak ditemukan.</Alert>
        ) : (
          <Stack spacing={3}>
            <Box
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                bgcolor: 'secondary.200',
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main'
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Typography variant="overline" color="text.secondary">
                    Shipping Order
                  </Typography>
                  <Typography variant="h3">{data.kode}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                    {data.narasi || 'Tidak ada keterangan.'}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={data.status === 'received' ? 'Diterima' : 'Pending'}
                      color={data.status === 'received' ? 'success' : 'warning'}
                      variant="filled"
                    />
                    <Chip label={data.gudangTujuan?.nama || 'Tanpa gudang tujuan'} color="default" variant="filled" />
                  </Stack>
                </Stack>
                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                  <Button variant="contained" color="error" startIcon={<Trash />} onClick={() => setOpenDeleteDialog(true)}>
                    Delete
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Data Pengirim
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    <InfoRow icon={<Calendar size={18} />} label="Tanggal" value={data.trx_date ? moment(data.trx_date).format('DD MMMM YYYY') : '-'} />
                    <InfoRow icon={<Profile2User size={18} />} label="Nama" value={data.nm_pengirim || '-'} />
                    <InfoRow icon={<ArchiveBook size={18} />} label="Cabang" value={data.cabangSumber?.nama || data.cabang_src || '-'} />
                    <InfoRow icon={<Location size={18} />} label="Alamat" value={data.alamat_pengirim || '-'} />
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" color="error" gutterBottom>
                    Data Penerima
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    <InfoRow icon={<Profile2User size={18} />} label="Nama" value={data.nm_penerima || '-'} />
                    <InfoRow icon={<Location size={18} />} label="Gudang Tujuan" value={data.gudangTujuan?.nama || data.gudang_rec || '-'} />
                    <InfoRow icon={<ArchiveBook size={18} />} label="Phone" value={data.phone_penerima || '-'} />
                    <InfoRow icon={<Location size={18} />} label="Alamat" value={data.alamat_penerima || '-'} />
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            <MainCard content={false} title={<Typography>Items Kiriman</Typography>}>
              <ScrollX>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Account Code</TableCell>
                      <TableCell>Barang</TableCell>
                      <TableCell align="right">Jumlah Kirim</TableCell>
                      <TableCell align="center">Multi Dest</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.items || []).map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.barang?.kode || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.barang?.num_part || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{item.narasi}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.satuan}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{item.kirim} {item.satuan}</TableCell>
                        <TableCell align="center">{item.multi_dest}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollX>
            </MainCard>
          </Stack>
        )}

        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Shipping Order?</DialogTitle>
          <DialogContent>
            <Stack spacing={1}>
              <Typography variant="body2">Tindakan ini akan menghapus shipping order dan me-rollback status pengiriman pada item terkait.</Typography>
              <Divider />
              <Typography variant="caption" color="text.secondary">Shipping Order: {data?.kode || '-'}</Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={() => setOpenDeleteDialog(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button color="error" variant="contained" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </MainCard>
    </Fragment>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'secondary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}
