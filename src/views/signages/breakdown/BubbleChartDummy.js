'use client';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function BubbleChartDummy({
  trendMonthlyData,
  trendMonthlyLoading,
  repairTimeData,
  repairTimeLoading,
  chartHeight = 360,
  fullWidth = false,
  fullHeight = false,
  mode = 'trend' // 'trend' or 'repair'
}) {
  const theme = useTheme();

  const Wrapper = fullWidth ? Box : Grid;
  const getWrapperProps = (isTrendChart) => {
    if (fullWidth) return { sx: { height: '100%', width: '100%' } };
    return { item: true, xs: 12, md: isTrendChart ? 8 : 4 };
  };

  const baseChart = {
    toolbar: { show: true, tools: { download: true } },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    foreColor: theme.palette.text.secondary,
    parentHeightOffset: 0
  };

  const isTrend = mode === 'trend';
  const isRepair = mode === 'repair';

  // Trend monthly data
  const { categories, series: trendSeries, summary } = useMemo(() => {
    if (trendMonthlyData?.categories && trendMonthlyData?.series) {
      return {
        categories: trendMonthlyData.categories,
        series: trendMonthlyData.series,
        summary: trendMonthlyData.summary
      };
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dummySeries = [
      { name: 'DT', data: [30, 45, 40, 52, 35, 48, 50, 60, 28, 42, 45, 55] },
      { name: 'HE', data: [20, 32, 25, 30, 30, 36, 22, 28, 27, 35, 33, 40] },
      { name: 'LV', data: [15, 22, 18, 24, 22, 26, 19, 23, 21, 25, 24, 28] }
    ];
    return { categories: months, series: dummySeries, summary: null };
  }, [trendMonthlyData]);

  // Repair time distribution
  const { histogramData, stats } = useMemo(() => {
    if (repairTimeData?.histogram && repairTimeData?.statistics) {
      return {
        histogramData: repairTimeData.histogram,
        stats: repairTimeData.statistics
      };
    }
    return {
      histogramData: [
        { label: '0-1 jam', count: 120 },
        { label: '1-2 jam', count: 60 },
        { label: '2-4 jam', count: 40 },
        { label: '4-8 jam', count: 25 },
        { label: '8-12 jam', count: 12 },
        { label: '12-24 jam', count: 8 },
        { label: '> 24 jam', count: 2 }
      ],
      stats: {
        total_repairs: 267,
        average: { hours: 2.5 },
        median: { hours: 1.2 }
      }
    };
  }, [repairTimeData]);

  const hasTrend = isTrend && trendSeries && trendSeries.length > 0;
  const hasRepair = isRepair && histogramData && histogramData.length > 0;

  if ((isTrend && trendMonthlyLoading) || (isRepair && repairTimeLoading)) {
    return (
      <Wrapper {...getWrapperProps(isTrend)}>
        <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
          <CardHeader title={isTrend ? 'Monthly Breakdown Trend' : 'Distribusi Waktu Perbaikan'} />
          <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : {}}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: fullHeight ? '100%' : chartHeight }}>
              <Typography variant="body1" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // Render trend chart
  if (isTrend) {
    return (
      <Wrapper {...getWrapperProps(true)}>
        <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
          <CardHeader
            title="Monthly Breakdown Trend"
            subheader={summary ? `Total: ${summary.total_breakdown ?? 'N/A'} | Avg: ${summary.monthly_average ?? 'N/A'}/bulan` : 'Distribusi simulasi per kategori'}
          />
          <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : { height: chartHeight }}>
            {hasTrend ? (
              <ReactApexChart
                type="area"
                height={fullHeight ? '100%' : chartHeight}
                series={trendSeries}
                options={{
                  chart: { ...baseChart, stacked: false, background: 'transparent' },
                  xaxis: { categories, labels: { rotate: -45, style: { fontSize: '11px' } } },
                  dataLabels: { enabled: false },
                  stroke: { curve: 'smooth', width: 3 },
                  grid: { strokeDashArray: 4 },
                  colors: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.warning.main]
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Tidak ada data tren bulanan
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // Render repair distribution
  const histogramSeries = [{ name: 'Jumlah', data: histogramData?.map(h => h?.count || 0) || [] }];
  const histogramCategories = histogramData?.map(h => h?.label) || [];

  return (
    <Wrapper {...getWrapperProps(false)}>
      <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
        <CardHeader
          title="Distribusi Waktu Perbaikan"
          subheader={
            stats ? `Total: ${stats.total_repairs ?? 'N/A'} | Avg: ${stats.average?.hours ?? 'N/A'} jam | Median: ${stats.median?.hours ?? 'N/A'} jam` : undefined
          }
        />
        <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : { height: chartHeight }}>
          {histogramSeries?.[0]?.data?.length ? (
            <ReactApexChart
              type="bar"
              height={fullHeight ? '100%' : chartHeight}
              series={histogramSeries}
              options={{
                chart: { ...baseChart, background: 'transparent', stacked: false },
                plotOptions: { bar: { borderRadius: 4 } },
                xaxis: { categories: histogramCategories, labels: { style: { fontSize: '11px' } } },
                dataLabels: { enabled: false },
                grid: { strokeDashArray: 4 },
                colors: [theme.palette.info.main],
                tooltip: { y: { formatter: (val) => `${val}x` } }
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                Tidak ada data distribusi waktu perbaikan
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
}
