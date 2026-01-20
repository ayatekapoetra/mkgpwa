'use client';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Import separated chart components
import LineChartDurationBreakdown from './LineChartDurationBreakdown';
import StackedBarChartBreakdown from './StackedBarChartBreakdown';
import BubbleChartDummy from './BubbleChartDummy';
import EquipmentPerformanceBubbleChart from './EquipmentPerformanceBubbleChart';

// Main component that orchestrates all breakdown charts
export function PolarChartByCtEquipment({ data, lineChartData, lineChartLoading, trendMonthlyData, trendMonthlyLoading, repairTimeData, repairTimeLoading, bubbleData, bubbleLoading }) {
  // Data is already grouped from backend with structure:
  // { ctgequipment: "DT", total: 22, items: [...], status_count: { WT: 20, WP: 1, WS: 1 } }

  const groupedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    console.log('🔍 Data from API (already grouped):', data);

    // Data is already grouped, just use it directly
    return data.map(item => ({
      ctgequipment: item.ctgequipment,
      total: item.total,
      status_count: item.status_count || { WT: 0, WP: 0, WS: 0, WV: 0, WTT: 0, IP: 0 }
    })).sort((a, b) => b.total - a.total);
  }, [data]);

  // Prepare chart data for categorySeries
  const chartCategories = groupedData.map(item => item.ctgequipment);

  // Status breakdown for each category
  const statusLabels = ['WT', 'WP', 'WS', 'WV', 'WTT', 'IP'];
  const statusPalette = {
    WT: '#1E88E5',
    WP: '#FBC02D',
    WS: '#43A047',
    WV: '#E53935',
    WTT: '#FB8C00',
    IP: '#8E24AA'
  };

  // Create series where each category (DT, HE, etc.) is a series
  // and each status (WT, WP, WS, etc.) is a point on the radar
  const categorySeries = chartCategories.map(cat => {
    const item = groupedData.find(g => g.ctgequipment === cat);
    return {
      name: cat,
      data: statusLabels.map(status => item?.status_count?.[status] || 0)
    };
  });

  console.log('📈 Category Series before filter:', categorySeries);

  // Filter out series with all zeros (no data)
  const validCategorySeries = categorySeries.filter(series =>
    series.data.some(value => value > 0)
  );

  console.log('✅ Valid Category Series:', validCategorySeries);

  return (
    <Grid container spacing={1} sx={{ mt: 0.5 }}>
      {/* Line Chart - Duration Breakdown per Category */}
      <LineChartDurationBreakdown
        data={lineChartData}
        loading={lineChartLoading}
      />

      {/* Stacked Horizontal Bar Chart - Status Breakdown per Category */}
      <StackedBarChartBreakdown
        data={data}
        validCategorySeries={validCategorySeries}
        statusLabels={statusLabels}
        statusPalette={statusPalette}
      />
      <BubbleChartDummy
        trendMonthlyData={trendMonthlyData}
        trendMonthlyLoading={trendMonthlyLoading}
        repairTimeData={repairTimeData}
        repairTimeLoading={repairTimeLoading}
      />
      <EquipmentPerformanceBubbleChart
        bubbleData={bubbleData}
        loading={bubbleLoading}
      />
    </Grid>
  );
}

// Legacy BreakdownCharts component (kept for backward compatibility)
export default function BreakdownCharts({ charts }) {
  const theme = useTheme();
  if (!charts) return null;

  const dates = charts.daily_series?.map((d) => d.date) || [];
  const totals = charts.daily_series?.map((d) => d.total) || [];

  const statusKeys = charts.daily_series_by_status ? Object.keys(charts.daily_series_by_status) : [];
  const statusPalette = { WT: '#1E88E5', WP: '#FBC02D', WS: '#43A047' };
  const byStatusSeries = statusKeys.map((k) => ({ name: k, data: charts.daily_series_by_status[k].map((d) => d.count), color: statusPalette[k] }));

  const catKeys = charts.daily_series_by_category ? Object.keys(charts.daily_series_by_category) : [];
  const catPalette = { DT: '#29B6F6', HE: '#AB47BC', LV: '#FFA726', LT: '#66BB6A' };
  const byCategorySeries = catKeys.map((k) => ({ name: k, data: charts.daily_series_by_category[k].map((d) => d.count), color: catPalette[k] }));

  const polarStatusLabels = ['WT','WS','WP','WV','WTT','IP'];
  const catsPolar = ['DT','HE'];
  const seriesPolar = catsPolar.map((cat) => ({
    name: cat,
    data: polarStatusLabels.map((s) => (charts.status_distribution_by_category?.[cat]?.[s] || 0))
  }));
  const seriesOthers = {
    name: 'Lainnya',
    data: polarStatusLabels.map((s) => {
      const allCats = charts.status_distribution_by_category || {};
      const sumAll = Object.values(allCats).reduce((acc, obj) => acc + (obj?.[s] || 0), 0);
      const sumKnown = (allCats['DT']?.[s] || 0) + (allCats['HE']?.[s] || 0);
      return Math.max(0, sumAll - sumKnown);
    })
  };
  const radarSeries = [...seriesPolar, seriesOthers];

  const topEqLabels = charts.top_equipment?.map((d) => d.kode || `EQ-${d.equipment_id}`) || [];
  const topEqValues = charts.top_equipment?.map((d) => d.count) || [];
  const topEqColors = charts.top_equipment?.map((d) => catPalette[d.kategori] || theme.palette.primary.main) || [];

  const issuesLabels = charts.top_issues?.map((d) => d.issue) || [];
  const issuesValues = charts.top_issues?.map((d) => d.count) || [];

  const locKeys = charts.breakdown_by_location_by_category?.map((d) => d.lokasi) || [];
  const locSeries = (charts.breakdown_by_location_by_category || []).reduce((acc, row) => {
    Object.entries(row.kategori || {}).forEach(([cat, count]) => {
      let s = acc.find((x) => x.name === cat);
      if (!s) { s = { name: cat, data: Array(locKeys.length).fill(0), color: catPalette[cat] }; acc.push(s); }
      const idx = locKeys.indexOf(row.lokasi);
      if (idx >= 0) s.data[idx] = count;
    });
    return acc;
  }, []);

  const durationValues = charts.duration_distribution?.values || [];
  const techLabels = charts.technician_workload?.map((d) => d.nama) || [];
  const techValues = charts.technician_workload?.map((d) => d.jobs) || [];

  const baseChart = {
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    foreColor: theme.palette.text.secondary
  };

  return (
    <Grid container spacing={1} sx={{ mt: 0.5 }}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Tren Breakdown Harian" subheader={`${charts.range?.start} s.d ${charts.range?.end}`} />
          <CardContent>
            <ReactApexChart
              type="line"
              height={360}
              series={[{ name: 'Total', data: totals, color: theme.palette.error.main }, ...byCategorySeries]}
              options={{
                chart: { id: 'bd-daily', ...baseChart },
                xaxis: { categories: dates, labels: { rotateAlways: false } },
                stroke: { curve: 'smooth', width: 3 },
                dataLabels: { enabled: false },
                grid: { strokeDashArray: 4 }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Status Breakdown (Polar)" />
          <CardContent>
            <ReactApexChart
              type="radar"
              height={360}
              series={radarSeries}
              options={{
                chart: { ...baseChart },
                xaxis: { categories: polarStatusLabels },
                colors: [theme.palette.info.main, theme.palette.warning.main, theme.palette.grey[500]],
                dataLabels: { enabled: true },
                legend: { position: 'bottom' }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Tren per Status" />
          <CardContent>
            <ReactApexChart
              type="area"
              height={360}
              series={byStatusSeries}
              options={{
                chart: { id: 'bd-by-status', stacked: false, ...baseChart },
                xaxis: { categories: dates },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 3 },
                fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.4, opacityTo: 0.1 } },
                grid: { strokeDashArray: 4 }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Top 10 Equipment Paling Sering Breakdown" />
          <CardContent>
            <ReactApexChart
              type="bar"
              height={420}
              series={[{ name: 'Jumlah', data: topEqValues }]}
              options={{
                chart: { id: 'bd-top-eq', ...baseChart },
                plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4, distributed: true } },
                xaxis: { categories: topEqLabels, labels: { style: { fontSize: '14px' } } },
                colors: topEqColors,
                dataLabels: { enabled: true, style: { fontSize: '14px' } },
                grid: { strokeDashArray: 4 }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Top Issue Paling Sering" />
          <CardContent>
            <ReactApexChart
              type="bar"
              height={360}
              series={[{ name: 'Frekuensi', data: issuesValues, color: theme.palette.secondary.main }]}
              options={{
                chart: { ...baseChart },
                xaxis: { categories: issuesLabels, labels: { rotate: -30, trim: true } },
                plotOptions: { bar: { borderRadius: 4 } },
                dataLabels: { enabled: false },
                grid: { strokeDashArray: 4 }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Breakdown Berdasarkan Lokasi (per Kategori)" />
          <CardContent>
            <ReactApexChart
              type="bar"
              height={360}
              series={locSeries}
              options={{
                chart: { stacked: true, ...baseChart },
                xaxis: { categories: locKeys },
                plotOptions: { bar: { borderRadius: 4 } },
                dataLabels: { enabled: false },
                grid: { strokeDashArray: 4 }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Distribusi Durasi Perbaikan (menit)" />
          <CardContent>
            <ReactApexChart
              type="bar"
              height={360}
              series={[{ name: 'Durasi (menit)', data: durationValues }]}
              options={{
                chart: { ...baseChart },
                plotOptions: { bar: { columnWidth: '80%', borderRadius: 4 } },
                dataLabels: { enabled: false },
                xaxis: { title: { text: 'Menit' }, type: 'numeric' },
                grid: { strokeDashArray: 4 }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Workload Teknisi" />
          <CardContent>
            <ReactApexChart
              type="bar"
              height={360}
              series={[{ name: 'Jobs', data: techValues, color: theme.palette.info.main }]}
              options={{
                chart: { ...baseChart },
                xaxis: { categories: techLabels, labels: { rotate: -30 } },
                plotOptions: { bar: { borderRadius: 4 } },
                dataLabels: { enabled: true }
              }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
