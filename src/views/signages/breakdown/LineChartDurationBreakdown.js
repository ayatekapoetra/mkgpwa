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

export default function LineChartDurationBreakdown({ data, loading, fullHeight = false, fullWidth = false }) {
  const theme = useTheme();

  const Wrapper = fullWidth ? Box : Grid;
  const wrapperProps = fullWidth ? { sx: { height: '100%', width: '100%' } } : { item: true, xs: 12, md: 6 };

  if (loading) {
    return (
      <Wrapper {...wrapperProps}>
        <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
          <CardHeader title="Durasi Breakdown per Equipment (Hari) - Bar" />
          <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : {}}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: fullHeight ? '100%' : 350 }}>
              <Typography variant="body1" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // Check if data exists and has valid barSeries
  const hasValidData = data &&
    Array.isArray(data.barSeries) &&
    data.barSeries.length > 0 &&
    data.barSeries.some(series => Array.isArray(series.data) && series.data.length > 0);

  if (!hasValidData) {
    return (
      <Wrapper {...wrapperProps}>
        <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
          <CardHeader title="Durasi Breakdown per Equipment (Hari) - Bar" />
          <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : {}}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: fullHeight ? '100%' : 350 }}>
              <Typography variant="body1" color="text.secondary">
                Tidak ada data
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  const baseChart = {
    toolbar: { show: true, tools: { download: true } },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    foreColor: theme.palette.text.secondary,
    parentHeightOffset: 0
  };
  return (
    <Wrapper {...wrapperProps}>
      <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
        <CardHeader
          title="Durasi Breakdown per Equipment (Hari)"
          subheader={`${data?.range?.start || ''} s.d ${data?.range?.end || ''}`}
        />
        <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : {}}>
          <ReactApexChart
            type="bar"
            height={fullHeight ? '100%' : 350}
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
                labels: { formatter: (val) => `${val} hari`, style: { fontSize: '11px' } },
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
                  formatter: (val, opts) => opts?.w?.globals?.labels?.[opts?.dataPointIndex] ?? val
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
              }
            }}
          />
        </CardContent>
      </Card>
    </Wrapper>
  );
}
