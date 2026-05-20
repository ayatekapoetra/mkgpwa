'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import moment from 'moment';
import 'moment/locale/id';
import { PresentionChart, TruckFast, Timer1, Calendar1, HierarchySquare3, Box1, Warning2 } from 'iconsax-react';

import FleetPerformanceChart from './FleetPerformanceChart';
import { useGetProduksiPitCircleTimeMonitoring } from 'api/produksi-pit-circle-time-monitoring';

moment.locale('id');

const SummaryChip = ({ icon, title, value, subtitle, accent = '#2563eb' }) => (
  <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, height: '100%' }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Stack alignItems="center" justifyContent="center" sx={{ width: 30, height: 30, borderRadius: '999px', bgcolor: `${accent}22`, color: accent }}>
        {icon}
      </Stack>
      <Stack spacing={0.3}>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{title}</div>
        {/* {subtitle ? <div style={{ fontSize: 12, color: '#475569' }}>{subtitle}</div> : null} */}
      </Stack>
    </Stack>
  </Paper>
);

export default function ProduksiPitCircleTimeMonitoringScreen() {
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: moment().add(-2, 'day').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [appliedDateRange, setAppliedDateRange] = useState({
    start: moment().add(-2, 'day').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });

  const params = useMemo(() => ({
    start_date: appliedDateRange.start,
    end_date: appliedDateRange.end,
    min_valid_trips: 5,
    // status: 'PRODUKSI'
  }), [appliedDateRange.end, appliedDateRange.start]);

  const { fleets, loading, error } = useGetProduksiPitCircleTimeMonitoring(params);

  const sortedFleets = useMemo(() => {
    return [...fleets].sort((a, b) => {
      const dateA = moment(a.date_ops);
      const dateB = moment(b.date_ops);

      if (dateA.isValid() && dateB.isValid() && !dateA.isSame(dateB)) {
        return dateB.valueOf() - dateA.valueOf();
      }

      if (Number(a.shift_id || 0) !== Number(b.shift_id || 0)) {
        return Number(a.shift_id || 0) - Number(b.shift_id || 0);
      }

      const pitCompare = String(a.startpit_name || '').localeCompare(String(b.startpit_name || ''));
      if (pitCompare !== 0) return pitCompare;

      const excavatorCompare = String(a.excavator_kode || '').localeCompare(String(b.excavator_kode || ''));
      if (excavatorCompare !== 0) return excavatorCompare;

      return String(a.material_name || '').localeCompare(String(b.material_name || ''));
    });
  }, [fleets]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [clock]);

  const handleApplyFilter = () => {
    setAppliedDateRange(dateRange);
  };

  return (
    <Stack sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Stack>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Produksi Pit & Circle Time Monitoring</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.95rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #d4d4d8', background: '#f5f5f5', fontWeight: 600 }} />
          <span>to</span>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #d4d4d8', background: '#f5f5f5', fontWeight: 600 }} />
          <button onClick={handleApplyFilter} style={{ padding: '10px 18px', minWidth: 120, borderRadius: '12px', border: 'none', background: '#3862f0', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          <button
            onClick={() => setIsSlideshow((prev) => !prev)}
            style={{ padding: '10px 18px', minWidth: 120, borderRadius: '12px', border: '1px solid #111827', background: isSlideshow ? '#111827' : 'white', color: isSlideshow ? 'white' : '#111827', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PresentionChart size={18} variant="Bold" />
            {isSlideshow ? 'Stop' : 'Start'}
          </button>
        </Stack>
      </Stack>

      <Paper sx={{ flex: 1, p: 2, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
        {error ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <h3 style={{ marginTop: 0 }}>Gagal memuat monitoring produksi pit</h3>
            <p style={{ marginBottom: 0 }}>Periksa endpoint backend circle time monitoring atau filter tanggal yang digunakan.</p>
          </Paper>
        ) : loading ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <h3 style={{ marginTop: 0 }}>Memuat data fleet...</h3>
            <p style={{ marginBottom: 0 }}>Mengambil data ritase pit dan menghitung circle time dumptruck.</p>
          </Paper>
        ) : !sortedFleets.length ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <h3 style={{ marginTop: 0 }}>Belum ada data fleet</h3>
            <p style={{ marginBottom: 0 }}>Tidak ditemukan data ritase pit produksi untuk filter tanggal yang dipilih.</p>
          </Paper>
        ) : (
        <Grid container spacing={1}>
          {sortedFleets.map((fleet) => (
            <Grid item xs={12} lg={6} key={fleet.fleet_key}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'white' }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.2 }}>{moment(fleet.date_ops).format('dddd, DD MMMM YYYY')}</h3>
                  </Stack>

                  <Grid container>
                    <Grid item xs={12} md={3.5}>
                      <Paper variant="outlined" sx={{ p: 1, mr: 1, borderRadius: 2, height: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Total Ritase</div>
                        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 0.8 }}>{fleet.total_ritase}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{fleet.material_name}</div>
                        <div style={{ fontSize: 14 }}>{fleet.startpit_name}</div>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={8.5}>
                      <Grid container spacing={1}>
                        <Grid item xs={6} md={4}>
                          <SummaryChip icon={<TruckFast size={18} />} title="Dumptruck" value={fleet.total_dumptruck} subtitle="Unit aktif" accent="#7c3aed" />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <SummaryChip icon={<Box1 size={18} />} title="Material" value={fleet.material_name} subtitle="Jenis material" accent="#0ea5e9" />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <SummaryChip icon={<Timer1 size={18} />} title="Efektif Unit" value={fleet.effective_dumptrucks} subtitle="Di bawah avg fleet" accent="#2563eb" />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <SummaryChip icon={<Calendar1 size={18} />} title="Jadwal Shift" value={fleet.shift_name} subtitle="Shift operasional" accent="#f59e0b" />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <SummaryChip icon={<HierarchySquare3 size={18} />} title="Fleet Kerja" value={fleet.excavator_kode} subtitle="Excavator layanan" accent="#1d4ed8" />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <SummaryChip icon={<Warning2 size={18} />} title="Avg CircleTime" value={`${fleet.avg_circle_time_minutes} Menit`} subtitle="Benchmark fleet" accent="#dc2626" />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <div style={{ fontWeight: 700 }}>Performa Dumptruck per Fleet</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Bar = ritase, line = avg circle time</div>
                      </Stack>
                      <div style={{ height: 280 }}>
                        <FleetPerformanceChart dumptrucks={fleet.dumptrucks} averageFleetCircleTime={fleet.avg_circle_time_minutes} />
                      </div>
                    </Stack>
                  </Paper>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
        )}
      </Paper>
    </Stack>
  );
}
