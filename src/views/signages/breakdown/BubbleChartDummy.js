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

export default function BubbleChartDummy({ trendMonthlyData, trendMonthlyLoading, repairTimeData, repairTimeLoading }) {
  const theme = useTheme();

  const baseChart = {
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    foreColor: theme.palette.text.secondary,
    parentHeightOffset: 0
  };

  // Process real data from API or use dummy data as fallback for trend chart
  const { categories, series: trendSeries, summary } = useMemo(() => {
    // Debug logging
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('🔍 BubbleChartDummy - trendMonthlyData:', trendMonthlyData);
    }

    if (trendMonthlyData?.categories && trendMonthlyData?.series) {
      return {
        categories: trendMonthlyData.categories,
        series: trendMonthlyData.series,
        summary: trendMonthlyData.summary
      };
    }

    // Fallback dummy data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dummySeries = [
      { name: 'DT', data: [[0,30,25],[0,45,18],[1,40,20],[1,52,22],[2,35,28],[2,48,16],[3,50,22],[3,60,24],[4,28,18],[4,42,20],[5,45,26],[5,55,18],[6,38,22],[7,44,20],[8,52,26],[9,48,22],[10,36,18],[11,58,24]] },
      { name: 'HE', data: [[0,20,18],[0,32,14],[1,25,22],[1,30,18],[2,30,20],[2,36,16],[3,22,16],[3,28,14],[4,27,24],[4,35,18],[5,33,21],[5,40,16],[6,26,18],[7,29,16],[8,34,20],[9,31,18],[10,28,16],[11,36,20]] },
      { name: 'LV', data: [[0,15,14],[0,22,12],[1,18,16],[1,24,14],[2,22,18],[2,26,14],[3,19,15],[3,23,13],[4,21,17],[4,25,15],[5,24,19],[5,28,16],[6,20,14],[7,22,15],[8,26,17],[9,24,15],[10,21,14],[11,27,16]] }
    ];

    return {
      categories: months,
      series: dummySeries,
      summary: null
    };
  }, [trendMonthlyData]);

  // Process repair time distribution data for histogram
  const { histogramData, stats } = useMemo(() => {
    if (repairTimeData?.histogram && repairTimeData?.statistics) {
      return {
        histogramData: repairTimeData.histogram,
        stats: repairTimeData.statistics
      };
    }

    // Fallback dummy data
    return {
      histogramData: [
        { label: '0-1 jam', count: 120, percentage: 45 },
        { label: '1-2 jam', count: 60, percentage: 22 },
        { label: '2-4 jam', count: 40, percentage: 15 },
        { label: '4-8 jam', count: 25, percentage: 9 },
        { label: '8-12 jam', count: 12, percentage: 5 },
        { label: '12-24 jam', count: 8, percentage: 3 },
        { label: '> 24 jam', count: 2, percentage: 1 }
      ],
      stats: {
        total_repairs: 267,
        average: { hours: 2.5 },
        median: { hours: 1.2 }
      }
    };
  }, [repairTimeData]);

  const areaChartSeries = useMemo(() => {
    if (!trendSeries || trendSeries.length === 0) {
      return [];
    }

    // Debug logging
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('📊 BubbleChartDummy - trendSeries:', trendSeries);
      console.log('📊 First series data:', trendSeries[0]?.data);
      console.log('📊 First data point:', trendSeries[0]?.data?.[0]);
      console.log('📊 First data point type:', typeof trendSeries[0]?.data?.[0]);
    }

    // Check if data format is from API (array of numbers) or dummy (array of [x,y,z] arrays)
    const hasValidSeries = trendSeries.some(s => Array.isArray(s.data) && s.data.length > 0);

    if (!hasValidSeries) {
      return [];
    }

    // Check if data is API format (array of numbers)
    const firstSeriesData = trendSeries[0]?.data;
    if (!firstSeriesData || firstSeriesData.length === 0) {
      return [];
    }

    const firstDataPoint = firstSeriesData[0];

    // Case 1: API format - array of numbers
    if (typeof firstDataPoint === 'number') {
      return trendSeries;
    }

    // Case 2: Dummy format - array of arrays [x, y, z] or [x, y]
    if (Array.isArray(firstDataPoint)) {
      // For area chart, extract just the y values (index 1)
      return trendSeries.map(s => ({
        name: s.name,
        data: s.data.map(item => {
          // If item is array, get the second element (y-value)
          return Array.isArray(item) ? (item[1] ?? 0) : 0;
        })
      }));
    }

    // Case 3: Object format {x, y} - already correct for bubble/area
    if (typeof firstDataPoint === 'object' && firstDataPoint !== null) {
      return trendSeries;
    }

    // Return as-is if we can't determine format
    const result = trendSeries;

    // Debug logging at the end
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('✅ BubbleChartDummy - areaChartSeries result:', result);
    }

    return result;
  }, [trendSeries]);

  // Prepare histogram data for ApexCharts
  const histogramCategories = histogramData?.map(h => h?.label) || [];
  const histogramSeries = [{
    name: 'Jumlah',
    data: histogramData?.map(h => h?.count || 0) || []
  }];

  // Show loading state if data is still loading (after all hooks)
  if (trendMonthlyLoading || repairTimeLoading) {
    return (
      <>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Monthly Breakdown Trend" />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
                <Typography variant="body1" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Distribusi Waktu Perbaikan" />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
                <Typography variant="body1" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </>
    );
  }

  return (
    <>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title="Monthly Breakdown Trend"
            subheader={summary ? `Total: ${summary.total_breakdown ?? 'N/A'} | Avg: ${summary.monthly_average ?? 'N/A'}/bulan` : 'Distribusi simulasi per kategori'}
          />
          <CardContent>
            {(() => {
              // Debug logging before render
              if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                console.log('🎨 BubbleChartDummy - Rendering with areaChartSeries:', areaChartSeries);
                console.log('🎨 Categories:', categories);
                console.log('🎨 Has valid data:', areaChartSeries.length > 0 && Array.isArray(areaChartSeries[0]?.data) && areaChartSeries[0].data.length > 0);
              }
              return null;
            })()}
            {areaChartSeries.length > 0 && Array.isArray(areaChartSeries[0]?.data) && areaChartSeries[0].data.length > 0 ? (
              <ReactApexChart
                type="area"
                height={360}
                series={areaChartSeries}
                options={{
                  chart: { ...baseChart, background: 'transparent', stacked: false },
                  dataLabels: { enabled: false },
                  stroke: { curve: 'smooth', width: 2 },
                  xaxis: { type: 'category', categories: categories || [], tickAmount: (categories?.length || 1) - 1, labels: { rotate: 0 } },
                  yaxis: { title: { text: 'Jumlah Breakdown' } },
                  legend: { position: 'top' },
                  grid: { strokeDashArray: 4, borderColor: theme.palette.divider },
                  fill: { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: 0.5, opacityTo: 0.1 } },
                  colors: [theme.palette.info.main, theme.palette.secondary.main, theme.palette.warning.main, theme.palette.success.main, theme.palette.error.main]
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
                <Typography variant="body1" color="text.secondary">
                  Tidak ada data trend
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader
            title="Distribusi Waktu Perbaikan"
            subheader={
              stats
                ? `Total: ${stats.total_repairs ?? 'N/A'} | Avg: ${stats.average?.hours ?? 'N/A'}j | Median: ${stats.median?.hours ?? 'N/A'}j`
                : 'Histogram durasi perbaikan'
            }
          />
          <CardContent>
            {histogramSeries.length > 0 && Array.isArray(histogramSeries[0]?.data) && histogramSeries[0].data.length > 0 ? (
              <ReactApexChart
                type="bar"
                height={360}
                series={histogramSeries}
                options={{
                  chart: { ...baseChart, background: 'transparent' },
                  plotOptions: {
                    bar: {
                      borderRadius: 4,
                      columnWidth: '70%',
                      dataLabels: { position: 'top' }
                    }
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (value) => {
                      return value;
                    },
                    textAnchor: 'middle',
                    distributed: true,
                    offsetY: -25,
                    style: {
                      fontSize: '16px',
                      colors: [theme.palette.text.secondary],
                      fontWeight: 600
                    }
                  },
                  xaxis: {
                    categories: histogramCategories,
                    labels: {
                      style: {
                        fontSize: '11px'
                      },
                      rotate: -30
                    }
                  },
                  yaxis: {
                    title: { text: 'Jumlah' }
                  },
                  grid: {
                    strokeDashArray: 4,
                    borderColor: theme.palette.divider
                  },
                  colors: ['#FF9800']
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
                <Typography variant="body1" color="text.secondary">
                  Tidak ada data histogram
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
}
