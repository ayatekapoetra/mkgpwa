'use client';

import { Fragment } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { ArchiveBook, Calendar, Location, Profile2User } from 'iconsax-react';
import { useParams } from 'next/navigation';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import ScrollX from 'components/ScrollX';
import { APP_DEFAULT_PATH } from 'config';

import { useShowGoodsReceipt } from 'api/goods-receipt';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Terima Barang', to: '/goods-receipt' },
  { title: 'Detail' }
];

export default function GoodsReceiptShowScreen() {
  const { id } = useParams();
  const { data, dataLoading, dataError } = useShowGoodsReceipt(id);

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Detail Terima Barang'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/goods-receipt'} />} content>
        {dataError ? (
          <Alert severity="warning">Data penerimaan tidak dapat dimuat.</Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : !data ? (
          <Alert severity="info">Data penerimaan tidak ditemukan.</Alert>
        ) : (
          <Stack spacing={3}>
            <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: 'secondary.200', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Typography variant="overline" color="text.secondary">Terima Barang</Typography>
                  <Typography variant="h3">{data.reff_rcp}</Typography>
                  <Typography variant="body1" color="text.secondary">{data.narasi || 'Tidak ada narasi.'}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`SJ: ${data.kode_sj || '-'}`} color="default" variant="filled" />
                    <Chip label={data.shipping_order?.status === 'received' ? 'Shipping Received' : 'Shipping Pending'} color={data.shipping_order?.status === 'received' ? 'success' : 'warning'} variant="filled" />
                  </Stack>
                </Stack>
              </Stack>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>Data Dokumen</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    <InfoRow icon={<Calendar size={18} />} label="Tanggal" value={data.receivedDateLabel || '-'} />
                    <InfoRow icon={<ArchiveBook size={18} />} label="Receipt" value={data.reff_rcp || '-'} />
                    <InfoRow icon={<ArchiveBook size={18} />} label="Surat Jalan" value={data.kode_sj || '-'} />
                    <InfoRow icon={<ArchiveBook size={18} />} label="Shipping" value={data.shipping_order?.kode || '-'} />
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" color="error" gutterBottom>Data Gudang</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    <InfoRow icon={<Location size={18} />} label="Gudang" value={data.gudang?.nama || data.gudang_id || '-'} />
                    <InfoRow icon={<Profile2User size={18} />} label="Penerima" value={data.author?.nama_lengkap || data.receivedby || '-'} />
                    <InfoRow icon={<ArchiveBook size={18} />} label="Narasi" value={data.narasi || '-'} />
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            <MainCard content={false} title={<Typography>Items Penerimaan</Typography>}>
              <ScrollX>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Barang</TableCell>
                      <TableCell>Pemasok</TableCell>
                      <TableCell>Rack</TableCell>
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
                            <Typography variant="body2">{item.barang?.kode || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.barang?.nama || item.description || '-'}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{item.pemasok?.nama || '-'}</TableCell>
                        <TableCell>{item.rack?.kode ? `${item.rack.kode} - ${item.rack.nama || '-'}` : '-'}</TableCell>
                        <TableCell align="right">{item.qty} {item.uom}</TableCell>
                        <TableCell align="right">{item.harga}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollX>
            </MainCard>
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'secondary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Stack>
  );
}
