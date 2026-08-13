'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Typography
} from '@mui/material';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { deleteDailyActivity, useDailyActivity, useDailyActivityAccess } from 'api/daily-activity';
import { openNotification } from 'api/notification';
import { STATUSES, normalizeDetail } from './utils';

const value = (input) => input || '-';

export default function DailyActivityDetail({ id }) {
  const router = useRouter();
  const { permissions, accessLoading, accessError } = useDailyActivityAccess();
  const { data, dataLoading, dataError } = useDailyActivity(id, permissions.read);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { header, items } = normalizeDetail(data);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteDailyActivity(id);
      openNotification({ message: 'Daily activity berhasil dihapus', type: 'success' });
      router.push('/daily-activity');
      router.refresh();
    } catch (error) {
      openNotification({ message: error?.diagnostic?.message || error?.message || 'Gagal menghapus daily activity', type: 'error' });
    } finally { setDeleting(false); }
  };

  if (accessLoading || dataLoading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;
  if (accessError || dataError) return <Alert severity="error">Gagal memuat detail daily activity.</Alert>;
  if (!permissions.read) return <Alert severity="warning">Anda tidak memiliki akses membaca Daily Activity.</Alert>;

  return (
    <>
      <Breadcrumbs custom heading="Detail Daily Activity" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Daily Activity', to: '/daily-activity' }, { title: 'Detail' }]} />
      <MainCard title={`${moment(header.date_ops).format('DD MMMM YYYY')} - Shift ${Number(header.shift_id) === 1 ? 'Siang' : 'Malam'}`} secondary={<Stack direction="row" spacing={1}>{permissions.update && <Button component={Link} href={`/daily-activity/${id}/edit`} variant="outlined">Edit</Button>}{permissions.remove && <Button color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>Hapus Header</Button>}</Stack>}>
        <Grid container spacing={2}>
          {[['Site', header.lokasi_site_nama], ['Pit', header.lokasi_pit_nama], ['Kontraktor', header.kontraktor], ['Cuaca', header.cuaca], ['Kategori', header.category_id], ['Kategori Unit', header.ctgunit]].map(([label, item]) => <Grid item xs={6} md={2} key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value(item)}</Typography></Grid>)}
          <Grid item xs={12}><Typography variant="caption" color="text.secondary">Catatan Umum</Typography><Typography>{value(header.notes)}</Typography></Grid>
        </Grid>
      </MainCard>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {STATUSES.map((status) => {
          const statusItems = items.filter((item) => String(item.status || '').toLowerCase() === status.id);
          if (!statusItems.length) return null;
          return <MainCard key={status.id} title={<Stack direction="row" spacing={1} alignItems="center"><Chip label={status.label} color={status.color} /><Typography variant="subtitle2">{statusItems.length} unit</Typography></Stack>} content={false}><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Unit</TableCell><TableCell>Waktu</TableCell><TableCell>Kegiatan / Material</TableCell><TableCell>Operator</TableCell>{status.id === 'breakdown' && <TableCell>Breakdown</TableCell>}<TableCell>Catatan</TableCell></TableRow></TableHead><TableBody>{statusItems.map((item, index) => <TableRow key={item.item_id || item.id || index}><TableCell><Typography fontWeight={700}>{value(item.kdunit)}</Typography><Typography variant="caption">Seq {value(item.sequence)}</Typography></TableCell><TableCell>{item.start_time ? moment(item.start_time).format('DD/MM HH:mm') : '-'}<br />{item.finish_time ? moment(item.finish_time).format('DD/MM HH:mm') : '-'}</TableCell><TableCell>{value(item.kegiatan_name)}<Typography variant="caption" display="block">{value(item.material_name)}</Typography></TableCell><TableCell>{value(item.karyawan_name)}</TableCell>{status.id === 'breakdown' && <TableCell>HM/KM: {value(item.hm_km_bd)}<Typography variant="caption" display="block">{value(item.issue_breakdown)}</Typography><Typography variant="caption" display="block">Pengawas: {value(item.pengawas_name)}</Typography></TableCell>}<TableCell>{value(item.note)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></MainCard>;
        })}
      </Stack>
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}><DialogTitle>Hapus Daily Activity?</DialogTitle><DialogContent>Seluruh status dan unit pada header ini akan dihapus permanen.</DialogContent><DialogActions><Button onClick={() => setConfirmDelete(false)}>Batal</Button><Button color="error" variant="contained" disabled={deleting} onClick={remove}>{deleting ? 'Menghapus...' : 'Hapus'}</Button></DialogActions></Dialog>
    </>
  );
}
