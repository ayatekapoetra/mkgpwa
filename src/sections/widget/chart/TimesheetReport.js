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
import Divider from '@mui/material/Divider';

// THIRD - PARTY
import ReactApexChart from 'react-apexcharts';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// ASSETS
import { ArrowUp, ArrowDown, Clock, Truck, User, Activity } from 'iconsax-react';

// ==============================|| CHART - TIMESHEET REPORT ||============================== //

const TimesheetReport = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [timeRange, setTimeRange] = useState('30');
  const [chartType, setChartType] = useState('combined');

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  // CHART OPTIONS - LINE CHART FOR TIMESHEET TRENDS
  const lineChartOptions = {
    chart: {
      type: 'line',
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false }
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
      width: [3, 3, 2]
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider
    },
    tooltip: {
      theme: mode === ThemeMode.DARK ? 'dark' : 'light',
      y: {
        formatter: (value) => `${value} hours`
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: theme.palette.text.secondary
      }
    },
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main]
  };

  // CHART OPTIONS - BAR CHART FOR EQUIPMENT USAGE
  const barChartOptions = {
    chart: {
      type: 'bar',
      height: 280,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '60%'
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Excavator', 'Dump Truck', 'Bulldozer', 'Loader', 'Grader'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: {
        text: 'Hours Used'
      },
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider
    },
    tooltip: {
      theme: mode === ThemeMode.DARK ? 'dark' : 'light',
      y: {
        formatter: (value) => `${value} hours`
      }
    },
    colors: [theme.palette.primary.main, theme.palette.success.main]
  };

  // CHART OPTIONS - DONUT CHART FOR ACTIVITY DISTRIBUTION
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    labels: ['Mining', 'Hauling', 'Maintenance', 'Standby', 'Other'],
    legend: {
      position: 'bottom',
      labels: {
        colors: theme.palette.text.secondary
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`
    },
    tooltip: {
      theme: mode === ThemeMode.DARK ? 'dark' : 'light'
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main
    ]
  };

  const [lineOptions, setLineOptions] = useState(lineChartOptions);
  const [barOptions, setBarOptions] = useState(barChartOptions);
  const [donutOptions, setDonutOptions] = useState(donutChartOptions);

  useEffect(() => {
    setLineOptions((prevState) => ({
      ...prevState,
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    }));
    setBarOptions((prevState) => ({
      ...prevState,
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    }));
    setDonutOptions((prevState) => ({
      ...prevState,
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    }));
  }, [mode, theme]);

  // Sample data - in real implementation, this would come from API
  const [lineSeries] = useState([
    {
      name: 'Total Hours',
      data: [45, 52, 48, 58, 55, 62, 50]
    },
    {
      name: 'Productive Hours',
      data: [38, 45, 42, 50, 48, 55, 43]
    },
    {
      name: 'Overtime Hours',
      data: [7, 7, 6, 8, 7, 7, 7]
    }
  ]);

  const [barSeries] = useState([
    {
      name: 'This Week',
      data: [120, 180, 95, 85, 65]
    },
    {
      name: 'Last Week',
      data: [110, 165, 88, 78, 60]
    }
  ]);

  const [donutSeries] = useState([35, 30, 15, 12, 8]);

  // Summary statistics
  const summaryData = [
    {
      title: 'Total Hours',
      value: '1,248',
      change: '+12.5%',
      trend: 'up',
      icon: <Clock size={24} />,
      color: 'primary.main'
    },
    {
      title: 'Active Equipment',
      value: '24',
      change: '+8.3%',
      trend: 'up',
      icon: <Truck size={24} />,
      color: 'success.main'
    },
    {
      title: 'Active Operators',
      value: '18',
      change: '-2.2%',
      trend: 'down',
      icon: <User size={24} />,
      color: 'warning.main'
    },
    {
      title: 'Efficiency Rate',
      value: '87.3%',
      change: '+5.1%',
      trend: 'up',
      icon: <Activity size={24} />,
      color: 'info.main'
    }
  ];

  return (
    <MainCard sx={{ height: '100%' }}>
      <Grid container spacing={2.5}>
        {/* Header */}
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Timesheet Analytics
            </Typography>
            <Stack direction="row" spacing={2}>
              <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth size="small">
                  <Select value={timeRange} onChange={handleTimeRangeChange}>
                    <MenuItem value={7}>Last 7 Days</MenuItem>
                    <MenuItem value={30}>Last 30 Days</MenuItem>
                    <MenuItem value={90}>Last 90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth size="small">
                  <Select value={chartType} onChange={handleChartTypeChange}>
                    <MenuItem value="combined">Combined View</MenuItem>
                    <MenuItem value="detailed">Detailed View</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Stack>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {summaryData.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          {item.title}
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {item.value}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                          {item.trend === 'up' ? (
                            <ArrowUp size={14} color={theme.palette.success.main} />
                          ) : (
                            <ArrowDown size={14} color={theme.palette.error.main} />
                          )}
                          <Typography variant="caption" color={item.trend === 'up' ? 'success.main' : 'error.main'} fontWeight={500}>
                            {item.change}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ color: item.color, opacity: 0.8 }}>{item.icon}</Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Weekly Hours Trend
              </Typography>
              <ReactApexChart options={lineOptions} series={lineSeries} type="line" height={300} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Activity Distribution
              </Typography>
              <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={250} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Equipment Usage Comparison
              </Typography>
              <ReactApexChart options={barOptions} series={barSeries} type="bar" height={250} />
            </CardContent>
          </Card>
        </Grid>

        {/* Action Button */}
        <Grid item xs={12}>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" justifyContent="center">
            <Button variant="contained" color="primary" size="large">
              View Detailed Report
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default TimesheetReport;
