'use client';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function EquipmentPerformanceBubbleChart({ bubbleData, loading }) {
  const theme = useTheme();

  const baseChart = {
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    foreColor: theme.palette.text.secondary,
    parentHeightOffset: 0
  };

  // Process series data for bubble chart
  const { chartSeries, statistics } = useMemo(() => {
    if (!bubbleData?.series_data) {
      return { chartSeries: [], statistics: null };
    }

    // Filter out series with empty data
    const validSeries = bubbleData.series_data.filter(series =>
      series.data && series.data.length > 0
    );

    return {
      chartSeries: validSeries,
      statistics: bubbleData.statistics
    };
  }, [bubbleData]);

  if (loading || !chartSeries.length) {
    return null;
  }

  return (
    <Grid item xs={12}>
      <Card>
        <CardHeader
          title="Weekly Breakdown by Category"
          subheader={
            statistics
              ? `Weeks: ${statistics.total_weeks} | Total Breakdown: ${statistics.total_breakdown} | Avg Duration: ${statistics.avg_duration_hours}j`
              : 'Analisis breakdown mingguan berdasarkan kategori equipment'
          }
          action={
            <Typography variant="caption" color="text.secondary">
              X: Minggu | Y: Breakdown Count | Bubble: Durasi (jam)
            </Typography>
          }
        />
        <CardContent>
          <ReactApexChart
            type="bubble"
            height={400}
            series={chartSeries}
            options={{
              chart: {
                ...baseChart,
                background: 'transparent',
                zoom: { enabled: true }
              },
              dataLabels: { enabled: false },
              xaxis: {
                title: { text: 'Minggu' },
                labels: {
                  style: { fontSize: '11px' }
                },
                tickPlacement: 'between'
              },
              yaxis: {
                title: { text: 'Jumlah Breakdown' },
                labels: {
                  style: { fontSize: '11px' }
                }
              },
              grid: {
                strokeDashArray: 4,
                borderColor: theme.palette.divider,
                padding: { top: 0, right: 0, bottom: 0, left: 10 }
              },
              fill: {
                opacity: 0.6,
                gradient: {
                  shade: 'dark',
                  shadeIntensity: 0.3,
                  opacityFrom: 0.6,
                  opacityTo: 0.2
                }
              },
              colors: [
                theme.palette.info.main,
                theme.palette.secondary.main,
                theme.palette.warning.main,
                theme.palette.success.main,
                theme.palette.error.main
              ],
              legend: {
                position: 'top',
                offsetY: 0
              },
              tooltip: {
                custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                  if (!w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex]) {
                    return '<div style="padding: 10px;">No data available</div>';
                  }
                  const data = w.config.series[seriesIndex].data[dataPointIndex];
                  const cat = w.config.series[seriesIndex].name || 'Unknown';
                  return `
                    <div style="padding: 10px; font-size: 12px;">
                      <div style="font-weight: bold; margin-bottom: 5px;">${cat}</div>
                      <div>Week: <strong>${data?.x ?? 'N/A'}</strong></div>
                      <div>Breakdown: <strong>${data?.y ?? 0}x</strong></div>
                      <div>Avg Duration: <strong>${data?.z ?? 0} jam</strong></div>
                    </div>
                  `;
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </Grid>
  );
}
