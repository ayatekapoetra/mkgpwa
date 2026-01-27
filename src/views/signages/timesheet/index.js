'use client';

import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';

// MUI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// Charts
import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// API
import { useGetTimesheetAll } from 'api/timesheet-analytics';

// Register charts
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calcDurationHours = (start, end) => {
  if (!start || !end) return 0;
  const s = moment(start);
  const e = moment(end);
  if (!s.isValid() || !e.isValid()) return 0;
  const minutes = e.diff(s, 'minutes');
  return minutes > 0 ? minutes / 60 : 0;
};

const formatMillions = (value) => {
  const num = toNumber(value);
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}B`; // unlikely but safe
  return `${num.toFixed(1)}M`;
};

const formatHours = (value) => `${toNumber(value).toFixed(1)}h`;

// Color palette
const palette = {
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
  purple: '#a855f7',
  teal: '#14b8a6'
};

const Section = ({ title, children, loading }) => (
  <Paper
    elevation={1}
    sx={{ p: 2, height: '100%', minHeight: 320, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip label={title} color="primary" size="small" />
      </Stack>
      {loading && <CircularProgress size={18} />}
    </Stack>
    <Box sx={{ flex: 1, minHeight: 260 }}>{children}</Box>
  </Paper>
);

export default function TimesheetAnalyticsScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(31, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });

  const { data: rawData, dataLoading } = useGetTimesheetAll({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);
    return () => clearTimeout(t);
  }, [clock]);

  const parsed = useMemo(() => {
    const records = Array.isArray(rawData) ? rawData : rawData?.rows || [];

    const usageByEquipment = {};
    const trendByDate = {};
    const shiftPerf = {};
    const activityUsage = {};
    const penyewaUsage = {};
    const ritasePoints = [];
    const durationByCategory = {};
    const locationUsage = {};
    const materialUsage = {};

    const ensure = (map, key) => {
      if (!map[key]) map[key] = { used: 0, hours: 0 };
      return map[key];
    };

    records.forEach((ts) => {
      const kdunit = ts.kdunit || ts.equipment?.kode || '-';
      const cat = ts.equipment?.kategori || 'N/A';
      const dateKey = ts.date_ops || ts.created_at || 'N/A';
      const mainact = ts.mainact || 'N/A';
      const penyewa = ts.penyewa?.nama || 'N/A';
      const shiftName = ts.shift_id === 1 ? 'Pagi' : ts.shift_id === 2 ? 'Malam' : 'Lainnya';

      const items = Array.isArray(ts.items) ? ts.items : [];

      const smuStart = toNumber(items[0]?.smustart ?? ts.smustart);
      const smuFinish = toNumber(items[items.length - 1]?.smufinish ?? ts.smufinish ?? smuStart);
      const totalUsed = toNumber(ts.usedhmkm ?? ts.usedsmu ?? (smuFinish - smuStart));

      const totalHours = items.reduce((acc, item) => {
        const dur = calcDurationHours(item.starttime, item.endtime);
        const fallback = dur > 0 ? dur : toNumber(item.tottime);
        return acc + fallback;
      }, 0);

      // 1) Usage by equipment (used + hours)
      const eq = ensure(usageByEquipment, kdunit);
      eq.used += totalUsed;
      eq.hours += totalHours;

      // 2) Trend per day (by category) + total hours
      const day = moment(dateKey).isValid() ? moment(dateKey).format('YYYY-MM-DD') : 'N/A';
      if (!trendByDate[day]) trendByDate[day] = { HE: 0, DT: 0, Other: 0, hours: 0 };
      const bucket = cat === 'HE' ? 'HE' : cat === 'DT' || cat === 'LT' || cat === 'LV' ? 'DT' : 'Other';
      trendByDate[day][bucket] += totalUsed;
      trendByDate[day].hours += totalHours;

      // 3) Shift performance
      const sh = ensure(shiftPerf, shiftName);
      sh.used += totalUsed;
      sh.hours += totalHours;

      // 4) Activity breakdown
      const act = ensure(activityUsage, mainact);
      act.used += totalUsed;
      act.hours += totalHours;

      // 5) Usage by penyewa
      const peny = ensure(penyewaUsage, penyewa);
      peny.used += totalUsed;
      peny.hours += totalHours;

      // Items loop for item-level charts
      items.forEach((item) => {
        const itemUsed = toNumber(item.usedsmu ?? (toNumber(item.smufinish) - toNumber(item.smustart)));
        const itemDur = (() => {
          const d = calcDurationHours(item.starttime, item.endtime);
          return d > 0 ? d : toNumber(item.tottime);
        })();

        // 6) Ritase efficiency (DT only if ritase present)
        if (item.ritase !== undefined && item.ritase !== null) {
          ritasePoints.push({ x: itemUsed, y: toNumber(item.ritase), hours: itemDur, label: kdunit });
        }

        // 7) Cycle time per equipment category (avg duration + used)
        if (!durationByCategory[cat]) durationByCategory[cat] = { hours: 0, used: 0, count: 0 };
        durationByCategory[cat].hours += itemDur;
        durationByCategory[cat].used += itemUsed;
        durationByCategory[cat].count += 1;

        // 8) Location contribution
        const loc = item.lokasi?.nama || 'N/A';
        const locAgg = ensure(locationUsage, loc);
        locAgg.used += itemUsed;
        locAgg.hours += itemDur;

        // 9) Material handling
        const mat = item.material?.nama || 'N/A';
        const matAgg = ensure(materialUsage, mat);
        matAgg.used += itemUsed;
        matAgg.hours += itemDur;
      });
    });

    return {
      usageByEquipment,
      trendByDate,
      shiftPerf,
      activityUsage,
      penyewaUsage,
      ritasePoints,
      durationByCategory,
      locationUsage,
      materialUsage
    };
  }, [rawData]);

  // Chart builders
  const buildBarFromMap = (mapObj, usedLabel, hoursLabel, colorUsed = palette.blue, colorHours = palette.amber, topN = 15) => {
    const entries = Object.entries(mapObj || {})
      .map(([k, v]) => [k, v.used || 0, v.hours || 0])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    return {
      data: {
        labels: entries.map(([k]) => k),
        datasets: [
          {
            label: usedLabel,
            data: entries.map(([, v]) => v),
            backgroundColor: colorUsed,
            borderRadius: 6
          },
          {
            label: hoursLabel,
            data: entries.map(([, , h]) => h),
            backgroundColor: colorHours,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)} ${ctx.dataset.label.includes('Jam') ? 'jam' : 'HM/KM'}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    };
  };

  const usageByEquipmentChart = useMemo(
    () => buildBarFromMap(parsed.usageByEquipment, 'HM/KM Used', 'Total Jam', palette.blue, palette.amber),
    [parsed]
  );
  const activityChart = useMemo(
    () => buildBarFromMap(parsed.activityUsage, 'HM/KM Used', 'Total Jam', palette.purple, palette.green),
    [parsed]
  );
  const penyewaChart = useMemo(
    () => buildBarFromMap(parsed.penyewaUsage, 'HM/KM Used', 'Total Jam', palette.teal, palette.amber),
    [parsed]
  );
  const locationChart = useMemo(
    () => buildBarFromMap(parsed.locationUsage, 'HM/KM Used', 'Total Jam', palette.slate, palette.green),
    [parsed]
  );
  const materialChart = useMemo(
    () => buildBarFromMap(parsed.materialUsage, 'HM/KM Used', 'Total Jam', palette.green, palette.slate),
    [parsed]
  );

  const trendChart = useMemo(() => {
    const entries = Object.entries(parsed.trendByDate || {}).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    const labels = entries.map(([day]) => moment(day).isValid() ? moment(day).format('DD MMM') : day);
    const he = entries.map(([, v]) => v.HE || 0);
    const dt = entries.map(([, v]) => v.DT || 0);
    const other = entries.map(([, v]) => v.Other || 0);
    const hours = entries.map(([, v]) => v.hours || 0);

    return {
      data: {
        labels,
        datasets: [
          { label: 'HE (HM/KM)', data: he, borderColor: palette.blue, backgroundColor: 'rgba(59,130,246,0.25)', tension: 0.3, stack: 'used' },
          { label: 'DT/LT/LV (HM/KM)', data: dt, borderColor: palette.green, backgroundColor: 'rgba(16,185,129,0.25)', tension: 0.3, stack: 'used' },
          { label: 'Other (HM/KM)', data: other, borderColor: palette.slate, backgroundColor: 'rgba(100,116,139,0.25)', tension: 0.3, stack: 'used' },
          { type: 'line', label: 'Total Jam', data: hours, borderColor: palette.red, backgroundColor: palette.red, yAxisID: 'y1', tension: 0.3, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            stacked: true,
            ticks: {
              callback: (v) => `${v.toFixed ? v.toFixed(1) : v} HM`
            }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: (v) => `${v} h` }
          }
        }
      }
    };
  }, [parsed]);

  const shiftChart = useMemo(() => {
    const entries = Object.entries(parsed.shiftPerf || {});
    const labels = entries.map(([k]) => k);
    const used = entries.map(([, v]) => v.used || 0);
    const hours = entries.map(([, v]) => v.hours || 0);

    return {
      data: {
        labels,
        datasets: [
          { label: 'HM/KM Used', data: used, backgroundColor: palette.blue, borderRadius: 6 },
          { label: 'Total Jam', data: hours, backgroundColor: palette.amber, borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true }
        }
      }
    };
  }, [parsed]);

  const ritaseChart = useMemo(() => {
    return {
      data: {
        datasets: [
          {
            label: 'Ritase vs HM/KM Used',
            data: parsed.ritasePoints || [],
            backgroundColor: palette.red,
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => `HM/KM: ${ctx.raw.x?.toFixed?.(2)} | Ritase: ${ctx.raw.y} | Jam: ${formatHours(ctx.raw.hours)}` } } },
        scales: {
          x: { title: { display: true, text: 'HM/KM Used' } },
          y: { title: { display: true, text: 'Ritase' } }
        }
      }
    };
  }, [parsed]);

  const durationChart = useMemo(() => {
    const entries = Object.entries(parsed.durationByCategory || {})
      .map(([k, v]) => [k, v.hours / (v.count || 1), v.used / (v.count || 1)])
      .sort((a, b) => b[1] - a[1]);
    return {
      data: {
        labels: entries.map(([k]) => k),
        datasets: [
          {
            label: 'Rata-rata durasi aktivitas (jam)',
            data: entries.map(([, v]) => v),
            backgroundColor: palette.purple,
            borderRadius: 6
          },
          {
            label: 'Rata-rata HM/KM per aktivitas',
            data: entries.map(([, , u]) => u),
            backgroundColor: palette.green,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.dataset.label.includes('durasi') ? formatHours(ctx.raw) : `${ctx.raw.toFixed(2)} HM/KM`}`
            }
          }
        },
        scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
      }
    };
  }, [parsed]);

  const loadingAny = dataLoading;

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
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Timesheet Analytics</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        <Stack direction={downSM ? 'column' : 'row'} spacing={1} alignItems={downSM ? 'stretch' : 'center'}>
          <TextField
            type="date"
            size="small"
            label="Start"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
          />
          <TextField
            type="date"
            size="small"
            label="End"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="outlined" size="small" onClick={() => setDateRange({ start: moment().subtract(31, 'days').format('YYYY-MM-DD'), end: moment().format('YYYY-MM-DD') })}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Body */}
      <Stack sx={{ p: 2, height: '100%', overflow: 'auto' }} spacing={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={6} sx={{ height: 420 }}>
            <Section title="HM/KM Usage by Equipment" loading={loadingAny}>
              <Bar data={usageByEquipmentChart.data} options={usageByEquipmentChart.options} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={6} sx={{ height: 420 }}>
            <Section title="Usage Trend per Day" loading={loadingAny}>
              <Line data={trendChart.data} options={trendChart.options} />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={4} sx={{ height: 360 }}>
            <Section title="Shift Performance" loading={loadingAny}>
              <Bar data={shiftChart.data} options={shiftChart.options} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 360 }}>
            <Section title="Operation Type Activity" loading={loadingAny}>
              <Bar data={activityChart.data} options={activityChart.options} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 360 }}>
            <Section title="Usage by Penyewa" loading={loadingAny}>
              <Bar data={penyewaChart.data} options={penyewaChart.options} />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={6} sx={{ height: 360 }}>
            <Section title="Ritase Efficiency (DT)" loading={loadingAny}>
              <Scatter data={ritaseChart.data} options={ritaseChart.options} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={6} sx={{ height: 360 }}>
            <Section title="Average Cycle Time per Category" loading={loadingAny}>
              <Bar data={durationChart.data} options={durationChart.options} />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={4} sx={{ height: 360 }}>
            <Section title="Location Contribution" loading={loadingAny}>
              <Bar data={locationChart.data} options={locationChart.options} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 360 }}>
            <Section title="Material Handling" loading={loadingAny}>
              <Bar data={materialChart.data} options={materialChart.options} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ height: 360 }}>
            <Section title="Top Equipment (Compact)" loading={loadingAny}>
              <Bar data={usageByEquipmentChart.data} options={{ ...usageByEquipmentChart.options, indexAxis: 'x' }} />
            </Section>
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
}
