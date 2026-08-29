'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { TruckFast, Timer1, Danger, Hierarchy } from 'iconsax-react';
import SectionCard from './SectionCard';
import DashboardGrid, { DashboardGridItem } from './DashboardGrid';
import { formatNumber, formatMinutes, toNumber } from '../utils';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function OperationsSection({ ritase }) {
  const theme = useTheme();
  const data = ritase?.data || {};
  const seriesData = Array.isArray(data.ritase_daily_series) ? data.ritase_daily_series : [];
  const unmatched = toNumber(data.unmatched?.pit) + toNumber(data.unmatched?.stockpile);

  const chart = useMemo(() => {
    const categories = seriesData.map((d) => String(d.date_ops || '').slice(8, 10));
    const values = seriesData.map((d) => toNumber(d.total));
    return {
      series: [{ name: 'Ritase', data: values }],
      options: {
        chart: {
          type: 'area',
          height: 260,
          toolbar: { show: false },
          zoom: { enabled: false },
          fontFamily: theme.typography.fontFamily
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] }
        },
        colors: [theme.palette.primary.main],
        xaxis: {
          categories,
          labels: { style: { colors: theme.palette.text.secondary, fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            style: { colors: theme.palette.text.secondary },
            formatter: (v) => formatNumber(v)
          }
        },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        tooltip: {
          theme: theme.palette.mode,
          y: { formatter: (v) => `${formatNumber(v)} rit` }
        }
      }
    };
  }, [seriesData, theme]);

  const cycleAvg = toNumber(data.cycle_time?.avg);
  const cycleMax = Math.max(toNumber(data.cycle_time?.max), cycleAvg, 1);
  const gaugePct = Math.min(100, (cycleAvg / cycleMax) * 100);

  return (
    <Stack spacing={2.5}>
      <SectionCard
        title="Produksi Ritase"
        subtitle="Trend harian bulan berjalan"
        icon={<TruckFast size={20} variant="Bold" />}
        loading={ritase?.loading}
        actionHref="/panel/produksi-pit-cycle-time-monitoring"
        color="primary"
        minHeight={360}
      >
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" color="primary" label={`Hari ini: ${formatNumber(data.ritase_daily_total)}`} />
          <Chip size="small" variant="outlined" label={`MTD: ${formatNumber(data.ritase_monthly_cumulative)}`} />
          <Chip size="small" variant="outlined" label={`DOM open: ${formatNumber(data.dom?.opened_today)}`} />
          <Chip size="small" variant="outlined" label={`DOM closed: ${formatNumber(data.dom?.closed_today)}`} />
        </Stack>
        {seriesData.length ? (
          <ReactApexChart type="area" height={260} series={chart.series} options={chart.options} />
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">Belum ada data ritase untuk periode ini</Typography>
          </Box>
        )}
      </SectionCard>

      <DashboardGrid gap={2} columns={{ xs: '1fr', sm: '1fr 1fr' }}>
        <DashboardGridItem>
          <SectionCard
            title="Cycle Time"
            subtitle="Rata-rata hari ini"
            icon={<Timer1 size={20} variant="Bold" />}
            loading={ritase?.loading}
            color="info"
            minHeight={170}
          >
            <Stack spacing={1.5}>
              <Typography variant="h2" fontWeight={800} color="info.main">
                {formatMinutes(cycleAvg)}
              </Typography>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ width: `${gaugePct}%`, height: '100%', bgcolor: 'info.main', borderRadius: 999 }} />
              </Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Min {formatMinutes(data.cycle_time?.min)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max {formatMinutes(data.cycle_time?.max)}
                </Typography>
              </Stack>
            </Stack>
          </SectionCard>
        </DashboardGridItem>
        <DashboardGridItem>
          <SectionCard
            title="Data Quality"
            subtitle="Unmatched & DOM"
            icon={<Danger size={20} variant="Bold" />}
            loading={ritase?.loading}
            color={unmatched > 0 ? 'error' : 'success'}
            minHeight={170}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Unmatched total</Typography>
                <Chip size="small" color={unmatched > 0 ? 'error' : 'success'} label={formatNumber(unmatched)} />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  PIT unmatched
                </Typography>
                <Typography variant="subtitle2">{formatNumber(data.unmatched?.pit)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Stockpile unmatched
                </Typography>
                <Typography variant="subtitle2">{formatNumber(data.unmatched?.stockpile)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                <Chip
                  size="small"
                  icon={<Hierarchy size={14} />}
                  variant="outlined"
                  label={`Open DOM ${formatNumber(data.dom?.opened_today)}`}
                />
              </Stack>
            </Stack>
          </SectionCard>
        </DashboardGridItem>
      </DashboardGrid>
    </Stack>
  );
}
