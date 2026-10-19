'use client';

import { useMemo, useState } from 'react';
import moment from 'moment';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { TruckFast, Setting2, WalletMoney, Timer1 } from 'iconsax-react';

import { useHomeDashboard } from 'api/home-dashboard';
import HeroHeader from './components/HeroHeader';
import KpiCard from './components/KpiCard';
import MaintenanceSection from './components/MaintenanceSection';
import SparepartSection from './components/SparepartSection';
import PrAgingCard from './components/PrAgingCard';
import DashboardGrid, { DashboardGridItem } from './components/DashboardGrid';
import { formatNumber, formatMinutes, formatCurrency, normalizePolarBreakdown } from './utils';

export default function HomeDashboard() {
  const [filters, setFilters] = useState(() => ({ date_ops: moment().format('YYYY-MM-DD'), cabang_id: '', unitcabang: '' }));
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const dash = useHomeDashboard(filters);
  const polar = useMemo(() => normalizePolarBreakdown(dash.maintenance.polar.data), [dash.maintenance.polar.data]);
  const payments = dash.finance.payments;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (await dash.refresh()) setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  const topKpis = [
    {
      key: 'ritase', label: 'Ritase', value: formatNumber(dash.ritase.data?.ritase_daily_total),
      helper: `MTD ${formatNumber(dash.ritase.data?.ritase_monthly_cumulative)} rit`,
      icon: <TruckFast size={22} variant="Bold" />, color: 'primary',
      loading: dash.ritase.loading, error: dash.ritase.error, href: '/panel/produksi-pit-cycle-time-monitoring'
    },
    {
      key: 'cycle', label: 'Cycle Time', value: formatMinutes(dash.ritase.data?.cycle_time?.avg),
      helper: `Min ${formatMinutes(dash.ritase.data?.cycle_time?.min)} · Max ${formatMinutes(dash.ritase.data?.cycle_time?.max)}`,
      icon: <Timer1 size={22} variant="Bold" />, color: 'info',
      loading: dash.ritase.loading, error: dash.ritase.error, href: '/panel/produksi-pit-cycle-time-monitoring'
    },
    {
      key: 'breakdown', label: 'Breakdown', value: formatNumber(polar.open),
      helper: 'Breakdown aktif · belum DONE', icon: <Setting2 size={22} variant="Bold" />, color: 'error',
      loading: dash.maintenance.polar.loading, error: dash.maintenance.polar.error, href: '/panel/breakdown'
    },
    {
      key: 'payments', label: 'Pending Pembayaran', value: formatNumber(payments.summary?.pending),
      helper: `${formatCurrency(payments.summary?.pending_amount)} · Status 0`,
      icon: <WalletMoney size={22} variant="Bold" />, color: 'warning',
      loading: payments.loading, error: payments.error, href: '/orders-payments'
    }
  ];

  return (
    <Box sx={{ width: '100%', pb: 3 }}>
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <HeroHeader filters={filters} setFilters={setFilters} lastUpdated={lastUpdated} onRefresh={onRefresh} refreshing={refreshing} />

        <Box component="section" aria-labelledby="home-kpi-heading">
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography id="home-kpi-heading" variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
              Top KPI Snapshot
            </Typography>
            <Typography variant="caption" color="text.secondary">Ringkasan utama</Typography>
          </Stack>
          <DashboardGrid gap={2} columns={{ xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))' }}>
            {topKpis.map(({ key, ...props }) => <DashboardGridItem key={key}><KpiCard {...props} /></DashboardGridItem>)}
          </DashboardGrid>
        </Box>

        <DashboardGrid gap={2.5} columns={{ xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          <DashboardGridItem><PrAgingCard resource={dash.purchasing.prAging} /></DashboardGridItem>
          <DashboardGridItem><SparepartSection sparepart={dash.sparepart} /></DashboardGridItem>
        </DashboardGrid>

        <MaintenanceSection maintenance={dash.maintenance} />
      </Stack>
    </Box>
  );
}
