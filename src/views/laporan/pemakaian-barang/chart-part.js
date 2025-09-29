'use client';

import React, { useMemo } from 'react';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

// THIRD PARTY
import ReactApexChart from 'react-apexcharts';

export default function ChartPart({ data, params }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        top25: {
          categories: [],
          series: [{ name: 'Total Pemakaian', data: [] }]
        },
        top10DT: {
          categories: [],
          series: [{ name: 'Total Pemakaian DT', data: [] }]
        },
        categoryDistribution: {
          labels: [],
          series: []
        }
      };
    }

    // Filter data berdasarkan kategori equipment jika ada parameter
    let filteredData = data;
    if (params?.kategori_equipment) {
      filteredData = data.filter((row) => {
        const kategori = row.kategori || row.kategori_equipment;
        return kategori === params.kategori_equipment;
      });
    }

    // Get headers from first row, exclude 'nama', 'kategori', 'total'
    const headers = Object.keys(filteredData[0] || {}).filter(
      (header) => header !== 'nama' && header !== 'total' && header !== 'kategori' && header !== 'kategori_equipment'
    );

    // Calculate totals for each equipment
    const equipmentTotals = filteredData
      .map((row) => {
        const nama = row.nama || row.nama_barang || 'Unknown Equipment';
        const total = headers.reduce((sum, header) => {
          return sum + (parseFloat(row[header]) || 0);
        }, 0);

        return {
          nama,
          total: Math.round(total * 100) / 100 // Round to 2 decimal places
        };
      })
      .filter((item) => item.total > 0); // Only show items with positive totals

    // Sort by total descending (highest first)
    const sortedDescending = [...equipmentTotals].sort((a, b) => b.total - a.total);

    // Take top 25 for highest usage
    const top25Data = sortedDescending.slice(0, 25);

    // Filter only DT category equipment and take top 10
    const dtEquipment = filteredData.filter((row) => {
      const kategori = row.kategori || row.kategori_equipment;
      return kategori === 'DT';
    });

    const dtTotals = dtEquipment
      .map((row) => {
        const nama = row.nama || row.nama_barang || 'Unknown Equipment';
        const total = headers.reduce((sum, header) => {
          return sum + (parseFloat(row[header]) || 0);
        }, 0);

        return {
          nama,
          total: Math.round(total * 100) / 100
        };
      })
      .filter((item) => item.total > 0);

    const top10DTData = dtTotals.sort((a, b) => b.total - a.total).slice(0, 10);

    // Calculate category distribution for donut chart
    const categoryTotals = {};
    filteredData.forEach((row) => {
      const kategori = row.kategori || row.kategori_equipment || 'Unknown';
      const total = headers.reduce((sum, header) => {
        return sum + (parseFloat(row[header]) || 0);
      }, 0);

      if (!categoryTotals[kategori]) {
        categoryTotals[kategori] = 0;
      }
      categoryTotals[kategori] += total;
    });

    const donutData = Object.entries(categoryTotals).map(([kategori, total]) => ({
      name: kategori === 'DT' ? 'Dump Truck' : kategori === 'HE' ? 'Heavy Equipment' : kategori,
      value: Math.round(total * 100) / 100
    }));

    return {
      top25: {
        categories: top25Data.map((item) => item.nama),
        series: [
          {
            name: 'Total Pemakaian',
            data: top25Data.map((item) => item.total)
          }
        ]
      },
      top10DT: {
        categories: top10DTData.map((item) => item.nama),
        series: [
          {
            name: 'Total Pemakaian DT',
            data: top10DTData.map((item) => item.total)
          }
        ]
      },
      categoryDistribution: {
        labels: donutData.map((item) => item.name),
        series: donutData.map((item) => item.value)
      }
    };
  }, [data, params]);

  // Chart options for Top 25 (full width)
  const top25ChartOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${(val / 1000000).toFixed(1)}M`,
        offsetY: -20,
        style: {
          fontSize: '10px',
          colors: [theme.palette.text.primary]
        }
      },
      colors: [isDark ? theme.palette.primary.light : theme.palette.primary.main],
      xaxis: {
        categories: chartData.top25.categories,
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '10px'
          },
          rotate: -45,
          maxHeight: 80
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '11px'
          },
          formatter: (val) => val.toLocaleString('id-ID')
        }
      },
      grid: {
        show: true,
        borderColor: theme.palette.divider,
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: theme.palette.mode,
        y: {
          formatter: (val) => `${val.toLocaleString('id-ID')} rupiah`
        }
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300
            },
            plotOptions: {
              bar: {
                columnWidth: '70%'
              }
            },
            xaxis: {
              labels: {
                rotate: -90,
                style: {
                  fontSize: '8px'
                }
              }
            }
          }
        }
      ]
    }),
    [chartData.top25.categories, theme]
  );

  // Chart options for Top 10 DT (polar chart)
  const top10DTChartOptions = useMemo(
    () => ({
      chart: {
        type: 'polarArea',
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        background: 'transparent'
      },
      labels: chartData.top10DT.categories,
      colors: isDark
        ? [
            theme.palette.primary.light,
            theme.palette.secondary.light,
            theme.palette.success.light,
            theme.palette.warning.light,
            theme.palette.error.light,
            theme.palette.info.light,
            '#FF8B8B',
            '#6EDDD4',
            '#65C7E1',
            '#A6DEC4'
          ]
        : [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main,
            theme.palette.info.main,
            '#FF6B6B',
            '#4ECDC4',
            '#45B7D1',
            '#96CEB4'
          ],
      stroke: {
        colors: [theme.palette.background.paper]
      },
      fill: {
        opacity: 0.8
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      tooltip: {
        theme: theme.palette.mode,
        y: {
          formatter: (val) => `${val.toLocaleString('id-ID')} rupiah`
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          colors: theme.palette.text.secondary
        }
      }
    }),
    [chartData.top10DT.categories, theme]
  );

  // Chart options for Category Distribution (donut chart)
  const categoryChartOptions = useMemo(
    () => ({
      chart: {
        type: 'donut',
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        background: 'transparent'
      },
      labels: chartData.categoryDistribution.labels,
      colors: isDark
        ? [
            theme.palette.primary.light,
            theme.palette.secondary.light,
            theme.palette.success.light,
            theme.palette.warning.light,
            theme.palette.error.light
          ]
        : [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main
          ],
      stroke: {
        colors: [theme.palette.background.paper]
      },
      fill: {
        opacity: 0.8
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)}%`,
        style: {
          fontSize: '12px',
          colors: [theme.palette.common.white]
        }
      },
      tooltip: {
        theme: theme.palette.mode,
        y: {
          formatter: (val) => `${val.toLocaleString('id-ID')} rupiah`
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          colors: theme.palette.text.secondary
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    }),
    [chartData.categoryDistribution.labels, theme]
  );

  const hasData = chartData.top25.categories.length > 0;

  if (!hasData) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            Tidak ada data untuk ditampilkan pada chart
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {/* Top 25 Equipment dengan Pemakaian Tertinggi - Full Width */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🏆 Top 25 Equipment - Pemakaian Tertinggi
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="textSecondary">
                  25 equipment dengan penggunaan part terbanyak
                </Typography>
              }
            />
            <CardContent>
              <Box sx={{ width: '100%', height: 400 }}>
                <ReactApexChart options={top25ChartOptions} series={chartData.top25.series} type="bar" height="100%" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 10 DT Equipment - Polar Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  📊 Top 10 Dump Truck - Polar Chart
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="textSecondary">
                  10 equipment Dump Truck dengan pemakaian tertinggi
                </Typography>
              }
            />
            <CardContent>
              <Box sx={{ width: '100%', height: 350 }}>
                <ReactApexChart
                  options={top10DTChartOptions}
                  series={chartData.top10DT.series[0]?.data || []}
                  type="polarArea"
                  height="100%"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution - Donut Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🥧 Distribusi Pemakaian per Kategori
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="textSecondary">
                  Persentase pemakaian berdasarkan kategori equipment
                </Typography>
              }
            />
            <CardContent>
              <Box sx={{ width: '100%', height: 350 }}>
                <ReactApexChart options={categoryChartOptions} series={chartData.categoryDistribution.series} type="donut" height="100%" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
