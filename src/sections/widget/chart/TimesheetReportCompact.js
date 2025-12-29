'use client';

import { useState, useEffect } from 'react';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// THIRD - PARTY
import ReactApexChart from 'react-apexcharts';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// ASSETS
import { ArrowUp, ArrowDown, Clock, Truck, User, Activity } from 'iconsax-react';

// ==============================|| CHART - TIMESHEET REPORT COMPACT ||============================== //

const TimesheetReportCompact = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [timeRange, setTimeRange] = useState('30');

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // CHART OPTIONS - COMPACT LINE CHART
  const lineChartOptions = {
    chart: {
      type: 'line',
      height: 120,
      toolbar: { show: false },
      zoom: { enabled: false },
      sparkline: { enabled: false },
      offsetX: 0,
      offsetY: 0,
      foreColor: theme.palette.text.secondary
    },
    plotOptions: {
      line: {
        curve: 'smooth'
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { show: false },
      floating: false,
      offsetX: 0,
      offsetY: 0,
      crosshairs: { show: false }
    },
    yaxis: {
      show: false,
      floating: false
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }
    },
    tooltip: {
      theme: mode === ThemeMode.DARK ? 'dark' : 'light',
      y: {
        formatter: (value) => `${value}h`
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: 8,
      itemMargin: {
        horizontal: 8,
        vertical: 0
      },
      labels: {
        colors: theme.palette.text.secondary,
        fontSize: '10px',
        useSeriesColors: false
      },
      markers: {
        width: 8,
        height: 8,
        radius: 2
      }
    },
    colors: ['#ff9800']
  };

  // CHART OPTIONS - COMPACT DONUT CHART
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 100,
      offsetX: 0,
      offsetY: 0,
      foreColor: theme.palette.text.secondary
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        },
        customScale: 1,
        offsetX: 0,
        offsetY: 0,
        dataLabels: {
          offset: 0
        }
      }
    },
    labels: ['Mining', 'Hauling', 'Maintenance', 'Other'],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: mode === ThemeMode.DARK ? 'dark' : 'light'
    },
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
    states: {
      hover: {
        filter: {
          type: 'none'
        }
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  };

  const [lineOptions, setLineOptions] = useState(lineChartOptions);
  const [donutOptions, setDonutOptions] = useState(donutChartOptions);

  useEffect(() => {
    // Define attractive colors based on theme mode
    const warningColor = mode === ThemeMode.DARK ? '#ffb74d' : '#ff9800';
    
    const primaryColor = theme.palette.primary?.main || '#1976d2';
    const successColor = theme.palette.success?.main || '#4caf50';
    const warningColorPalette = theme.palette.warning?.main || '#ff9800';
    const errorColor = theme.palette.error?.main || '#f44336';
    
    setLineOptions({
      ...lineChartOptions,
      colors: [warningColor],
      chart: {
        ...lineChartOptions.chart,
        foreColor: theme.palette.text.secondary
      },
      legend: {
        ...lineChartOptions.legend,
        labels: {
          colors: theme.palette.text.secondary,
          fontSize: '10px',
          useSeriesColors: false
        }
      },
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    });
    
    setDonutOptions({
      ...donutChartOptions,
      colors: [primaryColor, successColor, warningColorPalette, errorColor],
      chart: {
        ...donutChartOptions.chart,
        foreColor: theme.palette.text.secondary
      },
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    });
  }, [mode, theme]);

  // Sample data - in real implementation, this would come from API
  const [lineSeries] = useState([
    {
      name: 'Hours',
      data: [45, 52, 48, 58, 55, 62, 50]
    }
  ]);

  const [donutSeries] = useState([40, 30, 20, 10]);

  // Summary statistics - compact version
  const summaryData = [
    {
      title: 'Total Hours',
      value: '1,248',
      change: '+12.5%',
      trend: 'up',
      icon: <Clock size={20} />,
      color: 'primary.main'
    },
    {
      title: 'Equipment',
      value: '24',
      change: '+8.3%',
      trend: 'up',
      icon: <Truck size={20} />,
      color: 'success.main'
    },
    {
      title: 'Operators',
      value: '18',
      change: '-2.2%',
      trend: 'down',
      icon: <User size={20} />,
      color: 'warning.main'
    },
    {
      title: 'Efficiency',
      value: '87.3%',
      change: '+5.1%',
      trend: 'up',
      icon: <Activity size={20} />,
      color: 'info.main'
    }
  ];

  return (
    <MainCard sx={{ height: '100%' }}>
      <Grid container spacing={1.5}>
        {/* Header */}
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              Timesheet Analytics
            </Typography>
            <Box sx={{ minWidth: 70 }}>
              <FormControl fullWidth size="small">
                <Select value={timeRange} onChange={handleTimeRangeChange} sx={{ fontSize: '0.75rem' }}>
                  <MenuItem value={7} sx={{ fontSize: '0.75rem' }}>
                    7D
                  </MenuItem>
                  <MenuItem value={30} sx={{ fontSize: '0.75rem' }}>
                    30D
                  </MenuItem>
                  <MenuItem value={90} sx={{ fontSize: '0.75rem' }}>
                    90D
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Grid>

        {/* Summary Cards - Compact */}
        <Grid item xs={12}>
          <Grid container spacing={1}>
            {summaryData.map((item, index) => (
              <Grid item xs={6} key={index}>
                <Card
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    bgcolor: theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'background.paper',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: theme.shadows[2]
                    }
                  }}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '0.9rem', mt: 0.25, fontWeight: 600 }}>
                          {item.value}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: 0.25 }}>
                          {item.trend === 'up' ? (
                            <ArrowUp size={10} color={theme.palette.success.main} />
                          ) : (
                            <ArrowDown size={10} color={theme.palette.error.main} />
                          )}
                          <Typography
                            variant="caption"
                            color={item.trend === 'up' ? 'success.main' : 'error.main'}
                            fontWeight={600}
                            sx={{ fontSize: '0.6rem' }}
                          >
                            {item.change}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ color: item.color, opacity: 0.7 }}>{item.icon}</Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Charts - Compact */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'background.paper'
            }}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.7rem', fontWeight: 500 }}>
                Weekly Trend
              </Typography>
              <ReactApexChart key={`line-compact-${mode}`} options={lineOptions} series={lineSeries} type="line" height={120} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'background.paper'
            }}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.7rem', fontWeight: 500 }}>
                Activity Distribution
              </Typography>
              <ReactApexChart key={`donut-compact-${mode}`} options={donutOptions} series={donutSeries} type="donut" height={100} />
            </CardContent>
          </Card>
        </Grid>

        {/* Action Button */}
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              fontSize: '0.75rem',
              py: 0.5,
              '&:hover': {
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText
              }
            }}
          >
            View Details
          </Button>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default TimesheetReportCompact;
