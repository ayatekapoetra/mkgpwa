'use client';
import { Fragment, useState } from 'react';
import { Stack, TextField, TableRow, TableCell } from '@mui/material';
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionPenyewa from 'components/OptionPenyewa';
import { useGetLaporanHarianPelanggan } from 'api/laporan-ritase';
import { SimpleTable, StateBlock, daysBetween, fmt } from './shared';

const links = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Laporan Harian Pelanggan', to: '/laporan-harian-pelanggan' }];
const today = () => new Date().toISOString().slice(0, 10);
const G = [['ni', 'Ni'], ['fe', 'Fe'], ['mgo', 'MgO'], ['sio2', 'SiO2'], ['al2o3', 'Al2O3'], ['mc', 'MC']];

export default function LaporanHarianPelangganScreen() {
  const [p, setP] = useState({ bisnis_id: '', penyewa_id: '', start_date: today(), end_date: today() });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const rangeOk = p.start_date && p.end_date && p.end_date >= p.start_date && daysBetween(p.start_date, p.end_date) <= 93;
  const ready = Boolean(p.bisnis_id && p.penyewa_id && rangeOk);
  const { rows, total, loading, error } = useGetLaporanHarianPelanggan(p, ready);

  const columns = [
    { key: 'date_ops', label: 'Tanggal' }, { key: 'material_nama', label: 'Material' },
    { key: 'ritase', label: 'Rit', align: 'right', render: (r) => fmt(r.ritase, 0) },
    { key: 'wmt', label: 'WMT', align: 'right', render: (r) => fmt(r.wmt) },
    { key: 'bcm', label: 'BCM', align: 'right', render: (r) => fmt(r.bcm) },
    ...G.map(([k, l]) => ({ key: k, label: l, align: 'right', render: (r) => fmt(r.grade?.[k], 2) })),
    { key: 'graded_wmt_pct', label: '% WMT berkadar', align: 'right', render: (r) => fmt(r.graded_wmt_pct, 1) }
  ];
  const footer = total ? (
    <TableRow sx={{ '& td': { fontWeight: 700 } }}>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell align="right">{fmt(total.ritase, 0)}</TableCell>
      <TableCell align="right">{fmt(total.wmt)}</TableCell>
      <TableCell align="right">{fmt(total.bcm)}</TableCell>
      {G.map(([k]) => <TableCell key={k} align="right">{fmt(total.grade?.[k], 2)}</TableCell>)}
      <TableCell align="right">{fmt(total.graded_wmt_pct, 1)}</TableCell>
    </TableRow>
  ) : null;

  return (
    <Fragment>
      <Breadcrumbs custom heading="Laporan Harian per Pelanggan" links={links} />
      <MainCard>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <OptionBisnisUnit name="bisnis_id" value={p.bisnis_id} setFieldValue={set} />
          <OptionPenyewa name="penyewa_id" value={p.penyewa_id} setFieldValue={set} />
          <TextField type="date" label="Dari" InputLabelProps={{ shrink: true }} value={p.start_date} onChange={(e) => set('start_date', e.target.value)} />
          <TextField type="date" label="Sampai" InputLabelProps={{ shrink: true }} value={p.end_date} onChange={(e) => set('end_date', e.target.value)}
            error={!rangeOk} helperText={!rangeOk ? 'Maksimal 93 hari, akhir ≥ awal' : ''} />
        </Stack>
        {!ready && <Stack color="text.secondary">Pilih unit bisnis, pelanggan, dan rentang tanggal.</Stack>}
        {ready && <StateBlock loading={loading} error={error} empty={!loading && !error && rows.length === 0} />}
        {ready && !error && rows.length > 0 && <SimpleTable columns={columns} rows={rows} rowKey="__k" footer={footer} />}
      </MainCard>
    </Fragment>
  );
}
