'use client';

import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';

// MUI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// Charts
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// API
import {
  useAttendanceStatusPerCabang,
  useAttendanceTrendPerMonth,
  useAttendanceOnTimeArea,
  useAttendanceLateVsHadir,
  useAttendanceIzinCutiSakit,
  useAttendanceTopKaryawan,
  useAttendanceTopAlpha,
  useAttendanceAvgHadirCabang,
  useAttendanceStatusMix,
  useAttendanceTotalMarkedCabang
} from 'api/attendance-analytics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const palette = {
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
  purple: '#a855f7',
  teal: '#14b8a6',
  pink: '#ec4899'
};

const statusOrder = ['H', 'L', 'C', 'I', 'S', 'A'];
const statusLabel = {
  H: 'Hadir',
  L: 'Terlambat',
  C: 'Cuti',
  I: 'Izin',
  S: 'Sakit',
  A: 'Absen'
};
const statusColor = {
  H: palette.green,
  L: palette.amber,
  C: palette.blue,
  I: palette.purple,
  S: palette.pink,
  A: palette.red
};

const Section = ({ title, children, loading, minHeight = 360 }) => (
  <Paper
    elevation={1}
    sx={{ p: 2, height: '100%', minHeight, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip label={title} color="primary" size="small" />
      </Stack>
      {loading && <CircularProgress size={18} />}
    </Stack>
    <Box sx={{ flex: 1, minHeight: minHeight - 60 }}>{children}</Box>
  </Paper>
);

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export default function AttendanceAnalyticsScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [filters, setFilters] = useState({
    startmonth: moment().subtract(1, 'month').format('YYYY-MM'),
    endmonth: moment().format('YYYY-MM')
  });

  const { data: statusCabang, dataLoading: loadStatus } = useAttendanceStatusPerCabang(filters);
  const { data: trendMonth, dataLoading: loadTrend } = useAttendanceTrendPerMonth(filters);
  const { data: onTimeAreaData, dataLoading: loadOnTime } = useAttendanceOnTimeArea(filters);
  const { data: lateHadirData, dataLoading: loadLate } = useAttendanceLateVsHadir(filters);
  const { data: izinCutiSakitData, dataLoading: loadCIS } = useAttendanceIzinCutiSakit(filters);
  const { data: topKaryawanData, dataLoading: loadTopK } = useAttendanceTopKaryawan(filters);
  const { data: topAlphaData, dataLoading: loadTopA } = useAttendanceTopAlpha(filters);
  const { data: avgHadirData, dataLoading: loadAvg } = useAttendanceAvgHadirCabang(filters);
  const { data: statusMixData, dataLoading: loadMix } = useAttendanceStatusMix(filters);
  const { data: totalMarkedData, dataLoading: loadTotalMarked } = useAttendanceTotalMarkedCabang(filters);

  useEffect(() => {
    const t = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);
    return () => clearTimeout(t);
  }, [clock]);

  const parsed = useMemo(() => {
    const summaryCabang = Array.isArray(statusCabang) ? statusCabang : [];

    const aggregateStatus = { H: 0, L: 0, C: 0, I: 0, S: 0, A: 0 };
    summaryCabang.forEach((c) => {
      statusOrder.forEach((s) => {
        aggregateStatus[s] += toNumber(c[s]);
      });
    });

    const trendByMonth = trendMonth || {};

    const topKaryawan = Array.isArray(topKaryawanData)
      ? topKaryawanData.map((r) => ({
          nama: r.nama || 'N/A',
          cabang: r.cabang || '-',
          hadir: toNumber(r.H),
          absen: toNumber(r.A)
        }))
      : [];

    const topAlpha = Array.isArray(topAlphaData)
      ? topAlphaData.map((r) => ({
          nama: r.nama || 'N/A',
          cabang: r.cabang || '-',
          alpha: toNumber(r.A)
        }))
      : [];

    return {
      summaryCabang,
      aggregateStatus,
      trendByMonth,
      topKaryawan,
      topAlpha,
      onTimeArea: onTimeAreaData || {},
      lateHadir: Array.isArray(lateHadirData) ? lateHadirData : [],
      izinCutiSakit: Array.isArray(izinCutiSakitData) ? izinCutiSakitData : [],
      avgHadirCabang: Array.isArray(avgHadirData) ? avgHadirData : [],
      statusMix: statusMixData || {},
      totalMarked: Array.isArray(totalMarkedData) ? totalMarkedData : []
    };
  }, [statusCabang, trendMonth, topKaryawanData, topAlphaData, onTimeAreaData, lateHadirData, izinCutiSakitData, avgHadirData, statusMixData, totalMarkedData]);

  // Chart builders
  const statusStackedByCabang = useMemo(() => {
    const labels = parsed.summaryCabang.map((c) => c.cabang_nama || c.cabang_kode || 'N/A');
    const datasets = statusOrder.map((s) => ({
      label: statusLabel[s],
      data: parsed.summaryCabang.map((c) => toNumber(c[s])),
      backgroundColor: statusColor[s],
      borderRadius: 4,
      stack: 'status'
    }));
    return { labels, datasets };
  }, [parsed.summaryCabang]);

  const onTimeByArea = useMemo(() => {
    const grouped = parsed.onTimeArea || {};
    const entries = Object.entries(grouped);
    const labels = entries.map(([k]) => k);
    const data = entries.map(([, v]) => {
      const total = v.total || 1;
      return (toNumber(v.H) / total) * 100;
    });
    return { labels, data };
  }, [parsed.onTimeArea]);

  const lateVsHadir = useMemo(() => {
    const labels = parsed.lateHadir.map((c) => c.cabang_nama || 'N/A');
    return {
      labels,
      datasets: [
        { label: 'Hadir', data: parsed.lateHadir.map((c) => toNumber(c.H)), backgroundColor: palette.green, borderRadius: 4 },
        { label: 'Terlambat', data: parsed.lateHadir.map((c) => toNumber(c.L)), backgroundColor: palette.amber, borderRadius: 4 }
      ]
    };
  }, [parsed.lateHadir]);

  const izinCutiSakit = useMemo(() => {
    const labels = parsed.izinCutiSakit.map((c) => c.cabang_nama || 'N/A');
    const datasets = ['C', 'I', 'S'].map((s) => ({
      label: statusLabel[s],
      data: parsed.izinCutiSakit.map((c) => toNumber(c[s])),
      backgroundColor: statusColor[s],
      borderRadius: 4,
      stack: 'cis'
    }));
    return { labels, datasets };
  }, [parsed.izinCutiSakit]);

  const topKaryawanChart = useMemo(() => {
    const labels = parsed.topKaryawan.map((k) => k.nama);
    return {
      labels,
      datasets: [
        { label: 'Hadir', data: parsed.topKaryawan.map((k) => k.hadir), backgroundColor: palette.green, borderRadius: 4 },
        { label: 'Absen', data: parsed.topKaryawan.map((k) => k.absen), backgroundColor: palette.red, borderRadius: 4 }
      ]
    };
  }, [parsed.topKaryawan]);

  const topAlphaChart = useMemo(() => {
    const labels = parsed.topAlpha.map((k) => k.nama);
    return {
      labels,
      datasets: [
        { label: 'Alpha', data: parsed.topAlpha.map((k) => k.alpha), backgroundColor: palette.red, borderRadius: 4 }
      ]
    };
  }, [parsed.topAlpha]);

  const trendChart = useMemo(() => {
    const entries = Object.entries(parsed.trendByMonth || {}).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = entries.map(([m]) => m);
    const datasets = statusOrder.map((s) => ({
      label: statusLabel[s],
      data: entries.map(([, v]) => toNumber(v[s])),
      borderColor: statusColor[s],
      backgroundColor: statusColor[s] + '33',
      tension: 0.25,
      fill: true
    }));
    return { labels, datasets };
  }, [parsed.trendByMonth]);

  const avgHadirPerCabang = useMemo(() => {
    const labels = parsed.avgHadirCabang.map((c) => c.cabang_nama || 'N/A');
    const data = parsed.avgHadirCabang.map((c) => toNumber(c.avg_hadir));
    return { labels, data };
  }, [parsed.avgHadirCabang]);

  const totalMarkedPerCabang = useMemo(() => {
    const labels = parsed.totalMarked.map((c) => c.cabang_nama || 'N/A');
    const data = parsed.totalMarked.map((c) => toNumber(c.totalMarked));
    return { labels, data };
  }, [parsed.totalMarked]);

  const statusPie = useMemo(() => {
    return {
      labels: statusOrder.map((s) => statusLabel[s]),
      datasets: [
        {
          label: 'Total Status',
          data: statusOrder.map((s) => (parsed.statusMix ? parsed.statusMix[s] : 0)),
          backgroundColor: statusOrder.map((s) => statusColor[s])
        }
      ]
    };
  }, [parsed.statusMix]);

  const loadingAny =
    loadStatus || loadTrend || loadOnTime || loadLate || loadCIS || loadTopK || loadTopA || loadAvg || loadMix || loadTotalMarked;

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Kehadiran Karyawan</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        <Stack direction={downSM ? 'column' : 'row'} spacing={1} alignItems={downSM ? 'stretch' : 'center'}>
          <TextField
            type="month"
            size="small"
            label="Start Month"
            value={filters.startmonth}
            onChange={(e) => setFilters((p) => ({ ...p, startmonth: e.target.value }))}
          />
          <TextField
            type="month"
            size="small"
            label="End Month"
            value={filters.endmonth}
            onChange={(e) => setFilters((p) => ({ ...p, endmonth: e.target.value }))}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              setFilters({ startmonth: moment().subtract(1, 'month').format('YYYY-MM'), endmonth: moment().format('YYYY-MM') })
            }
          >
            Reset
          </Button>
        </Stack>
      </Stack>

      {/* Body */}
      <Stack sx={{ p: 2, height: '100%', overflow: 'auto' }} spacing={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={6} sx={{ height: 420 }}>
            <Section title="Status Breakdown per Cabang" loading={loadingAny}>
              <Bar
                data={{ labels: statusStackedByCabang.labels, datasets: statusStackedByCabang.datasets }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  scales: { x: { stacked: true }, y: { stacked: true } }
                }}
              />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={6} sx={{ height: 420 }}>
            <Section title="Tren Kehadiran per Bulan" loading={loadingAny}>
              <Line
                data={{ labels: trendChart.labels, datasets: trendChart.datasets }}
                options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top' } } }}
              />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={4} sx={{ height: 420 }}>
            <Section title="Ketepatan Waktu per Area" loading={loadingAny}>
              <Bar
                data={{ labels: onTimeByArea.labels, datasets: [{ label: '% Hadir Tepat Waktu', data: onTimeByArea.data, backgroundColor: palette.green, borderRadius: 4 }] }}
                options={{ responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: (v) => `${v}%` }, min: 0, max: 100 } } }}
              />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 420 }}>
            <Section title="Late vs Hadir per Cabang" loading={loadingAny}>
              <Bar
                data={{ labels: lateVsHadir.labels, datasets: lateVsHadir.datasets }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
              />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 420 }}>
            <Section title="Izin / Cuti / Sakit" loading={loadingAny}>
              <Bar
                data={{ labels: izinCutiSakit.labels, datasets: izinCutiSakit.datasets }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true } } }}
              />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={6} sx={{ height: 420 }}>
            <Section title="Top 10 Karyawan Rajin" loading={loadingAny}>
              <Bar
                data={{ labels: topKaryawanChart.labels, datasets: topKaryawanChart.datasets }}
                options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
              />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={6} sx={{ height: 420 }}>
            <Section title="Top 10 Alpha" loading={loadingAny}>
              <Bar
                data={{ labels: topAlphaChart.labels, datasets: topAlphaChart.datasets }}
                options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={4} sx={{ height: 420 }}>
            <Section title="Rata-rata Hadir per Cabang" loading={loadingAny}>
              <Bar
                data={{ labels: avgHadirPerCabang.labels, datasets: [{ label: 'Hadir / Karyawan', data: avgHadirPerCabang.data, backgroundColor: palette.blue, borderRadius: 4 }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
              />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 420 }}>
            <Section title="Status Mix (Global)" loading={loadingAny}>
              <Pie data={statusPie} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 420 }}>
            <Section title="Total Hari Bertanda per Cabang" loading={loadingAny}>
              <Bar
                data={{ labels: totalMarkedPerCabang.labels, datasets: [{ label: 'Total Hari Bertanda', data: totalMarkedPerCabang.data, backgroundColor: palette.slate, borderRadius: 4 }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
              />
            </Section>
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
}
