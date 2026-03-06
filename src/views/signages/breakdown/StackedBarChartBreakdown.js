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

export default function StackedBarChartBreakdown({ data, validCategorySeries, statusLabels, statusPalette, fullHeight = false, fullWidth = false }) {
  const theme = useTheme();

  const Wrapper = fullWidth ? Box : Grid;
  const wrapperProps = fullWidth ? { sx: { height: '100%', width: '100%' } } : { item: true, xs: 12, md: 6 };

  if (!validCategorySeries || validCategorySeries.length === 0) {
    return (
      <Wrapper {...wrapperProps}>
        <Card sx={fullHeight ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
          <CardHeader title="Breakdown per Kategori & Status" />
          <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : {}}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: fullHeight ? '100%' : 350 }}>
              <Typography variant="body1" color="text.secondary">
                Tidak ada data breakdown
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  const totalBreakdown = Array.isArray(data)
    ? data.reduce((sum, cat) => sum + (cat?.total || 0), 0)
    : 0;

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
          title="Breakdown per Kategori & Status"
          subheader={`Total: ${totalBreakdown} unit`}
        />
        <CardContent sx={fullHeight ? { flex: 1, minHeight: 0 } : {}}>
          <ReactApexChart
            type="bar"
            height={fullHeight ? '100%' : 350}
            series={statusLabels
              .filter(status =>
                validCategorySeries.some(series => {
                  const statusIndex = statusLabels.indexOf(status);
                  return series.data?.[statusIndex] > 0;
                })
              )
              .map(status => ({
                name: status,
                data: validCategorySeries.map(series => {
                  const statusIndex = statusLabels.indexOf(status);
                  return series.data?.[statusIndex] ?? 0;
                })
              }))}
            options={{
              chart: {
                ...baseChart,
                stacked: true,
                background: 'transparent'
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  borderRadius: 6,
                  barHeight: '60%',
                  dataLabels: {
                    total: {
                      enabled: true,
                      style: {
                        fontSize: '12px',
                        fontWeight: 600,
                        colors: ['#ffffff']
                      },
                      offsetX: 0,
                      formatter: (val) => (val > 0 ? val : '')
                    }
                  }
                }
              },
              grid: {
                strokeDashArray: 4
              },
              xaxis: {
                show: true,
                categories: validCategorySeries.map(series => series?.name || 'Unknown'),
                labels: {
                  style: {
                    fontSize: '15px',
                    fontWeight: 700,
                    colors: theme.palette.text.primary
                  }
                }
              },
              yaxis: {
                show: true,
                labels: {
                  formatter: (val) => `${val} unit`,
                  style: {
                    fontSize: '13px',
                    fontWeight: 500
                  }
                },
                title: {
                  text: 'Jumlah Unit',
                  style: {
                    fontSize: '12px',
                    fontWeight: 600
                  }
                }
              },
              colors: statusLabels.map(status => statusPalette?.[status] || theme.palette.grey[500]),
              legend: {
                position: 'top',
                offsetY: 0,
                fontSize: '13px',
                fontWeight: 600,
                itemMargin: {
                  horizontal: 10,
                  vertical: 5
                }
              },
              fill: {
                opacity: 1
              },
              dataLabels: {
                enabled: false
              },
              tooltip: {
                y: {
                  formatter: (val) => `${val} unit`
                },
                style: {
                  fontSize: '12px'
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </Wrapper>
  );
}
