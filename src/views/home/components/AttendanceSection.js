'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { Profile2User, Chart21, PresentionChart } from 'iconsax-react';
import SectionCard from './SectionCard';
import DashboardGrid, { DashboardGridItem } from './DashboardGrid';
import {
  formatNumber,
  formatPercent,
  toNumber,
  STATUS_ATTENDANCE,
  calcAttendanceRate,
  pickArray
} from '../utils';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const statusOrder = ['H', 'L', 'C', 'I', 'S', 'A'];

export default function AttendanceSection({ attendance }) {
  const theme = useTheme();
  const mixRaw = attendance?.statusMix?.data || {};
  const cabangRaw = pickArray(attendance?.statusCabang?.data);
  const trendRaw = attendance?.trendMonth?.data || {};
  const lateRaw = pickArray(attendance?.lateHadir?.data);

  const mix = useMemo(() => {
    if (mixRaw && typeof mixRaw === 'object' && !Array.isArray(mixRaw)) {
      // could be aggregate nested
      if (mixRaw.aggregate) return mixRaw.aggregate;
      return mixRaw;
    }
    return {};
  }, [mixRaw]);

  const aggregateFromCabang = useMemo(() => {
    const acc = { H: 0, L: 0, C: 0, I: 0, S: 0, A: 0 };
    cabangRaw.forEach((c) => {
      statusOrder.forEach((s) => {
        acc[s] += toNumber(c[s]);
      });
    });
    return acc;
  }, [cabangRaw]);

  const effectiveMix = useMemo(() => {
    const hasMix = statusOrder.some((s) => toNumber(mix[s]) > 0);
    return hasMix ? mix : aggregateFromCabang;
  }, [mix, aggregateFromCabang]);

  const rate = calcAttendanceRate(effectiveMix);

  const donut = useMemo(() => {
    const series = statusOrder.map((s) => toNumber(effectiveMix[s]));
    return {
      series,
      options: {
        chart: { type: 'donut', fontFamily: theme.typography.fontFamily },
        labels: statusOrder.map((s) => STATUS_ATTENDANCE[s].label),
        colors: statusOrder.map((s) => STATUS_ATTENDANCE[s].color),
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Hadir Rate',
                  formatter: () => formatPercent(rate, 0)
                }
              }
            }
          }
        },
        stroke: { width: 0 }
      }
    };
  }, [effectiveMix, rate, theme]);

  const cabangChart = useMemo(() => {
    const top = [...cabangRaw]
      .map((c) => ({
        name: c.cabang_nama || c.cabang_kode || c.nama || 'N/A',
        H: toNumber(c.H),
        L: toNumber(c.L),
        A: toNumber(c.A)
      }))
      .sort((a, b) => b.H + b.L - (a.H + a.L))
      .slice(0, 8);

    return {
      series: [
        { name: 'Hadir', data: top.map((t) => t.H) },
        { name: 'Terlambat', data: top.map((t) => t.L) },
        { name: 'Alpha', data: top.map((t) => t.A) }
      ],
      options: {
        chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '70%' } },
        colors: [STATUS_ATTENDANCE.H.color, STATUS_ATTENDANCE.L.color, STATUS_ATTENDANCE.A.color],
        xaxis: { categories: top.map((t) => t.name), labels: { style: { colors: theme.palette.text.secondary } } },
        legend: { position: 'top' },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        dataLabels: { enabled: false }
      }
    };
  }, [cabangRaw, theme]);

  const trendChart = useMemo(() => {
    let labels = [];
    let hadir = [];
    let late = [];

    if (Array.isArray(trendRaw)) {
      labels = trendRaw.map((r) => r.month || r.periode || r.label || '-');
      hadir = trendRaw.map((r) => toNumber(r.H ?? r.hadir));
      late = trendRaw.map((r) => toNumber(r.L ?? r.late));
    } else if (trendRaw && typeof trendRaw === 'object') {
      labels = Object.keys(trendRaw);
      hadir = labels.map((k) => toNumber(trendRaw[k]?.H ?? trendRaw[k]?.hadir));
      late = labels.map((k) => toNumber(trendRaw[k]?.L ?? trendRaw[k]?.late));
    }

    if (!labels.length && lateRaw.length) {
      labels = lateRaw.map((r) => r.cabang_nama || r.nama || '-');
      hadir = lateRaw.map((r) => toNumber(r.H));
      late = lateRaw.map((r) => toNumber(r.L));
    }

    return {
      series: [
        { name: 'Hadir', data: hadir },
        { name: 'Terlambat', data: late }
      ],
      options: {
        chart: { type: 'line', toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
        stroke: { curve: 'smooth', width: 3 },
        colors: [STATUS_ATTENDANCE.H.color, STATUS_ATTENDANCE.L.color],
        xaxis: {
          categories: labels,
          labels: { style: { colors: theme.palette.text.secondary, fontSize: '11px' } }
        },
        yaxis: { labels: { style: { colors: theme.palette.text.secondary } } },
        legend: { position: 'top' },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        markers: { size: 3 }
      }
    };
  }, [trendRaw, lateRaw, theme]);

  const loading =
    attendance?.statusMix?.dataLoading ||
    attendance?.statusCabang?.dataLoading ||
    attendance?.trendMonth?.dataLoading;

  const totalMarked = statusOrder.reduce((s, k) => s + toNumber(effectiveMix[k]), 0);

  return (
    <DashboardGrid gap={2.5} columns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
      <DashboardGridItem>
        <SectionCard
          title="Status Kehadiran"
          subtitle="Mix absensi periode aktif"
          icon={<Profile2User size={20} variant="Bold" />}
          loading={loading}
          actionHref="/panel/kehadiran-karyawan"
          color="success"
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="success" label={`Rate ${formatPercent(rate)}`} />
            <Chip size="small" variant="outlined" label={`Total ${formatNumber(totalMarked)}`} />
            <Chip size="small" color="warning" variant="light" label={`Telat ${formatNumber(effectiveMix.L)}`} />
            <Chip size="small" color="error" variant="light" label={`Alpha ${formatNumber(effectiveMix.A)}`} />
          </Stack>
          {totalMarked ? (
            <ReactApexChart type="donut" height={270} series={donut.series} options={donut.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Data kehadiran belum tersedia</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="Kehadiran per Cabang"
          subtitle="Top cabang by volume"
          icon={<Chart21 size={20} variant="Bold" />}
          loading={attendance?.statusCabang?.dataLoading}
          color="info"
        >
          {cabangRaw.length ? (
            <ReactApexChart type="bar" height={290} series={cabangChart.series} options={cabangChart.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Tidak ada ringkasan cabang</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="Trend Hadir vs Telat"
          subtitle="Periode bulanan / cabang"
          icon={<PresentionChart size={20} variant="Bold" />}
          loading={attendance?.trendMonth?.dataLoading || attendance?.lateHadir?.dataLoading}
          color="primary"
        >
          {(trendChart.series[0]?.data || []).length ? (
            <ReactApexChart type="line" height={290} series={trendChart.series} options={trendChart.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Trend belum tersedia</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>
    </DashboardGrid>
  );
}
