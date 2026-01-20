'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Color palette for categories
const categoryPalette = {
  LV: '#FFA726',
  DT: '#29B6F6',
  GS: '#66BB6A',
  HE: '#AB47BC',
  LT: '#EF5350',
};

export default function LineChartDurationBreakdown({ data, loading }) {
  const theme = useTheme();

  if (loading) {
    return (
      <Grid item xs={12} md={6}>
        <Card>
           <CardHeader title="Durasi Breakdown per Equipment (Hari) - Bar" />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
              <Typography variant="body1" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  }

  // Check if data exists and has valid barSeries
  const hasValidData = data &&
    Array.isArray(data.barSeries) &&
    data.barSeries.length > 0 &&
    data.barSeries.some(series => Array.isArray(series.data) && series.data.length > 0);

  if (!hasValidData) {
    return (
      <Grid item xs={12} md={6}>
        <Card>
           <CardHeader title="Durasi Breakdown per Equipment (Hari) - Bar" />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
              <Typography variant="body1" color="text.secondary">
                Tidak ada data
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  }

  const baseChart = {
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    foreColor: theme.palette.text.secondary,
    parentHeightOffset: 0
  };

  // Get colors for each series
  const seriesColors = [theme.palette.primary.main];

  const bubbleSeries = [];

  return (
    <Grid item xs={12} md={6}>
      <Card>
        <CardHeader
           title="Durasi Breakdown per Equipment (Hari)"
          subheader={`${data?.range?.start || ''} s.d ${data?.range?.end || ''}`}
        />
        <CardContent>
          <ReactApexChart
            type="bar"
            height={350}
            series={data.barSeries}
            options={{
               chart: {
                 stacked: true,
                 ...baseChart,
                 background: 'transparent',
                zoom: {
                  enabled: true,
                  type: 'x',
                  autoScaleYaxis: true,
                  zoomedArea: {
                    fill: {
                      color: theme.palette.mode === 'dark' ? '#757575' : '#e0e0e0',
                      opacity: 0.25
                    }
                  }
                },
                toolbar: {
                  show: true,
                  tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                  },
                  autoSelected: 'zoom'
                }
              },
                 xaxis: {
                 categories: data?.categories || [],
                 labels: { rotate: -45, style: { fontSize: '11px' } },
                 tickAmount: 'dataPoints',
                 title: { text: 'Equipment (Top 25)', style: { fontSize: '12px', fontWeight: 600 } }
               },
               yaxis: {
                 show: true,
                 labels: { formatter: (val) => `${val} h`, style: { fontSize: '11px' } },
                 title: { text: 'Durasi (hari)', style: { fontSize: '12px', fontWeight: 600 } },
                 min: 0
               },
                colors: [theme.palette.primary.main],
                plotOptions: {
                  bar: { horizontal: false, borderRadius: 4 }
                },
              dataLabels: {
                enabled: false
              },
              tooltip: {
                y: {
                   formatter: (val) => `${val} hari`
                },
                x: {
                  formatter: (val) => {
                  const date = new Date(val);
                  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                }
                },
                marker: {
                  enabled: true,
                  size: 4,
                  hover: {
                    size: 6
                  }
                }
              },
              legend: {
                position: 'top',
                fontSize: '12px',
                fontWeight: 600,
                itemMargin: {
                  horizontal: 10,
                  vertical: 5
                },
                onItemClick: {
                  toggleDataSeries: true
                }
              },
              grid: {
                strokeDashArray: 4,
                borderColor: theme.palette.divider
              },
              plotOptions: {
                curve: 'smooth'
              }
            }}
          />
        </CardContent>
      </Card>
    </Grid>
  );
}
