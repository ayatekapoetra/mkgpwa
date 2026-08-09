'use client';

import { useMemo, useState, useCallback } from 'react';
import moment from 'moment';
import { mutate } from 'swr';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  TruckFast,
  Setting2,
  Profile2User,
  ShoppingCart,
  WalletMoney,
  Box1,
  Timer1,
  TickCircle
} from 'iconsax-react';

import { useHomeDashboard } from 'api/home-dashboard';
import HeroHeader from './components/HeroHeader';
import KpiCard from './components/KpiCard';
import ActionCenter from './components/ActionCenter';
import OperationsSection from './components/OperationsSection';
import MaintenanceSection from './components/MaintenanceSection';
import AttendanceSection from './components/AttendanceSection';
import FinanceScmSection from './components/FinanceScmSection';
import SparepartSection from './components/SparepartSection';
import DashboardGrid, { DashboardGridItem } from './components/DashboardGrid';
import {
  formatNumber,
  formatPercent,
  formatMinutes,
  formatCurrency,
  toNumber,
  calcAttendanceRate,
  normalizePolarBreakdown,
  normalizeApprovalRate,
  STATUS_ATTENDANCE,
  pickArray
} from './utils';

const defaultFilters = () => {
  const today = moment().format('YYYY-MM-DD');
  return {
    date_ops: today,
    cabang_id: '',
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: today,
    startmonth: moment().subtract(1, 'month').format('YYYY-MM'),
    endmonth: moment().format('YYYY-MM')
  };
};

export default function HomeDashboard() {
  const [filters, setFilters] = useState(defaultFilters);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const dash = useHomeDashboard(filters);

  const onRefresh = useCallback(() => {
    mutate(() => true);
    setLastUpdated(new Date());
  }, []);

  const polar = useMemo(
    () => normalizePolarBreakdown(dash.maintenance.polar?.data),
    [dash.maintenance.polar?.data]
  );

  const attendanceMix = useMemo(() => {
    const mixRaw = dash.attendance.statusMix?.data || {};
    const mix = mixRaw?.aggregate || mixRaw;
    const cabang = pickArray(dash.attendance.statusCabang?.data);
    const hasMix = ['H', 'L', 'C', 'I', 'S', 'A'].some((s) => toNumber(mix?.[s]) > 0);
    if (hasMix) return mix;
    const acc = { H: 0, L: 0, C: 0, I: 0, S: 0, A: 0 };
    cabang.forEach((c) => {
      Object.keys(acc).forEach((s) => {
        acc[s] += toNumber(c[s]);
      });
    });
    return acc;
  }, [dash.attendance.statusMix?.data, dash.attendance.statusCabang?.data]);

  const attendanceRate = calcAttendanceRate(attendanceMix);
  const approvalRate = normalizeApprovalRate(dash.purchasing.prApprovalRate?.data);
  const summaryBd = dash.maintenance.summaryBreakdown?.summary || {};
  const pengajuanSummary = dash.finance.pengajuan?.summary || {};

  const agingCount = pickArray(dash.purchasing.prAging?.data).reduce(
    (s, r) => s + toNumber(r.count ?? r.total ?? r.value),
    0
  );

  const unmatched =
    toNumber(dash.ritase.data?.unmatched?.pit) + toNumber(dash.ritase.data?.unmatched?.stockpile);

  const topKpis = [
    {
      key: 'ritase',
      label: 'Ritase Hari Ini',
      value: formatNumber(dash.ritase.data?.ritase_daily_total),
      helper: `MTD ${formatNumber(dash.ritase.data?.ritase_monthly_cumulative)}`,
      icon: <TruckFast size={22} variant="Bold" />,
      color: 'primary',
      loading: dash.ritase.loading,
      href: '/panel/produksi-pit-circle-time-monitoring'
    },
    {
      key: 'cycle',
      label: 'Avg Cycle Time',
      value: formatMinutes(dash.ritase.data?.cycle_time?.avg),
      helper: `Max ${formatMinutes(dash.ritase.data?.cycle_time?.max)}`,
      icon: <Timer1 size={22} variant="Bold" />,
      color: 'info',
      loading: dash.ritase.loading
    },
    {
      key: 'breakdown',
      label: 'Breakdown Open',
      value: formatNumber(polar.open || summaryBd.total_status_open),
      helper: `Close ${formatNumber(polar.closed || summaryBd.total_status_close)}`,
      icon: <Setting2 size={22} variant="Bold" />,
      color: 'error',
      loading: dash.maintenance.polar?.loading || dash.maintenance.summaryBreakdown?.dataLoading,
      href: '/panel/breakdown'
    },
    {
      key: 'attendance',
      label: 'Attendance Rate',
      value: formatPercent(attendanceRate),
      helper: `Alpha ${formatNumber(attendanceMix.A)} · Telat ${formatNumber(attendanceMix.L)}`,
      icon: <Profile2User size={22} variant="Bold" />,
      color: 'success',
      loading: dash.attendance.statusMix?.dataLoading || dash.attendance.statusCabang?.dataLoading,
      href: '/panel/kehadiran-karyawan'
    },
    {
      key: 'approval',
      label: 'Pending Approvals',
      value: formatNumber(
        toNumber(dash.finance.pengajuanApproval?.count) + toNumber(dash.crew.crewApproval?.count)
      ),
      helper: `Dana ${formatNumber(dash.finance.pengajuanApproval?.count)} · Crew ${formatNumber(dash.crew.crewApproval?.count)}`,
      icon: <TickCircle size={22} variant="Bold" />,
      color: 'warning',
      loading: dash.finance.pengajuanApproval?.loading || dash.crew.crewApproval?.loading,
      href: '/pengajuan-dana'
    },
    {
      key: 'pr',
      label: 'PR Approval Rate',
      value: formatPercent(approvalRate.rate),
      helper: `Aging docs ${formatNumber(agingCount)}`,
      icon: <ShoppingCart size={22} variant="Bold" />,
      color: 'secondary',
      loading: dash.purchasing.prApprovalRate?.loading,
      href: '/panel/purchasing-request'
    }
  ];

  const actionItems = [
    {
      id: 'pengajuan',
      title: 'Pengajuan Dana menunggu aksi',
      count: dash.finance.pengajuanApproval?.count,
      severity: 'warning',
      href: '/pengajuan-dana',
      description: `Open ${formatNumber(pengajuanSummary.open)} · Approval ${formatNumber(pengajuanSummary.approval)}`
    },
    {
      id: 'crew',
      title: 'Crew worksheet pending approval',
      count: dash.crew.crewApproval?.count,
      severity: 'info',
      href: '/crew-work-activity',
      description: 'Butuh review supervisor'
    },
    {
      id: 'breakdown',
      title: 'Breakdown masih open',
      count: polar.open || summaryBd.total_status_open,
      severity: 'error',
      href: '/panel/breakdown',
      description: `Equipment terdampak ${formatNumber(summaryBd.total_equipment || polar.total)}`
    },
    {
      id: 'unmatched',
      title: 'Ritase unmatched PIT/Stockpile',
      count: unmatched,
      severity: 'error',
      href: '/panel/produksi-pit-circle-time-monitoring',
      description: `PIT ${formatNumber(dash.ritase.data?.unmatched?.pit)} · SP ${formatNumber(dash.ritase.data?.unmatched?.stockpile)}`
    },
    {
      id: 'aging',
      title: 'PR aging / usia berkas',
      count: agingCount,
      severity: 'warning',
      href: '/panel/purchasing-request',
      description: 'Dokumen perlu follow-up purchasing'
    },
    {
      id: 'alpha',
      title: 'Karyawan alpha (periode)',
      count: attendanceMix.A,
      severity: 'warning',
      href: '/panel/kehadiran-karyawan',
      description: `${STATUS_ATTENDANCE.A.label} terdeteksi pada rekap absensi`
    }
  ];

  const spareTotalHint = useMemo(() => {
    const he = pickArray(dash.sparepart.partTopHe?.data);
    const dt = pickArray(dash.sparepart.partTopDt?.data);
    const sum = [...he, ...dt].reduce((s, r) => s + toNumber(r.total ?? r.nilai ?? r.value), 0);
    return sum;
  }, [dash.sparepart.partTopHe?.data, dash.sparepart.partTopDt?.data]);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 3, overflowX: 'hidden' }}>
      <Stack spacing={2.75} sx={{ width: '100%' }}>
        <HeroHeader
          filters={filters}
          setFilters={setFilters}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
        />

        <Box sx={{ width: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Top KPI Snapshot
          </Typography>
          <DashboardGrid
            gap={2}
            columns={{
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3, 1fr)',
              xl: 'repeat(6, 1fr)'
            }}
          >
            {topKpis.map(({ key: kpiKey, ...kpiProps }) => (
              <DashboardGridItem key={kpiKey}>
                <KpiCard {...kpiProps} />
              </DashboardGridItem>
            ))}
          </DashboardGrid>
        </Box>

        <DashboardGrid gap={2.5} columns={{ xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
          <DashboardGridItem>
            <OperationsSection ritase={dash.ritase} />
          </DashboardGridItem>
          <DashboardGridItem>
            <Stack spacing={2.5} sx={{ width: '100%' }}>
              <ActionCenter
                items={actionItems}
                loading={
                  dash.finance.pengajuanApproval?.loading ||
                  dash.crew.crewApproval?.loading ||
                  dash.ritase.loading ||
                  dash.maintenance.polar?.loading
                }
              />
              <KpiCard
                icon={<WalletMoney size={22} variant="Bold" />}
                label="Pengajuan Dana Total"
                value={formatNumber(pengajuanSummary.total_all)}
                helper={`Verified ${formatNumber(pengajuanSummary.verified)} · Rejected ${formatNumber(pengajuanSummary.rejected)}`}
                color="primary"
                loading={dash.finance.pengajuan?.loading}
                href="/pengajuan-dana"
              />
              <KpiCard
                icon={<Box1 size={22} variant="Bold" />}
                label="High-cost Sparepart (sample)"
                value={formatCurrency(spareTotalHint)}
                helper="Top HE + DT value"
                color="secondary"
                loading={dash.sparepart.partTopHe?.loading}
                href="/panel/sparepart-used"
              />
            </Stack>
          </DashboardGridItem>
        </DashboardGrid>

        <Box sx={{ width: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Reliability & Maintenance
          </Typography>
          <MaintenanceSection maintenance={dash.maintenance} />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            People Analytics
          </Typography>
          <AttendanceSection attendance={dash.attendance} />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Finance & Supply Chain
          </Typography>
          <FinanceScmSection finance={dash.finance} purchasing={dash.purchasing} crew={dash.crew} />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Sparepart Intelligence
          </Typography>
          <SparepartSection sparepart={dash.sparepart} />
        </Box>
      </Stack>
    </Box>
  );
}
