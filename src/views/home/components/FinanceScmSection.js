'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { WalletMoney, ShoppingCart, Clock, Shop } from 'iconsax-react';
import SectionCard from './SectionCard';
import DashboardGrid, { DashboardGridItem } from './DashboardGrid';
import {
  formatNumber,
  formatPercent,
  formatCurrency,
  toNumber,
  pickArray,
  normalizeApprovalRate,
  normalizeAvgDuration
} from '../utils';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function FinanceScmSection({ finance, purchasing, crew }) {
  const theme = useTheme();
  const summary = finance?.pengajuan?.summary || {};
  const approvalPending = toNumber(finance?.pengajuanApproval?.count);
  const crewPending = toNumber(crew?.crewApproval?.count);

  const statusRows = pickArray(purchasing?.prStatus?.data);
  const spendingRows = pickArray(purchasing?.prSpending?.data);
  const agingRows = pickArray(purchasing?.prAging?.data);
  const topSupplier = pickArray(purchasing?.prTopPemasok?.data).slice(0, 5);
  const approvalRate = normalizeApprovalRate(purchasing?.prApprovalRate?.data);
  const avgDuration = normalizeAvgDuration(purchasing?.prApprovalDuration?.data);

  const prDonut = useMemo(() => {
    const labels = statusRows.map((r) => r.status || r.name || r.label || '-');
    const series = statusRows.map((r) => toNumber(r.count ?? r.total ?? r.value));
    return {
      series,
      options: {
        chart: { type: 'donut', fontFamily: theme.typography.fontFamily },
        labels,
        colors: [
          theme.palette.primary.main,
          theme.palette.warning.main,
          theme.palette.success.main,
          theme.palette.error.main,
          theme.palette.info.main,
          theme.palette.secondary.main
        ],
        legend: { position: 'bottom', fontSize: '11px' },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'PR',
                  formatter: () => formatNumber(series.reduce((a, b) => a + b, 0))
                }
              }
            }
          }
        },
        stroke: { width: 0 }
      }
    };
  }, [statusRows, theme]);

  const spendingChart = useMemo(() => {
    const rows = [...spendingRows]
      .map((r) => ({
        name: r.cabang || r.nama_cabang || r.name || r.cabang_nama || '-',
        value: toNumber(r.total ?? r.spending ?? r.nilai ?? r.value ?? r.amount)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      series: [{ name: 'Spending', data: rows.map((r) => r.value) }],
      options: {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
        colors: [theme.palette.info.main],
        dataLabels: { enabled: false },
        xaxis: {
          categories: rows.map((r) => r.name),
          labels: { style: { colors: theme.palette.text.secondary, fontSize: '11px' }, rotate: -25 }
        },
        yaxis: {
          labels: {
            style: { colors: theme.palette.text.secondary },
            formatter: (v) => formatNumber(v / 1e6) + 'jt'
          }
        },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        tooltip: { y: { formatter: (v) => formatCurrency(v) } }
      }
    };
  }, [spendingRows, theme]);

  const danaDonut = useMemo(() => {
    const series = [
      toNumber(summary.open),
      toNumber(summary.approval),
      toNumber(summary.verified),
      toNumber(summary.rejected)
    ];
    return {
      series,
      options: {
        chart: { type: 'donut', fontFamily: theme.typography.fontFamily },
        labels: ['Open', 'Approval', 'Verified', 'Rejected'],
        colors: [
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.success.main,
          theme.palette.error.main
        ],
        legend: { position: 'bottom' },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total',
                  formatter: () => formatNumber(summary.total_all || series.reduce((a, b) => a + b, 0))
                }
              }
            }
          }
        },
        stroke: { width: 0 }
      }
    };
  }, [summary, theme]);

  const agingTotal = agingRows.reduce((s, r) => s + toNumber(r.count ?? r.total ?? r.value), 0);
  const crewOt = crew?.crewOvertime?.data;
  const otTotal = toNumber(
    crewOt?.total_overtime ??
      crewOt?.total ??
      crewOt?.summary?.total_overtime ??
      (Array.isArray(crewOt) ? crewOt.reduce((s, r) => s + toNumber(r.overtime ?? r.jam_lembur ?? r.total), 0) : 0)
  );

  const loading =
    finance?.pengajuan?.loading ||
    purchasing?.prStatus?.loading ||
    purchasing?.prSpending?.loading;

  return (
    <DashboardGrid gap={2.5} columns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
      <DashboardGridItem>
        <SectionCard
          title="Pengajuan Dana"
          subtitle="Status cash advance"
          icon={<WalletMoney size={20} variant="Bold" />}
          loading={finance?.pengajuan?.loading}
          actionHref="/pengajuan-dana"
          color="primary"
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="warning" label={`Need action ${formatNumber(approvalPending)}`} />
            <Chip size="small" variant="outlined" label={`Open ${formatNumber(summary.open)}`} />
            <Chip size="small" color="success" variant="light" label={`Verified ${formatNumber(summary.verified)}`} />
          </Stack>
          {toNumber(summary.total_all) || seriesHasValue(danaDonut.series) ? (
            <ReactApexChart type="donut" height={260} series={danaDonut.series} options={danaDonut.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Belum ada pengajuan dana</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="Purchasing Status"
          subtitle={`Approval rate ${formatPercent(approvalRate.rate)} · Avg ${formatNumber(avgDuration, 1)} jam`}
          icon={<ShoppingCart size={20} variant="Bold" />}
          loading={loading}
          actionHref="/panel/purchasing-request"
          color="info"
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="info" label={`Aging docs ${formatNumber(agingTotal)}`} />
            <Chip size="small" variant="outlined" label={`Crew OT pending ${formatNumber(crewPending)}`} />
            <Chip size="small" variant="outlined" label={`OT hours ${formatNumber(otTotal, 1)}`} />
          </Stack>
          {statusRows.length ? (
            <ReactApexChart type="donut" height={250} series={prDonut.series} options={prDonut.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Status PR belum tersedia</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <Stack spacing={2.5} sx={{ width: '100%' }}>
          <SectionCard
            title="Spending per Cabang"
            subtitle="Nilai purchasing"
            icon={<Shop size={20} variant="Bold" />}
            loading={purchasing?.prSpending?.loading}
            color="secondary"
            minHeight={220}
          >
            {spendingRows.length ? (
              <ReactApexChart type="bar" height={200} series={spendingChart.series} options={spendingChart.options} />
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Data spending kosong</Typography>
              </Box>
            )}
          </SectionCard>

          <SectionCard
            title="Top Supplier"
            subtitle="Nilai transaksi tertinggi"
            icon={<Clock size={20} variant="Bold" />}
            loading={purchasing?.prTopPemasok?.loading}
            color="warning"
            minHeight={200}
          >
            <Stack spacing={1}>
              {topSupplier.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  Belum ada data supplier
                </Typography>
              ) : (
                topSupplier.map((s, idx) => (
                  <Stack key={`${s.nama || s.pemasok || idx}`} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                      {idx + 1}. {s.nama || s.pemasok || s.name || '-'}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatCurrency(s.total ?? s.nilai ?? s.value ?? s.amount)}
                    </Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </DashboardGridItem>
    </DashboardGrid>
  );
}

function seriesHasValue(series = []) {
  return series.some((v) => toNumber(v) > 0);
}
