'use client';
import { Fragment, useState } from 'react';
import { Button, Grid, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useGetPitKdsm } from 'api/pit-kdsm';
import { useGetAssay, createAssay } from 'api/assay';
import { ASSAY_FIELDS, SimpleTable, StateBlock, Banner, useSubmit, inRange0to100 } from './shared';

const links = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Input Kadar', to: '/input-kadar' }];
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { target_type: 'KDSM', kdsm_id: '', dom_id: '', lot_no: '', source: 'LAB', sample_date: today(), ni: '', fe: '', mgo: '', sio2: '', al2o3: '', mc: '', remarks: '' };

export default function InputKadarScreen() {
  const [f, setF] = useState(EMPTY);
  const [ok, setOk] = useState('');
  const [page, setPage] = useState(1);
  const { rows: kdsmRows } = useGetPitKdsm({ perPage: 200 });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const histParams = { target_type: f.target_type, source: '', page, perPage: 25, ...(f.target_type === 'KDSM' ? { kdsm_id: f.kdsm_id } : { dom_id: f.dom_id }) };
  const hasTarget = f.target_type === 'KDSM' ? Boolean(f.kdsm_id) : Boolean(f.dom_id);
  const { rows, total, perPage, loading, error, refresh } = useGetAssay(histParams, hasTarget);

  const bad = ASSAY_FIELDS.filter(([k]) => !inRange0to100(f[k])).map(([, l]) => l);
  const valid = hasTarget && f.sample_date && bad.length === 0;

  const { busy, error: err, run } = useSubmit(async () => {
    setOk('');
    const body = { target_type: f.target_type, kdsm_id: f.target_type === 'KDSM' ? Number(f.kdsm_id) : null, dom_id: f.target_type === 'DOM' ? f.dom_id : null,
      lot_no: f.target_type === 'DOM' && f.lot_no ? f.lot_no : null, source: f.source, sample_date: f.sample_date, remarks: f.remarks };
    ASSAY_FIELDS.forEach(([k]) => { body[k] = f[k] === '' ? null : Number(f[k]); });
    await createAssay(body);
    setOk('Hasil kadar tersimpan');
    setF((p) => ({ ...p, ni: '', fe: '', mgo: '', sio2: '', al2o3: '', mc: '', remarks: '' }));
    refresh();
  });

  const columns = [
    { key: 'sample_date', label: 'Tanggal' }, { key: 'source', label: 'Sumber' }, { key: 'lot_no', label: 'LOT' },
    ...ASSAY_FIELDS.map(([k, l]) => ({ key: k, label: l, align: 'right' })), { key: 'remarks', label: 'Remarks' }
  ];

  return (
    <Fragment>
      <Breadcrumbs custom heading="Input Kadar" links={links} />
      <MainCard>
        <Banner error={err} />
        {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ToggleButtonGroup exclusive value={f.target_type} onChange={(_e, v) => v && setF((p) => ({ ...p, target_type: v, kdsm_id: '', dom_id: '', lot_no: '' }))} aria-label="Target kadar">
              <ToggleButton value="KDSM">KDSM</ToggleButton>
              <ToggleButton value="DOM">DOM / LOT</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          {f.target_type === 'KDSM' ? (
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="KDSM" value={f.kdsm_id} onChange={set('kdsm_id')}>
                {kdsmRows.map((k) => <MenuItem key={k.id} value={k.id}>{k.kode}</MenuItem>)}
              </TextField>
            </Grid>
          ) : (
            <Fragment>
              <Grid item xs={12} sm={4}><TextField fullWidth required label="Kode DOM" value={f.dom_id} onChange={set('dom_id')} /></Grid>
              <Grid item xs={12} sm={2}><TextField fullWidth label="LOT" value={f.lot_no} onChange={set('lot_no')} /></Grid>
            </Fragment>
          )}
          <Grid item xs={6} sm={3}>
            <TextField select fullWidth label="Sumber" value={f.source} onChange={set('source')}>
              <MenuItem value="NITTON">NITTON</MenuItem><MenuItem value="LAB">LAB</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth required type="date" label="Tanggal sampel" InputLabelProps={{ shrink: true }} value={f.sample_date} onChange={set('sample_date')} /></Grid>
          {ASSAY_FIELDS.map(([k, l]) => (
            <Grid item xs={6} sm={2} key={k}>
              <TextField fullWidth type="number" label={`${l} (%)`} inputProps={{ min: 0, max: 100, step: '0.001' }} value={f[k]} onChange={set(k)}
                error={!inRange0to100(f[k])} helperText={!inRange0to100(f[k]) ? '0–100' : ''} />
            </Grid>
          ))}
          <Grid item xs={12}><TextField fullWidth label="Remarks" value={f.remarks} onChange={set('remarks')} /></Grid>
          <Grid item xs={12}><Button variant="contained" onClick={run} disabled={busy || !valid}>{busy ? 'Menyimpan...' : 'Simpan Kadar'}</Button></Grid>
        </Grid>
      </MainCard>
      <MainCard title="Riwayat per target" sx={{ mt: 2 }}>
        {!hasTarget && <Stack>Pilih target untuk melihat riwayat.</Stack>}
        {hasTarget && <StateBlock loading={loading} error={error} empty={!loading && !error && rows.length === 0} />}
        {hasTarget && !error && rows.length > 0 && <SimpleTable columns={columns} rows={rows} total={total} page={page} perPage={perPage} onPage={setPage} />}
      </MainCard>
    </Fragment>
  );
}
