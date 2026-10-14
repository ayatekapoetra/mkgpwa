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
import { STATUSES, PLAN_STATUS_LABELS, normalizeDetail } from './utils';
import { convertDailyActivityPlan, deleteDailyActivityPlan } from 'api/daily-activity-plan';

const value = (input) => input || '-';

export default function DailyActivityDetail({ id, planView = false }) {
  const basePath = planView ? '/daily-activity-plan' : '/daily-activity';
  const router = useRouter();
  const { permissions, accessLoading, accessError } = useDailyActivityAccess();
  const { data, dataLoading, dataError, mutate } = useDailyActivity(id, permissions.read);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { header, items } = normalizeDetail(data);
  const planning = !!header.is_plan && header.plan_status === 'PLANNING';

  const realizePlan = async () => {
    if (!window.confirm('Realisasikan rencana menjadi aktual dengan data dan ID yang sama?')) return;
    setDeleting(true);
    try {
      await convertDailyActivityPlan(id, { plan_version: header.plan_version });
      await mutate();
      openNotification({ message: 'Rencana berhasil direalisasikan', type: 'success' });
    } catch (error) {
      openNotification({ message: error?.message || 'Realisasi gagal', type: 'error' });
    } finally { setDeleting(false); }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      if (header.is_plan) await deleteDailyActivityPlan(id, header.plan_version);
      else await deleteDailyActivity(id);
      openNotification({ message: 'Daily activity berhasil dihapus', type: 'success' });
      router.push(basePath);
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
      <Breadcrumbs custom heading={planView ? 'Detail Daily Activity Plan' : 'Detail Daily Activity'} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: planView ? 'Daily Activity Plan' : 'Daily Activity', to: basePath }, { title: 'Detail' }]} />
      <Stack direction="row" gap={1} sx={{ mb: 2 }}><Chip label={header.is_plan ? 'Rencana' : 'Aktual'} color={header.is_plan ? 'info' : 'success'} />{header.plan_status && <Chip label={PLAN_STATUS_LABELS[header.plan_status] || header.plan_status} />}</Stack>
      <MainCard title={`${moment(header.date_ops).format('DD MMMM YYYY')} - Shift ${Number(header.shift_id) === 1 ? 'Siang' : 'Malam'}`} secondary={<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {planView && planning && permissions.update && <Button component={Link} href={`${basePath}/${id}/edit`} variant="outlined">Edit Rencana</Button>}
        {planView && planning && permissions.update && permissions.insert && <><Button disabled={deleting} onClick={realizePlan} variant="contained">Realisasi Langsung</Button><Button component={Link} href={`${basePath}/${id}/realize`} variant="outlined">Isi Form Aktual</Button></>}
        {!header.is_plan && permissions.update && <Button component={Link} href={`/daily-activity/${id}/edit`} variant="outlined">Edit Aktual</Button>}
        {permissions.remove && (planning || (!planView && !header.is_plan)) && <Button color="error" variant="outlined" disabled={deleting} onClick={() => setConfirmDelete(true)}>Hapus Header</Button>}
      </Stack>}>
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
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}><DialogTitle>Hapus {header.is_plan ? 'Rencana' : 'Daily Activity'}?</DialogTitle><DialogContent>Header dan seluruh detail akan dinonaktifkan. Histori audit tetap tersedia.</DialogContent><DialogActions><Button onClick={() => setConfirmDelete(false)}>Batal</Button><Button color="error" variant="contained" disabled={deleting} onClick={remove}>{deleting ? 'Menghapus...' : 'Hapus'}</Button></DialogActions></Dialog>
    </>
  );
}
