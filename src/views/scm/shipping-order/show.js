'use client';

import { Fragment, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
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
import { ArchiveBook, Calendar, Printer, Location, Profile2User, Trash } from 'iconsax-react';

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
  const [isPrinting, setIsPrinting] = useState(false);

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

  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      const response = await axiosServices.get(`/scm/shipping-order/${id}/print`, {
        responseType: 'blob',
        skipOfflineQueue: true
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.diagnostic?.error || error?.message || 'Dokumen shipping gagal dicetak...',
        alert: { color: 'error' }
      });
    } finally {
      setIsPrinting(false);
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
                background: (theme) => `linear-gradient(135deg, ${theme.palette.secondary[100]} 0%, ${theme.palette.background.paper} 100%)`,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1
              }}
            >
              <Grid container spacing={2.5} alignItems="stretch">
                <Grid item xs={12} lg={8}>
                  <Stack spacing={1.5} sx={{ height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="overline" color="text.secondary">
                        Shipping Order
                      </Typography>
                      <Chip
                        size="small"
                        label={data.status === 'received' ? 'Diterima' : 'Pending'}
                        color={data.status === 'received' ? 'success' : 'warning'}
                        variant="filled"
                      />
                    </Stack>

                    <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
                      {data.kode}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                      {data.narasi || 'Tidak ada keterangan.'}
                    </Typography>

                    <Grid container spacing={1.5} sx={{ pt: 0.5 }}>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoTile
                          label="Tanggal Kirim"
                          value={data.trx_date ? moment(data.trx_date).format('DD MMM YYYY') : '-'}
                          icon={<Calendar size={18} />}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoTile
                          label="Gudang Tujuan"
                          value={data.gudangTujuan?.nama || 'Tanpa gudang tujuan'}
                          icon={<Location size={18} />}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoTile
                          label="Penerima"
                          value={data.nm_penerima || '-'}
                          icon={<Profile2User size={18} />}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      height: '100%'
                    }}
                  >
                    <Stack spacing={2} justifyContent="space-between" sx={{ height: '100%' }}>
                      <Stack spacing={1.25}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Ringkasan Dokumen
                        </Typography>
                        <InfoLine label="Pengirim" value={data.nm_pengirim || '-'} />
                        <InfoLine label="Phone Pengirim" value={data.phone_pengirim || '-'} />
                        <InfoLine label="Phone Penerima" value={data.phone_penerima || '-'} />
                      </Stack>

                      <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} flexWrap="wrap" useFlexGap>
                        <IconButton variant="contained" shape="rounded" color="secondary" onClick={handlePrint} disabled={isPrinting}>
                          <Printer />
                        </IconButton>
                        <IconButton variant="contained" shape="rounded" color="error" onClick={() => setOpenDeleteDialog(true)}>
                          <Trash />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
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

function InfoTile({ icon, label, value }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ color: 'primary.main', display: 'flex', mt: 0.25 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function InfoLine({ label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 96 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">:</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  );
}
