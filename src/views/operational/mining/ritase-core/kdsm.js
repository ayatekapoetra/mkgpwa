'use client';
import { Fragment, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField, Chip } from '@mui/material';
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionCabang from 'components/OptionCabang';
import OptionLokasiPit from 'components/OptionLokasiPit';
import OptionMaterialMining from 'components/OptionMaterialMining';
import { useGetPitKdsm, createPitKdsm, updatePitKdsm, updatePitKdsmStatus } from 'api/pit-kdsm';
import { KDSM_STATUS, SimpleTable, StateBlock, Banner, useSubmit } from './shared';

const links = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Master KDSM', to: '/master-kdsm' }];
const EMPTY = { kode: '', date_ops: '', bisnis_id: '', penyewa_id: '', cabang_id: '', startpit_id: '', seq: '', material_id: '', ni_nitton: '', fe_nitton: '', status: 'BELUM_DIHAULING' };

function toBody(f, isEdit) {
  const b = { ...f };
  ['bisnis_id', 'penyewa_id', 'cabang_id', 'startpit_id', 'material_id'].forEach((k) => { b[k] = b[k] === '' ? undefined : Number(b[k]); });
  ['ni_nitton', 'fe_nitton'].forEach((k) => { b[k] = b[k] === '' ? null : Number(b[k]); });
  if (isEdit) delete b.status; // status diubah lewat aksi khusus
  return b;
}

function KdsmForm({ open, row, onClose, onSaved }) {
  const isEdit = Boolean(row?.id);
  const [f, setF] = useState(() => ({ ...EMPTY, ...(row || {}) }));
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const { busy, error, run } = useSubmit(async () => {
    if (isEdit) await updatePitKdsm(row.id, toBody(f, true)); else await createPitKdsm(toBody(f, false));
    onSaved();
  });
  const valid = f.kode && f.date_ops && f.bisnis_id && f.penyewa_id && f.cabang_id && f.startpit_id && f.seq && f.material_id;
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Ubah KDSM' : 'Tambah KDSM'}</DialogTitle>
      <DialogContent>
        <Banner error={error} />
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Kode KDSM" value={f.kode} onChange={set('kode')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required type="date" label="Tanggal" InputLabelProps={{ shrink: true }} value={f.date_ops} onChange={set('date_ops')} /></Grid>
          <Grid item xs={12} sm={6}><OptionBisnisUnit name="bisnis_id" value={f.bisnis_id} setFieldValue={setField} /></Grid>
          <Grid item xs={12} sm={6}><OptionCabang name="cabang_id" value={f.cabang_id} setFieldValue={setField} /></Grid>
          <Grid item xs={12} sm={6}><OptionPenyewa name="penyewa_id" value={f.penyewa_id} setFieldValue={setField} /></Grid>
          <Grid item xs={12} sm={6}><OptionLokasiPit name="startpit_id" label="PIT" value={f.startpit_id} setFieldValue={setField} /></Grid>
          <Grid item xs={12} sm={6}><OptionMaterialMining name="material_id" value={f.material_id} setFieldValue={setField} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Seq" value={f.seq} onChange={set('seq')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Ni Nitton" inputProps={{ step: '0.01', min: 0, max: 100 }} value={f.ni_nitton ?? ''} onChange={set('ni_nitton')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Fe Nitton" inputProps={{ step: '0.01', min: 0, max: 100 }} value={f.fe_nitton ?? ''} onChange={set('fe_nitton')} /></Grid>
          {!isEdit && (
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Status" value={f.status} onChange={set('status')}>
                {KDSM_STATUS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Batal</Button>
        <Button variant="contained" onClick={run} disabled={busy || !valid}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MasterKdsmScreen() {
  const [params, setParams] = useState({ page: 1, perPage: 25, bisnis_id: '', penyewa_id: '', startpit_id: '', status: '', q: '' });
  const [form, setForm] = useState(null);
  const [statusErr, setStatusErr] = useState('');
  const { rows, total, page, perPage, loading, error, refresh } = useGetPitKdsm(params);
  const setP = (k, v) => setParams((p) => ({ ...p, [k]: v, page: 1 }));

  const changeStatus = async (row, status) => {
    setStatusErr('');
    try { await updatePitKdsmStatus(row.id, status); refresh(); } catch (e) { setStatusErr(e.code ? `${e.code}: ${e.message}` : e.message); }
  };

  const columns = [
    { key: 'kode', label: 'Kode' }, { key: 'date_ops', label: 'Tanggal' }, { key: 'penyewa_abbr', label: 'Pelanggan' },
    { key: 'startpit_nama', label: 'PIT' }, { key: 'seq', label: 'Seq' },
    { key: 'status', label: 'Status', render: (r) => (
      <TextField select size="small" value={r.status || ''} onChange={(e) => changeStatus(r, e.target.value)} sx={{ minWidth: 160 }} inputProps={{ 'aria-label': `Status ${r.kode}` }}>
        {KDSM_STATUS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>) },
    { key: 'ritase_rekap', label: 'Rit Rekap', align: 'right' },
    { key: 'ritase_ore_transport', label: 'Rit Ore Transport', align: 'right' },
    { key: 'selisih', label: 'Selisih', align: 'right', render: (r) => <Chip size="small" color={Number(r.selisih) === 0 ? 'success' : 'warning'} label={r.selisih ?? '-'} /> },
    { key: 'aksi', label: '', render: (r) => <Button size="small" onClick={() => setForm(r)}>Ubah</Button> }
  ];

  return (
    <Fragment>
      <Breadcrumbs custom heading="Master KDSM" links={links} />
      <MainCard title={<Button variant="contained" onClick={() => setForm({})}>Tambah KDSM</Button>}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <OptionBisnisUnit name="bisnis_id" value={params.bisnis_id} setFieldValue={(k, v) => setP(k, v)} />
          <OptionPenyewa name="penyewa_id" value={params.penyewa_id} setFieldValue={(k, v) => setP(k, v)} />
          <OptionLokasiPit name="startpit_id" label="PIT" value={params.startpit_id} setFieldValue={(k, v) => setP(k, v)} />
          <TextField select label="Status" value={params.status} onChange={(e) => setP('status', e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">Semua</MenuItem>
            {KDSM_STATUS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Cari kode" value={params.q} onChange={(e) => setP('q', e.target.value)} />
        </Stack>
        <Banner error={statusErr} />
        <StateBlock loading={loading} error={error} empty={!loading && !error && rows.length === 0} />
        {!error && rows.length > 0 && <SimpleTable columns={columns} rows={rows} total={total} page={page} perPage={perPage} onPage={(p) => setParams((s) => ({ ...s, page: p }))} />}
      </MainCard>
      {form && <KdsmForm key={form.id || 'new'} open row={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />}
    </Fragment>
  );
}
