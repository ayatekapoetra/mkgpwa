'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { Box1, ChartSquare, Category } from 'iconsax-react';
import SectionCard from './SectionCard';
import DashboardGrid, { DashboardGridItem } from './DashboardGrid';
import { formatCurrency, formatNumber, toNumber, pickArray } from '../utils';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function SparepartSection({ sparepart }) {
  const theme = useTheme();
  const trend = pickArray(sparepart?.partTrend?.data);
  const topHe = pickArray(sparepart?.partTopHe?.data).slice(0, 5);
  const topDt = pickArray(sparepart?.partTopDt?.data).slice(0, 5);
  const category = pickArray(sparepart?.partCategory?.data);
  const gudang = pickArray(sparepart?.partGudang?.data).slice(0, 5);

  const topParts = useMemo(() => {
    const mapItem = (r, type) => ({
      name: r.nama || r.nmbarang || r.part || r.name || '-',
      value: toNumber(r.total ?? r.nilai ?? r.value ?? r.amount),
      qty: toNumber(r.qty ?? r.frekuensi ?? r.count),
      type
    });
    return [...topHe.map((r) => mapItem(r, 'HE')), ...topDt.map((r) => mapItem(r, 'DT'))]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [topHe, topDt]);

  const trendChart = useMemo(() => {
    const labels = trend.map((r) => r.date || r.tanggal || r.day || r.label || '-');
    const values = trend.map((r) => toNumber(r.total ?? r.nilai ?? r.value ?? r.amount));
    return {
      series: [{ name: 'Nilai Sparepart', data: values }],
      options: {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
        stroke: { curve: 'smooth', width: 3 },
        colors: [theme.palette.secondary.main],
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
        dataLabels: { enabled: false },
        xaxis: {
          categories: labels,
          labels: { style: { colors: theme.palette.text.secondary, fontSize: '10px' }, rotate: -30 }
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
  }, [trend, theme]);

  const categoryChart = useMemo(() => {
    const rows = [...category]
      .map((r) => ({
        name: r.category || r.kategori || r.ctg || r.name || '-',
        value: toNumber(r.total ?? r.nilai ?? r.value ?? r.amount ?? r.count)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      series: rows.map((r) => r.value),
      options: {
        chart: { type: 'donut', fontFamily: theme.typography.fontFamily },
        labels: rows.map((r) => r.name),
        legend: { position: 'bottom', fontSize: '11px' },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Kategori',
                  formatter: () => formatNumber(rows.length)
                }
              }
            }
          }
        },
        stroke: { width: 0 }
      }
    };
  }, [category, theme]);

  const totalValue = topParts.reduce((s, p) => s + p.value, 0) ||
    trend.reduce((s, r) => s + toNumber(r.total ?? r.nilai ?? r.value), 0);

  const loading =
    sparepart?.partTrend?.loading ||
    sparepart?.partTopHe?.loading ||
    sparepart?.partCategory?.loading;

  return (
    <DashboardGrid
      gap={2.5}
      columns={{
        xs: '1fr',
        md: 'minmax(0, 5fr) minmax(0, 3fr) minmax(0, 4fr)'
      }}
    >
      <DashboardGridItem>
        <SectionCard
          title="Sparepart Usage Trend"
          subtitle={`Estimasi nilai ${formatCurrency(totalValue)}`}
          icon={<ChartSquare size={20} variant="Bold" />}
          loading={loading}
          actionHref="/panel/sparepart-used"
          color="secondary"
        >
          {trend.length ? (
            <ReactApexChart type="area" height={280} series={trendChart.series} options={trendChart.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Trend sparepart belum tersedia</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="By Category"
          subtitle="Distribusi pemakaian"
          icon={<Category size={20} variant="Bold" />}
          loading={sparepart?.partCategory?.loading}
          color="info"
        >
          {category.length ? (
            <ReactApexChart type="donut" height={280} series={categoryChart.series} options={categoryChart.options} />
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Kategori kosong</Typography>
            </Box>
          )}
        </SectionCard>
      </DashboardGridItem>

      <DashboardGridItem>
        <SectionCard
          title="High Cost Parts"
          subtitle="Top HE + DT by value"
          icon={<Box1 size={20} variant="Bold" />}
          loading={sparepart?.partTopHe?.loading || sparepart?.partTopDt?.loading}
          color="warning"
        >
          <Stack spacing={1.1}>
            {gudang.length > 0 && (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                {gudang.slice(0, 3).map((g, i) => (
                  <Chip
                    key={i}
                    size="small"
                    variant="outlined"
                    label={`${g.gudang || g.nama || g.kdgudang || 'Gudang'}: ${formatCurrency(g.total ?? g.nilai ?? g.value)}`}
                  />
                ))}
              </Stack>
            )}
            {topParts.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Belum ada data sparepart bernilai tinggi
              </Typography>
            ) : (
              topParts.map((p, idx) => (
                <Stack key={`${p.name}-${idx}`} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={650} noWrap>
                      {idx + 1}. {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.type} · qty {formatNumber(p.qty)}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" fontWeight={800} noWrap>
                    {formatCurrency(p.value)}
                  </Typography>
                </Stack>
              ))
            )}
          </Stack>
        </SectionCard>
      </DashboardGridItem>
    </DashboardGrid>
  );
}
