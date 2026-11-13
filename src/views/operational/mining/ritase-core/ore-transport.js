'use client';
import { Fragment, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField } from '@mui/material';
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionShiftKerja from 'components/OptionShiftKerja';
import OptionLokasiPit from 'components/OptionLokasiPit';
import { useGetPitKdsm } from 'api/pit-kdsm';
import { useGetOreTransport, createOreTransport, updateOreTransport, deleteOreTransport } from 'api/ore-transport';
import { KDSM_STATUS, SimpleTable, StateBlock, Banner, useSubmit, daysBetween, fmt } from './shared';

const links = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Ore Transport', to: '/ore-transport' }];
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { kdsm_id: '', date_ops: today(), jam_hauling: '', shift_id: '', ritase: '', tf_ton: '', stockpile_id: '', dom_id: '', lot_no: '', pic_name: '', ni_sp: '', fe_sp: '', remarks: '', status_kdsm_setelah: 'SISA' };
const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));

function toBody(f) {
  return {
    kdsm_id: num(f.kdsm_id), date_ops: f.date_ops, jam_hauling: f.jam_hauling ? (f.jam_hauling.length === 5 ? `${f.jam_hauling}:00` : f.jam_hauling) : undefined,
    shift_id: num(f.shift_id), ritase: num(f.ritase), tf_ton: num(f.tf_ton), stockpile_id: num(f.stockpile_id), dom_id: f.dom_id,
    lot_no: f.lot_no || undefined, pic_name: f.pic_name, ni_sp: num(f.ni_sp), fe_sp: num(f.fe_sp), remarks: f.remarks, status_kdsm_setelah: f.status_kdsm_setelah
  };
}

function OreForm({ row, onClose, onSaved }) {
  const isEdit = Boolean(row?.id);
  const [f, setF] = useState({ ...EMPTY, ...(row || {}), jam_hauling: (row?.jam_hauling || '').slice(0, 5) });
  const [saved, setSaved] = useState(null);
  const { rows: kdsmRows } = useGetPitKdsm({ perPage: 200 });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const { busy, error, run } = useSubmit(async () => {
    const res = isEdit ? await updateOreTransport(row.id, toBody(f)) : await createOreTransport(toBody(f));
    setSaved(res);
    onSaved();
  });
  const ritOk = Number.isInteger(Number(f.ritase)) && Number(f.ritase) > 0;
  const lotOk = !f.lot_no || /^\d+(\s*,\s*\d+)*$/.test(f.lot_no);
  const valid = f.kdsm_id && f.date_ops && f.shift_id && ritOk && f.dom_id && f.pic_name && lotOk;
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Ubah Ore Transport' : 'Tambah Ore Transport'}</DialogTitle>
      <DialogContent>
        <Banner error={error} />
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth required label="KDSM" value={f.kdsm_id} onChange={set('kdsm_id')}>
              {kdsmRows.map((k) => <MenuItem key={k.id} value={k.id}>{k.kode} {k.penyewa_abbr ? `- ${k.penyewa_abbr}` : ''}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth required type="date" label="Tanggal" InputLabelProps={{ shrink: true }} value={f.date_ops} onChange={set('date_ops')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="time" label="Jam hauling" InputLabelProps={{ shrink: true }} value={f.jam_hauling} onChange={set('jam_hauling')} /></Grid>
          <Grid item xs={12} sm={4}><OptionShiftKerja name="shift_id" value={f.shift_id} setFieldValue={setField} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth required type="number" label="Ritase" inputProps={{ min: 1, step: 1 }} value={f.ritase} onChange={set('ritase')} error={f.ritase !== '' && !ritOk} helperText={f.ritase !== '' && !ritOk ? 'Bilangan bulat > 0' : ''} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="TF ton (kosong = default sistem)" inputProps={{ min: 0, step: '0.01' }} value={f.tf_ton ?? ''} onChange={set('tf_ton')} /></Grid>
          <Grid item xs={12} sm={6}><OptionLokasiPit name="stockpile_id" label="Stockpile (wajib bila DOM belum punya stockpile)" value={f.stockpile_id} setFieldValue={setField} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Kode DOM" value={f.dom_id} onChange={set('dom_id')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="LOT (mis. 2,3,4,5)" value={f.lot_no ?? ''} onChange={set('lot_no')} error={!lotOk} helperText={!lotOk ? 'Pisahkan angka dengan koma' : ''} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="PIC" value={f.pic_name} onChange={set('pic_name')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Ni SP" inputProps={{ min: 0, max: 100, step: '0.01' }} value={f.ni_sp ?? ''} onChange={set('ni_sp')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Fe SP" inputProps={{ min: 0, max: 100, step: '0.01' }} value={f.fe_sp ?? ''} onChange={set('fe_sp')} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Status KDSM setelah" value={f.status_kdsm_setelah} onChange={set('status_kdsm_setelah')}>
              {KDSM_STATUS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Remarks" value={f.remarks ?? ''} onChange={set('remarks')} /></Grid>
          {saved?.tonase !== undefined && <Grid item xs={12}>Tonase (hitung server): {fmt(saved.tonase)}</Grid>}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Tutup</Button>
        <Button variant="contained" onClick={run} disabled={busy || !valid}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function OreTransportScreen() {
  const [params, setParams] = useState({ page: 1, perPage: 25, start_date: today(), end_date: today(), bisnis_id: '', penyewa_id: '', kdsm_id: '' });
  const [form, setForm] = useState(null);
  const [actErr, setActErr] = useState('');
  const rangeOk = params.start_date && params.end_date && params.end_date >= params.start_date && daysBetween(params.start_date, params.end_date) <= 93;
  const { rows, total, page, perPage, loading, error, refresh } = useGetOreTransport(params, Boolean(rangeOk));
  const { rows: kdsmRows } = useGetPitKdsm({ perPage: 200 });
  const setP = (k, v) => setParams((p) => ({ ...p, [k]: v, page: 1 }));

  const remove = async (r) => {
    if (!window.confirm(`Hapus Ore Transport ${r.kdsm_kode || r.id}?`)) return;
    setActErr('');
    try { await deleteOreTransport(r.id); refresh(); } catch (e) { setActErr(e.code ? `${e.code}: ${e.message}` : e.message); }
  };

  const columns = [
    { key: 'date_ops', label: 'Tanggal' }, { key: 'kdsm_kode', label: 'KDSM' }, { key: 'jam_hauling', label: 'Jam' }, { key: 'shift_id', label: 'Shift' },
    { key: 'ritase', label: 'Rit', align: 'right' }, { key: 'tf_ton', label: 'TF ton', align: 'right', render: (r) => fmt(r.tf_ton) },
    { key: 'tonase', label: 'Tonase', align: 'right', render: (r) => fmt(r.tonase) },
    { key: 'stockpile_nama', label: 'Stockpile' }, { key: 'dom_id', label: 'DOM' }, { key: 'lot_no', label: 'LOT' }, { key: 'pic_name', label: 'PIC' },
    { key: 'ni_sp', label: 'Ni SP', align: 'right' }, { key: 'fe_sp', label: 'Fe SP', align: 'right' }, { key: 'status_kdsm_setelah', label: 'Status' },
    { key: 'aksi', label: '', render: (r) => (<Stack direction="row"><Button size="small" onClick={() => setForm(r)}>Ubah</Button><Button size="small" color="error" onClick={() => remove(r)}>Hapus</Button></Stack>) }
  ];

  return (
    <Fragment>
      <Breadcrumbs custom heading="Ore Transport" links={links} />
      <MainCard title={<Button variant="contained" onClick={() => setForm({})}>Tambah Ore Transport</Button>}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField type="date" label="Dari" InputLabelProps={{ shrink: true }} value={params.start_date} onChange={(e) => setP('start_date', e.target.value)} />
          <TextField type="date" label="Sampai" InputLabelProps={{ shrink: true }} value={params.end_date} onChange={(e) => setP('end_date', e.target.value)}
            error={!rangeOk} helperText={!rangeOk ? 'Rentang maksimal 93 hari, akhir ≥ awal' : ''} />
          <OptionBisnisUnit name="bisnis_id" value={params.bisnis_id} setFieldValue={(k, v) => setP(k, v)} />
          <OptionPenyewa name="penyewa_id" value={params.penyewa_id} setFieldValue={(k, v) => setP(k, v)} />
          <TextField select label="KDSM" value={params.kdsm_id} onChange={(e) => setP('kdsm_id', e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">Semua</MenuItem>
            {kdsmRows.map((k) => <MenuItem key={k.id} value={k.id}>{k.kode}</MenuItem>)}
          </TextField>
        </Stack>
        <Banner error={actErr} />
        <StateBlock loading={loading} error={error} empty={rangeOk && !loading && !error && rows.length === 0} />
        {!error && rows.length > 0 && <SimpleTable columns={columns} rows={rows} total={total} page={page} perPage={perPage} onPage={(p) => setParams((s) => ({ ...s, page: p }))} />}
      </MainCard>
      {form && <OreForm key={form.id || 'new'} row={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => refresh()} />}
    </Fragment>
  );
}
