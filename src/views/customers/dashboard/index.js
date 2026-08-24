'use client';

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import CircularLoader from 'components/CircularLoader';
import { useGetCustomersDashboardCharts } from 'api/customers-dashboard';
import {
  Activity,
  ArrowRight2,
  Chart21,
  PresentionChart,
  ProfileCircle,
  Timer1,
  TruckFast,
  Warning2
} from 'iconsax-react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const formatHours = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
};

const ChartCard = ({ title, subtitle, href, color, loading, children, empty }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        transition: 'all .2s ease',
        '&:hover': {
          borderColor: alpha(color, 0.45),
          boxShadow: `0 14px 36px ${alpha(color, 0.12)}`
        }
      }}
    >
      <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Button
            component={Link}
            href={href || '#'}
            size="small"
            endIcon={<ArrowRight2 size={14} />}
            sx={{ textTransform: 'none', fontWeight: 700, color, minWidth: 0, px: 0.5 }}
          >
            Detail
          </Button>
        </Stack>

        {loading ? (
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} />
        ) : empty ? (
          <Box
            sx={{
              height: 240,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              bgcolor: alpha(color, 0.04),
              border: `1px dashed ${alpha(color, 0.25)}`
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Belum ada data pada periode ini
            </Typography>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

const KpiCard = ({ label, value, unit, icon: Icon, color }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(145deg, ${alpha(color, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 65%)`
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(color, 0.14),
              color
            }}
          >
            <Icon size={22} variant="Bold" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="baseline">
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {value}
              </Typography>
              {unit ? (
                <Typography variant="caption" color="text.secondary">
                  {unit}
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function CustomersDashboardScreen() {
  const theme = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data, dataLoading, dataError } = useGetCustomersDashboardCharts();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login-customers');
      return;
    }

    if (status === 'authenticated') {
      const isCustomer =
        session?.authPortal === 'customers' ||
        String(session?.usertype || '').toLowerCase() === 'customers';
      if (!isCustomer) {
        router.push('/home');
      }
    }
  }, [status, session, router]);

  const mode = theme.palette.mode;
  const isDark = mode === 'dark';

  const eventOptions = useMemo(() => {
    const labels = (data?.event_history?.categories || []).map((item) => item.label);
    return {
      chart: { type: 'donut', fontFamily: theme.typography.fontFamily, toolbar: { show: false } },
      labels,
      colors: ['#e53935', '#fb8c00', '#43a047', '#1e88e5', '#8e24aa', '#00897b', '#6d4c41', '#546e7a', '#fdd835'],
      legend: {
        position: 'bottom',
        fontSize: '12px',
        labels: { colors: theme.palette.text.secondary }
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: [theme.palette.background.paper] },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Jam',
                formatter: () => formatHours(data?.event_history?.total_hours || 0)
              }
            }
          }
        }
      },
      tooltip: {
        y: { formatter: (val) => `${formatHours(val)} jam` }
      }
    };
  }, [data, theme]);

  const eventSeries = useMemo(
    () => (data?.event_history?.categories || []).map((item) => Number(item.hours) || 0),
    [data]
  );

  const operatingOptions = useMemo(() => {
    const categories = (data?.operating_history?.units || []).map((item) => item.code);
    return {
      chart: {
        type: 'bar',
        fontFamily: theme.typography.fontFamily,
        toolbar: { show: false },
        parentHeightOffset: 0
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '62%'
        }
      },
      colors: ['#00897b'],
      dataLabels: { enabled: false },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } }
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: theme.palette.text.secondary, fontSize: '11px' }
        }
      },
      yaxis: {
        labels: {
          style: { colors: theme.palette.text.primary, fontSize: '11px', fontWeight: 600 }
        }
      },
      tooltip: {
        y: { formatter: (val) => `${formatHours(val)} jam` }
      }
    };
  }, [data, theme]);

  const operatingSeries = useMemo(
    () => [
      {
        name: 'DA Operating',
        data: (data?.operating_history?.units || []).map((item) => Number(item.hours) || 0)
      }
    ],
    [data]
  );

  const productivityRadarOptions = useMemo(() => {
    const categories = (data?.productivity?.metrics || []).map((item) => item.label);
    return {
      chart: {
        type: 'radar',
        fontFamily: theme.typography.fontFamily,
        toolbar: { show: false }
      },
      colors: ['#ef6c00'],
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      markers: { size: 4 },
      xaxis: {
        categories,
        labels: {
          style: { colors: categories.map(() => theme.palette.text.secondary), fontSize: '12px', fontWeight: 600 }
        }
      },
      yaxis: {
        show: false,
        min: 0,
        max: 100
      },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: theme.palette.divider,
            connectorColors: theme.palette.divider,
            fill: {
              colors: isDark ? ['#111827', '#0f172a'] : ['#ffffff', '#f8fafc']
            }
          }
        }
      },
      tooltip: {
        y: { formatter: (val) => `${formatHours(val)}%` }
      }
    };
  }, [data, theme, isDark]);

  const productivityRadarSeries = useMemo(
    () => [
      {
        name: 'Rata-rata',
        data: (data?.productivity?.metrics || []).map((item) => Number(item.value) || 0)
      }
    ],
    [data]
  );

  const productivityBarOptions = useMemo(() => {
    const categories = (data?.productivity?.top_units || []).map((item) => item.code);
    return {
      chart: {
        type: 'bar',
        stacked: false,
        fontFamily: theme.typography.fontFamily,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5
        }
      },
      colors: ['#ef6c00', '#1565c0', '#00897b'],
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 4
      },
      xaxis: {
        categories,
        labels: { style: { colors: theme.palette.text.secondary, fontSize: '11px' } }
      },
      yaxis: {
        max: 100,
        labels: {
          formatter: (val) => `${Math.round(val)}%`,
          style: { colors: theme.palette.text.secondary, fontSize: '11px' }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: { colors: theme.palette.text.secondary }
      },
      tooltip: {
        y: { formatter: (val) => `${formatHours(val)}%` }
      }
    };
  }, [data, theme]);

  const productivityBarSeries = useMemo(() => {
    const units = data?.productivity?.top_units || [];
    return [
      { name: 'PA', data: units.map((item) => Number(item.PA) || 0) },
      { name: 'UA', data: units.map((item) => Number(item.UA) || 0) },
      { name: 'EU', data: units.map((item) => Number(item.EU) || 0) }
    ];
  }, [data]);

  if (status === 'loading') {
    return <CircularLoader />;
  }

  const pelangganNama =
    data?.profile?.nama || session?.pelanggan_nama || session?.nama || session?.name || '-';
  const pelangganKode = data?.profile?.kode || session?.pelanggan_kode || '-';
  const periodLabel = data?.period
    ? `${data.period.startdate} s/d ${data.period.enddate}`
    : 'Periode berjalan';

  const summary = data?.summary || {};

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha('#1565c0', 0.1)} 0%, ${alpha('#00897b', 0.08)} 100%)`
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                Halo, {pelangganNama}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ringkasan performa unit Anda. Periode data: <strong>{periodLabel}</strong>
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={session?.usertype || 'customers'} size="small" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {dataError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Gagal memuat data chart dashboard.
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Unit Terekspos"
            value={dataLoading ? '—' : summary.equipment_count || 0}
            unit="unit"
            icon={TruckFast}
            color="#1565c0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Total Operating"
            value={dataLoading ? '—' : formatHours(summary.total_operating_hours)}
            unit="jam"
            icon={Timer1}
            color="#00897b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Total Breakdown"
            value={dataLoading ? '—' : formatHours(summary.total_breakdown_hours)}
            unit="jam"
            icon={Warning2}
            color="#e53935"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Rata-rata PA"
            value={dataLoading ? '—' : formatHours(summary.avg_pa)}
            unit="%"
            icon={PresentionChart}
            color="#ef6c00"
          />
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Insight Laporan
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Event History"
            subtitle="Komposisi jam event per kategori"
            href="/customers/event-history"
            color="#1565c0"
            loading={dataLoading}
            empty={!eventSeries.length}
          >
            <Box sx={{ minHeight: 260 }}>
              <ReactApexChart options={eventOptions} series={eventSeries} type="donut" height={260} />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Activity size={16} color="#1565c0" />
              <Typography variant="caption" color="text.secondary">
                Total event hours: {formatHours(data?.event_history?.total_hours)} jam
              </Typography>
            </Stack>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard
            title="Operating History"
            subtitle="Top unit berdasarkan jam operating (DA)"
            href="/customers/operating-history"
            color="#00897b"
            loading={dataLoading}
            empty={!operatingSeries[0]?.data?.length}
          >
            <Box sx={{ minHeight: 260 }}>
              <ReactApexChart options={operatingOptions} series={operatingSeries} type="bar" height={260} />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chart21 size={16} color="#00897b" />
              <Typography variant="caption" color="text.secondary">
                Total operating: {formatHours(data?.operating_history?.total_hours)} jam
              </Typography>
            </Stack>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <ChartCard
            title="Productivity Metrics"
            subtitle="Rata-rata PA · MA · UA · EU"
            href="/customers/productivity"
            color="#ef6c00"
            loading={dataLoading}
            empty={!(data?.productivity?.metrics || []).length}
          >
            <Box sx={{ minHeight: 280 }}>
              <ReactApexChart
                options={productivityRadarOptions}
                series={productivityRadarSeries}
                type="radar"
                height={280}
              />
            </Box>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <ChartCard
            title="Top Unit by PA"
            subtitle="Perbandingan PA, UA, dan EU per unit"
            href="/customers/productivity"
            color="#ef6c00"
            loading={dataLoading}
            empty={!(data?.productivity?.top_units || []).length}
          >
            <Box sx={{ minHeight: 280 }}>
              <ReactApexChart
                options={productivityBarOptions}
                series={productivityBarSeries}
                type="bar"
                height={280}
              />
            </Box>
          </ChartCard>
        </Grid>

        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha('#6a1b9a', 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 55%)`
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha('#6a1b9a', 0.14),
                      color: '#6a1b9a'
                    }}
                  >
                    <ProfileCircle size={24} variant="Bold" />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      Profil Pelanggan
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pelangganNama} · {pelangganKode}
                      {data?.profile?.phone ? ` · ${data.profile.phone}` : ''}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    color={String(data?.profile?.aktif || 'Y').toUpperCase() === 'Y' ? 'success' : 'default'}
                    label={String(data?.profile?.aktif || 'Y').toUpperCase() === 'Y' ? 'Aktif' : 'Nonaktif'}
                  />
                  <Button
                    component={Link}
                    href="/customers/profile"
                    variant="outlined"
                    color="secondary"
                    endIcon={<ArrowRight2 size={14} />}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                  >
                    Update Profile
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
