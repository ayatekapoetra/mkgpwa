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

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import ScrollX from 'components/ScrollX';
import AlertNotification from 'components/@extended/AlertNotification';
import { APP_DEFAULT_PATH } from 'config';

import moment from 'moment';
import { useParams, useRouter } from 'next/navigation';

import { useShowPickupOrder } from 'api/pickup-order';
import { openNotification } from 'api/notification';
import axiosServices from 'utils/axios';
import { ArchiveBook, Box1, Calendar, Location, Profile2User, Trash } from 'iconsax-react';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Pickup Order', to: '/pickup-order' },
  { title: 'Detail' }
];

export default function FormShowScreen() {
  const { id } = useParams();
  const router = useRouter();
  const { data, dataLoading } = useShowPickupOrder(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => {
    const items = data?.items || [];
    const totalItems = items.length;
    const totalQty = items.reduce((sum, item) => sum + Number(item.qty_pickup || 0), 0);
    const totalValue = items.reduce((sum, item) => sum + Number(item.harga || 0), 0);

    return { totalItems, totalQty, totalValue };
  }, [data]);

  const summaryRows = useMemo(
    () => [
      { label: 'Tanggal Pickup', value: data?.date_pickup ? moment(data.date_pickup).format('DD MMMM YYYY') : '-', icon: <Calendar size={18} /> },
      { label: 'Pickup By', value: data?.pickup_by || '-', icon: <ArchiveBook size={18} /> },
      { label: 'Accepted By', value: data?.acceptedby?.nama_lengkap || '-', icon: <Profile2User size={18} /> },
      { label: 'Gudang Transit', value: data?.gudang ? `${data.gudang.kode} - ${data.gudang.nama}` : '-', icon: <Location size={18} /> },
      { label: 'Prioritas', value: data?.prioritas || '-', icon: <Box1 size={18} /> },
      { label: 'Kategori', value: data?.ctg || '-', icon: <Box1 size={18} /> }
    ],
    [data]
  );

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await axiosServices.post(`/scm/pickup-order/${id}/destroy`);
      openNotification({
        open: true,
        title: 'success',
        message: 'Pickup Order berhasil dihapus...',
        alert: { color: 'success' }
      });
      router.push('/pickup-order');
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.diagnostic?.error || error?.message || 'Pickup Order gagal dihapus...',
        alert: { color: 'error' }
      });
    } finally {
      setIsDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Detail Pickup Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/pickup-order'} />} content>
        <AlertNotification />
        {dataLoading || !data ? (
          <div>loading...</div>
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
                    Pickup Order
                  </Typography>
                  <Typography variant="h3">{data.kode}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                    {data.keterangan || 'Tidak ada keterangan pickup.'}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`Prioritas ${data.prioritas}`} color="warning" variant="filled" />
                    <Chip label={data.ctg || '-'} color="default" variant="filled" />
                    <Chip label={data.gudang?.nama || 'Tanpa gudang transit'} color="default" variant="filled" />
                  </Stack>
                </Stack>
                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                  <Button variant="contained" color="error" startIcon={<Trash />} onClick={() => setOpenDeleteDialog(true)}>
                    Delete Pickup
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <MetricCard title="Total Item" value={stats.totalItems} helper="Baris item pickup aktif" />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard title="Total Qty" value={stats.totalQty} helper="Akumulasi qty pickup" />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard title="Estimasi Nilai" value={Number(stats.totalValue || 0).toLocaleString('id-ID')} helper="Akumulasi harga item" />
              </Grid>
            </Grid>

            <MainCard content={false} title={<Typography>Ringkasan Pickup</Typography>}>
              <Grid container spacing={2.5} sx={{ p: 2.5 }}>
                {summaryRows.map((item) => (
                  <Grid item xs={12} md={6} key={item.label}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                        <Box sx={{ color: 'secondary.main', display: 'flex' }}>{item.icon}</Box>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={600}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </MainCard>

            <MainCard content={false} title={<Typography>Items Pickup</Typography>}>
              <ScrollX>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Referensi</TableCell>
                      <TableCell>Barang</TableCell>
                      <TableCell>Pemasok</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Harga</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.items || []).map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={700}>
                              {item.reff_po || item.reff_pd || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID Item #{item.id}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{item.keterangan}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.barang?.kode || '-'} {item.barang?.num_part ? `• ${item.barang.num_part}` : ''}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{item.nm_pemasok}</TableCell>
                        <TableCell align="right">{item.qty_pickup} {item.satuan}</TableCell>
                        <TableCell align="right">Rp {Number(item.harga || 0).toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollX>
            </MainCard>
          </Stack>
        )}

        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Pickup Order?</DialogTitle>
          <DialogContent>
            <Stack spacing={1}>
              <Typography variant="body2">Tindakan ini akan menghapus pickup order dan me-rollback status pickup pada item delivery order terkait.</Typography>
              <Divider />
              <Typography variant="caption" color="text.secondary">Pickup Order: {data?.kode || '-'}</Typography>
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

function MetricCard({ title, value, helper }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2.5, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {helper}
      </Typography>
    </Box>
  );
}
