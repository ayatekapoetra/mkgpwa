'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Chart, Timer } from 'iconsax-react';
import SectionCard from './SectionCard';
import DashboardGrid, { DashboardGridItem } from './DashboardGrid';
import { normalizePolarBreakdown, normalizeMonthlyBreakdown, formatNumber } from '../utils';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function MaintenanceSection({ maintenance }) {
  const theme = useTheme();
  const polar = useMemo(() => normalizePolarBreakdown(maintenance?.polar?.data), [maintenance?.polar?.data]);
  const categories = [...polar.list].filter((row) => row.active > 0).sort((a, b) => b.active - a.active).slice(0, 6);
  const trend = useMemo(() => normalizeMonthlyBreakdown(maintenance?.trendMonthly?.data), [maintenance?.trendMonthly?.data]);
  const sharedChart = { toolbar: { show: false }, fontFamily: theme.typography.fontFamily, foreColor: theme.palette.text.secondary };
  const grid = { borderColor: theme.palette.divider, strokeDashArray: 4 };

  return (
    <DashboardGrid gap={2.5} columns={{ xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
      <DashboardGridItem>
        <SectionCard title="Top Kategori Equipment" subtitle="Kategori dengan breakdown aktif terbanyak" icon={<Chart size={20} variant="Bold" />}
          loading={maintenance?.polar?.loading} error={maintenance?.polar?.error} actionHref="/panel/breakdown" color="warning" minHeight={380}>
          {categories.length ? (
            <ReactApexChart type="bar" height={280} series={[{ name: 'Breakdown aktif', data: categories.map((row) => row.active) }]}
              options={{
                chart: { ...sharedChart, type: 'bar' },
                plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '42%' } },
                colors: [theme.palette.warning.main],
                dataLabels: { enabled: false },
                xaxis: { categories: categories.map((row) => row.name), labels: { formatter: (value) => formatNumber(value) }, tickAmount: 4 },
                grid,
                tooltip: { theme: theme.palette.mode, y: { formatter: (value) => `${formatNumber(value)} breakdown` } }
              }} />
          ) : <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>Belum ada kategori breakdown aktif</Typography>}
        </SectionCard>
      </DashboardGridItem>
      <DashboardGridItem>
        <SectionCard title="Trend Breakdown Bulanan" subtitle="Total breakdown dan penyelesaian · 6 bulan terakhir" icon={<Timer size={20} variant="Bold" />}
          loading={maintenance?.trendMonthly?.loading} error={maintenance?.trendMonthly?.error} actionHref="/panel/breakdown" color="error" minHeight={380}>
          {trend.series.some((series) => series.data.length) ? (
            <ReactApexChart type="area" height={280} series={trend.series} options={{
              chart: { ...sharedChart, type: 'area', zoom: { enabled: false } },
              xaxis: { categories: trend.categories },
              yaxis: { labels: { formatter: (value) => formatNumber(value) }, min: 0 },
              colors: [theme.palette.error.main, theme.palette.success.main],
              dataLabels: { enabled: false },
              stroke: { curve: 'smooth', width: 2.5 },
              fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0.02 } },
              legend: { position: 'top', horizontalAlign: 'left' },
              grid,
              tooltip: { theme: theme.palette.mode }
            }} />
          ) : <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>Trend breakdown belum tersedia</Typography>}
        </SectionCard>
      </DashboardGridItem>
    </DashboardGrid>
  );
}
