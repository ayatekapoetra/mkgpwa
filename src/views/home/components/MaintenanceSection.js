'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { Setting2, Chart, Timer } from 'iconsax-react';
import SectionCard from './SectionCard';
import DashboardGrid, { DashboardGridItem } from './DashboardGrid';
import { formatNumber, formatHours, normalizePolarBreakdown, toNumber, pickArray } from '../utils';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function MaintenanceSection({ maintenance }) {
  const theme = useTheme();
  const polarRaw = maintenance?.polar?.data;
  const polar = useMemo(() => normalizePolarBreakdown(polarRaw), [polarRaw]);
  const summary = maintenance?.summaryBreakdown?.summary || {};
  const trend = maintenance?.trendMonthly?.data || {};
  const activeStack = maintenance?.activeStack?.data || {};

  const donut = useMemo(() => {
    const open = polar.open || toNumber(summary.total_status_open);
    const closed = polar.closed || toNumber(summary.total_status_close);
    return {
      series: [open, closed],
      options: {
        chart: { type: 'donut', fontFamily: theme.typography.fontFamily },
        labels: ['Open / Active', 'Closed / Done'],
        colors: [theme.palette.error.main, theme.palette.success.main],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total',
                  formatter: () => formatNumber(open + closed || polar.total || summary.total_equipment)
                }
              }
            }
          }
        },
        stroke: { width: 0 }
      }
    };
  }, [polar, summary, theme]);

  const categoryBar = useMemo(() => {
    const cats = [...polar.list].sort((a, b) => b.total - a.total).slice(0, 6);
    return {
      series: [{ name: 'Breakdown', data: cats.map((c) => c.total) }],
      options: {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
        plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '62%' } },
        colors: [theme.palette.warning.main],
        dataLabels: { enabled: true },
        xaxis: {
          categories: cats.map((c) => c.name),
          labels: { style: { colors: theme.palette.text.secondary } }
        },
        yaxis: { labels: { style: { colors: theme.palette.text.secondary } } },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 }
      }
    };
  }, [polar.list, theme]);

  const monthlyTrend = useMemo(() => {
    const categories = pickArray(trend.categories, trend?.data?.categories, trend?.labels);
    let series = pickArray(trend.series, trend?.barSeries, trend?.data?.series);
    if (!series.length && Array.isArray(trend.data)) {
      series = [{ name: 'Breakdown', data: trend.data.map((d) => toNumber(d.total ?? d.count ?? d.value)) }];
      if (!categories.length) {
        return {
          series,
          options: {
            chart: { type: 'area', toolbar: { show: false } },
            xaxis: {
              categories: trend.data.map((d) => d.month || d.label || d.periode || '-')
            },
            colors: [theme.palette.error.main],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
            grid: { borderColor: theme.palette.divider, strokeDashArray: 4 }
          }
        };
      }
    }
    if (!series.length) series = [{ name: 'Breakdown', data: [] }];
    return {
      series: series.map((s) => ({
        name: s.name || 'Breakdown',
        data: (s.data || []).map((v) => toNumber(typeof v === 'object' ? v.y ?? v.value : v))
      })),
      options: {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
        xaxis: {
          categories: categories.length ? categories : series[0]?.data?.map((_, i) => `${i + 1}`) || [],
          labels: { style: { colors: theme.palette.text.secondary, fontSize: '11px' } }
        },
        colors: [theme.palette.error.main, theme.palette.warning.main],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.05 } },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        legend: { position: 'top' }
      }
    };
  }, [trend, theme]);

  const loading =
    maintenance?.polar?.loading ||
    maintenance?.trendMonthly?.loading ||
    maintenance?.summaryBreakdown?.dataLoading;

  return (
    <DashboardGrid gap={2.5} columns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
      <DashboardGridItem>
        <SectionCard
          title="Breakdown Status"
          subtitle="Open vs closed"
          icon={<Setting2 size={20} variant="Bold" />}
          loading={loading}
          actionHref="/panel/breakdown"
          color="error"
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="error" label={`Open ${formatNumber(polar.open || summary.total_status_open)}`} />
            <Chip size="small" color="success" variant="light" label={`Close ${formatNumber(polar.closed || summary.total_status_close)}`} />
            <Chip size="small" variant="outlined" label={`Duration ${formatHours(summary.total_duration)}`} />
          </Stack>
          {(polar.open || polar.closed || polar.total) ? (
            <ReactApexChart type="donut" height={260} series={donut.series} options={donut.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Tidak ada data breakdown</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="Top Kategori Equipment"
          subtitle="Jumlah breakdown aktif"
          icon={<Chart size={20} variant="Bold" />}
          loading={loading}
          color="warning"
        >
          {polar.list.length ? (
            <ReactApexChart type="bar" height={280} series={categoryBar.series} options={categoryBar.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Belum ada kategori breakdown</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="Trend Breakdown Bulanan"
          subtitle="Pola downtime periodik"
          icon={<Timer size={20} variant="Bold" />}
          loading={maintenance?.trendMonthly?.loading}
          color="secondary"
        >
          {(monthlyTrend.series[0]?.data || []).length ? (
            <ReactApexChart type="area" height={280} series={monthlyTrend.series} options={monthlyTrend.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Trend belum tersedia</Typography>
              {Array.isArray(activeStack.labels) && activeStack.labels.length ? (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Active stack: {activeStack.labels.length} area
                </Typography>
              ) : null}
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>
    </DashboardGrid>
  );
}
