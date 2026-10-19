'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import moment from 'moment';
import { PresentionChart } from 'iconsax-react';

import {
  endpoints,
  useGetPartUsedEquipmentCategory,
  useGetPartUsedDailyTrend,
  useGetPartUsedGudangTopValue,
  useGetPartUsedGudangTopFrequency,
  useGetPartUsedGudangDailyTrend,
  useGetPartUsedGudangHeatmapCategory,
  useGetPartUsedGudangTopSparepart,
  useGetPartUsedCabangBubbleAll,
  useGetPartUsedGudangRadarNullKdunit
} from 'api/part-used-charts';
import { EQUIPMENT_CATEGORIES, buildPartUsedChartUrl, getCategorySlideDefinitions } from 'api/part-used-chart-config';

import TopFrequencyChart from './TopFrequencyChart';
import TopValueChart from './TopValueChart';
import DailyTrendChart from './DailyTrendChart';
import ByUnitChart from './ByUnitChart';
import ByCategoryChart from './ByCategoryChart';
import GudangTopValueChart from './GudangTopValueChart';
import GudangTopFrequencyChart from './GudangTopFrequencyChart';
import GudangDailyTrendChart from './GudangDailyTrendChart';
import GudangHeatmapCategoryChart from './GudangHeatmapCategoryChart';
import GudangTopSparepartChart from './GudangTopSparepartChart';
import CabangBubbleAllChart from './CabangBubbleAllChart';
import CabangBarChart from './CabangBarChart';
import GudangRadarNullKdunitChart from './GudangRadarNullKdunitChart';
import EquipmentValueByCabangChart from './EquipmentValueByCabangChart';

const toNum = (v) => Number(v || 0);

const insightTopFrequency = (rows) => {
  if (!rows?.length) return 'Belum ada data frekuensi pemakaian pada periode ini.';
  const top = rows[0];
  return `Part paling sering dipakai: ${top.nmbarang || top.kdbarang} (${top.frequency} transaksi).`;
};

const insightTopValue = (rows) => {
  if (!rows?.length) return 'Belum ada data nilai pemakaian pada periode ini.';
  const top = rows[0];
  return `Kontributor biaya tertinggi: ${top.nmbarang || top.kdbarang} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightDailyTrend = (rows) => {
  if (!rows?.length) return 'Belum ada data tren harian pada periode ini.';
  const topDay = rows.reduce((a, b) => (toNum(b.total_value) > toNum(a.total_value) ? b : a), rows[0]);
  return `Puncak pemakaian terjadi pada ${topDay.date} dengan nilai Rp ${toNum(topDay.total_value).toLocaleString('id-ID')}.`;
};

const insightByUnit = (rows) => {
  if (!rows?.length) return 'Belum ada data pemakaian per unit pada periode ini.';
  const top = rows[0];
  return `Unit dengan biaya tertinggi: ${top.kdunit || 'UNASSIGNED'} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightByCategory = (rows) => {
  if (!rows?.length) return 'Belum ada data pemakaian per kategori pada periode ini.';
  const top = rows[0];
  return `Kategori paling dominan: ${top.ctgbarang || 'UNASSIGNED'} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightGudangTopValue = (rows) => {
  if (!rows?.length) return 'Belum ada data nilai per gudang pada periode ini.';
  const top = rows[0];
  return `Gudang penyerap biaya tertinggi: ${top.kdgudang} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightGudangTopFrequency = (rows) => {
  if (!rows?.length) return 'Belum ada data frekuensi per gudang pada periode ini.';
  const top = rows[0];
  return `Gudang paling aktif transaksi: ${top.kdgudang} (${top.frequency} transaksi).`;
};

const insightGudangDaily = (rows) => {
  if (!rows?.length) return 'Belum ada data tren harian gudang pada periode ini.';
  const top = rows.reduce((a, b) => (toNum(b.total_value) > toNum(a.total_value) ? b : a), rows[0]);
  return `Puncak harian gudang: ${top.kdgudang} pada ${top.date} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightHeatmap = (rows) => {
  if (!rows?.length) return 'Belum ada data heatmap gudang-kategori pada periode ini.';
  const top = rows.reduce((a, b) => (toNum(b.total_value) > toNum(a.total_value) ? b : a), rows[0]);
  return `Kombinasi tertinggi: ${top.kdgudang} x ${top.ctgbarang} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightTopSparepartGudang = (rows) => {
  if (!rows?.length) return 'Belum ada data top sparepart per gudang pada periode ini.';
  const firstGudang = rows[0];
  const topItem = firstGudang?.items?.[0];
  if (!topItem) return 'Belum ada item sparepart untuk dianalisis per gudang.';
  return `Contoh dominan: ${firstGudang.kdgudang} paling sering memakai ${topItem.nmbarang || topItem.kdbarang} (${topItem.frequency} transaksi).`;
};

const insightCabangBubble = (rows) => {
  if (!rows?.length) return 'Belum ada data pemakaian per cabang pada periode ini.';
  const top = rows.reduce((a, b) => (toNum(b.total_value) > toNum(a.total_value) ? b : a), rows[0]);
  return `Cabang dengan bubble terbesar: ${top.unitcabang || top.kdcabang} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightCabangBar = (rows, label) => {
  if (!rows?.length) return `Belum ada data pemakaian kategori ${label} per cabang pada periode ini.`;
  const top = rows[0];
  return `Cabang tertinggi kategori ${label}: ${top.unitcabang || top.kdcabang} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const insightGudangNullKdunit = (rows) => {
  if (!rows?.length) return 'Tidak ada pemakaian dengan kdunit null pada periode ini.';
  const top = rows[0];
  return `Gudang tertinggi untuk kdunit null: ${top.kdgudang} (Rp ${toNum(top.total_value).toLocaleString('id-ID')}).`;
};

const categoryChartComponents = {
  topFrequency: TopFrequencyChart,
  topValue: TopValueChart,
  byUnit: ByUnitChart,
  byCategory: ByCategoryChart,
  cabang: CabangBarChart
};

export default function SparepartUsedScreen() {
  const { palette } = useTheme();
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [selectedUnitCabang, setSelectedUnitCabang] = useState('');

  const [dateRange, setDateRange] = useState({
    start: moment().subtract(3, 'months').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });

  const params = useMemo(
    () => ({ start_date: dateRange.start, end_date: dateRange.end, limit: 20, mode: 'raw' }),
    [dateRange.end, dateRange.start]
  );

  const heCharts = useGetPartUsedEquipmentCategory('HE', params, selectedUnitCabang);
  const dtCharts = useGetPartUsedEquipmentCategory('DT', params, selectedUnitCabang);
  const mdCharts = useGetPartUsedEquipmentCategory('MD', params, selectedUnitCabang);
  const adCharts = useGetPartUsedEquipmentCategory('AD', params, selectedUnitCabang);
  const categoryCharts = useMemo(() => [heCharts, dtCharts, mdCharts, adCharts].map((charts) => ({
    ...charts,
    color: EQUIPMENT_CATEGORIES.find((category) => category.code === charts.code).color
  })), [heCharts, dtCharts, mdCharts, adCharts]);

  const { data: dailyTrendData, average: dailyTrendAverage, loading: dailyTrendLoading, error: dailyTrendError } = useGetPartUsedDailyTrend(params);
  const { data: gudangTopValueData, average: gudangTopValueAverage, loading: gudangTopValueLoading, error: gudangTopValueError } = useGetPartUsedGudangTopValue(params);
  const { data: gudangTopFrequencyData, average: gudangTopFrequencyAverage, loading: gudangTopFrequencyLoading, error: gudangTopFrequencyError } = useGetPartUsedGudangTopFrequency(params);
  const { data: gudangDailyTrendData, average: gudangDailyTrendAverage, loading: gudangDailyTrendLoading, error: gudangDailyTrendError } = useGetPartUsedGudangDailyTrend(params);
  const { data: gudangHeatmapCategoryData, average: gudangHeatmapCategoryAverage, loading: gudangHeatmapCategoryLoading, error: gudangHeatmapCategoryError } = useGetPartUsedGudangHeatmapCategory(params);
  const { data: gudangTopSparepartData, average: gudangTopSparepartAverage, loading: gudangTopSparepartLoading, error: gudangTopSparepartError } = useGetPartUsedGudangTopSparepart(params);
  const { data: cabangBubbleAllData, average: cabangBubbleAllAverage, loading: cabangBubbleAllLoading, error: cabangBubbleAllError } = useGetPartUsedCabangBubbleAll(params);
  const { data: gudangRadarNullKdunitData, average: gudangRadarNullKdunitAverage, loading: gudangRadarNullKdunitLoading, error: gudangRadarNullKdunitError } = useGetPartUsedGudangRadarNullKdunit(params);

  const hasCategoryError = categoryCharts.some((charts) => ['topFrequency', 'topValue', 'byUnit', 'byCategory', 'cabang', 'equipmentByCabang'].some((field) => charts[field].error));
  const hasApiError = Boolean(hasCategoryError || dailyTrendError || gudangTopValueError || gudangTopFrequencyError || gudangDailyTrendError || gudangHeatmapCategoryError || gudangTopSparepartError || cabangBubbleAllError || gudangRadarNullKdunitError);

  const unitCabangOptions = useMemo(() => {
    const set = new Set((cabangBubbleAllData || []).map((r) => r.unitcabang).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cabangBubbleAllData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [clock]);

  const categorySlides = (field) => categoryCharts.flatMap((charts) => getCategorySlideDefinitions(charts)
    .filter((slide) => slide.field === field)
    .map((slide) => {
      const Chart = categoryChartComponents[field];
      return { ...slide, content: <Chart {...charts[field]} category={charts.code} color={charts.color} /> };
    }));
  const slides = [
    { key: 'daily-trend', title: 'Tren Harian Pemakaian', url: buildPartUsedChartUrl(endpoints.dailyTrend, params), content: <DailyTrendChart data={dailyTrendData} average={dailyTrendAverage} loading={dailyTrendLoading} /> },
    ...categorySlides('topFrequency'),
    ...categorySlides('topValue'),
    ...categorySlides('byUnit'),
    ...categorySlides('byCategory'),
    { key: 'gudang-top-value', title: 'Top Gudang by Nilai', url: buildPartUsedChartUrl(endpoints.gudangTopValue, params), content: <GudangTopValueChart data={gudangTopValueData} average={gudangTopValueAverage} loading={gudangTopValueLoading} /> },
    { key: 'gudang-top-frequency', title: 'Top Gudang by Frekuensi', url: buildPartUsedChartUrl(endpoints.gudangTopFrequency, params), content: <GudangTopFrequencyChart data={gudangTopFrequencyData} average={gudangTopFrequencyAverage} loading={gudangTopFrequencyLoading} /> },
    { key: 'gudang-daily-trend', title: 'Tren Harian per Gudang', url: buildPartUsedChartUrl(endpoints.gudangDailyTrend, params), content: <GudangDailyTrendChart data={gudangDailyTrendData} average={gudangDailyTrendAverage} loading={gudangDailyTrendLoading} /> },
    { key: 'gudang-heatmap-category', title: 'Heatmap Gudang vs Kategori', url: buildPartUsedChartUrl(endpoints.gudangHeatmapCategory, params), content: <GudangHeatmapCategoryChart data={gudangHeatmapCategoryData} average={gudangHeatmapCategoryAverage} loading={gudangHeatmapCategoryLoading} /> },
    { key: 'gudang-top-sparepart', title: 'Top Sparepart per Gudang', url: buildPartUsedChartUrl(endpoints.gudangTopSparepart, params), content: <GudangTopSparepartChart data={gudangTopSparepartData} average={gudangTopSparepartAverage} loading={gudangTopSparepartLoading} /> },
    { key: 'cabang-bubble-all', title: 'Pemakaian Semua Unit per Cabang', url: buildPartUsedChartUrl(endpoints.cabangBubbleAll, params), content: <CabangBubbleAllChart data={cabangBubbleAllData} average={cabangBubbleAllAverage} loading={cabangBubbleAllLoading} /> },
    ...categorySlides('cabang'),
    { key: 'gudang-radar-null-kdunit', title: 'Radar kdunit null per Gudang', url: buildPartUsedChartUrl(endpoints.gudangRadarNullKdunit, params), content: <GudangRadarNullKdunitChart data={gudangRadarNullKdunitData} average={gudangRadarNullKdunitAverage} loading={gudangRadarNullKdunitLoading} /> }
  ];
  const activeSlideUrl = slides[currentSlideIndex]?.url;

  useEffect(() => {
    if (!isSlideshow) return undefined;
    const timeout = setTimeout(() => {
      if (remainingSeconds <= 1) {
        setCurrentSlideIndex((index) => (index + 1) % slides.length);
        setRemainingSeconds(30);
      } else {
        setRemainingSeconds(remainingSeconds - 1);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [isSlideshow, remainingSeconds, slides.length]);

  useEffect(() => {
    if (isSlideshow && activeSlideUrl) mutate(activeSlideUrl);
  }, [isSlideshow, activeSlideUrl]);

  const handleDateChange = (field, value) => setDateRange((prev) => ({ ...prev, [field]: value }));
  const handleApplyFilter = () => {};

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Stack>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Sparepart Used</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" type="date" label="Dari" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} />
          <span>to</span>
          <TextField size="small" type="date" label="Sampai" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} />
          <Button variant="contained" onClick={handleApplyFilter}>
            Apply
          </Button>
          <Button
            variant="outlined"
            color={isSlideshow ? 'error' : 'primary'}
            startIcon={<PresentionChart size={18} variant="Bold" />}
            onClick={() => {
              setIsSlideshow((prev) => !prev);
              setCurrentSlideIndex(0);
              setRemainingSeconds(30);
            }}
          >
            {isSlideshow ? 'Stop' : 'Start'}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ flex: 1, p: 1, overflow: 'auto', backgroundColor: 'background.default' }}>
        {hasApiError ? (
          <Paper sx={{ p: 2 }}>
            <h3 style={{ marginTop: 0 }}>Gagal memuat chart sparepart used</h3>
            <p style={{ marginBottom: 0 }}>Periksa endpoint backend `part-used` atau filter tanggal yang digunakan.</p>
          </Paper>
        ) : !isSlideshow ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: '340px' }}>
                <h3>Tren Harian Pemakaian</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: perubahan intensitas pemakaian part dari hari ke hari dan titik lonjakan utama.</p>
                <div style={{ height: '250px' }}><DailyTrendChart data={dailyTrendData} average={dailyTrendAverage} loading={dailyTrendLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightDailyTrend(dailyTrendData)}</p>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <h3 style={{ marginTop: 0 }}>Top 20 Frekuensi Pemakaian (HE / DT / MD / AD)</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: part yang paling sering digunakan untuk melihat kebutuhan replenishment rutin.</p>
                <Grid container spacing={2}>
                  {categoryCharts.map((charts) => (
                    <Grid item md={6} xs={12} key={charts.code}>
                      <Paper variant="outlined" sx={{ p: 1.5, height: '520px' }}>
                        <h4 style={{ marginTop: 0, marginBottom: 8 }}>{charts.code}</h4>
                        <div style={{ height: '430px' }}><TopFrequencyChart {...charts.topFrequency} /></div>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightTopFrequency(charts.topFrequency.data)}</p>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <h3 style={{ marginTop: 0 }}>Top 20 Nilai Rupiah Pemakaian (HE / DT / MD / AD)</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: part dengan dampak biaya terbesar untuk prioritas kontrol cost.</p>
                <Grid container spacing={2}>
                  {categoryCharts.map((charts) => (
                    <Grid item md={6} xs={12} key={charts.code}>
                      <Paper variant="outlined" sx={{ p: 1.5, height: '520px' }}>
                        <h4 style={{ marginTop: 0, marginBottom: 8 }}>{charts.code}</h4>
                        <div style={{ height: '430px' }}><TopValueChart {...charts.topValue} /></div>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightTopValue(charts.topValue.data)}</p>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
            {categoryCharts.map((charts) => (
              <Grid item md={6} xs={12} key={`by-unit-${charts.code}`}>
                <Paper sx={{ p: 2, height: '360px' }}>
                  <h3>Pemakaian per Unit Kategori {charts.code}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: unit {charts.code} dengan konsumsi part tertinggi untuk deteksi beban maintenance.</p>
                  <div style={{ height: '270px' }}><ByUnitChart {...charts.byUnit} /></div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightByUnit(charts.byUnit.data)}</p>
                </Paper>
              </Grid>
            ))}
            {categoryCharts.map((charts) => (
              <Grid item md={6} xs={12} key={`by-category-${charts.code}`}>
                <Paper sx={{ p: 2, height: '420px' }}>
                  <h3>Pemakaian per Kategori Barang {charts.code}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: kategori part dominan yang menyerap volume dan biaya pada unit kategori {charts.code}.</p>
                  <div style={{ height: '330px' }}><ByCategoryChart {...charts.byCategory} /></div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightByCategory(charts.byCategory.data)}</p>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <h3 style={{ marginTop: 0 }}>Analisis Pemakaian per Gudang</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: perbandingan aktivitas, biaya, dan pola konsumsi part antar gudang.</p>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Top Gudang by Nilai</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: gudang dengan kontribusi biaya pemakaian terbesar.</p>
                      <div style={{ height: '280px' }}><GudangTopValueChart data={gudangTopValueData} average={gudangTopValueAverage} loading={gudangTopValueLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightGudangTopValue(gudangTopValueData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Top Gudang by Frekuensi</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: gudang paling aktif berdasarkan jumlah transaksi pemakaian part.</p>
                      <div style={{ height: '280px' }}><GudangTopFrequencyChart data={gudangTopFrequencyData} average={gudangTopFrequencyAverage} loading={gudangTopFrequencyLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightGudangTopFrequency(gudangTopFrequencyData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '480px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Tren Harian per Gudang</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: dinamika nilai pemakaian per gudang untuk melihat pola beban harian.</p>
                      <div style={{ height: '360px' }}><GudangDailyTrendChart data={gudangDailyTrendData} average={gudangDailyTrendAverage} loading={gudangDailyTrendLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightGudangDaily(gudangDailyTrendData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Heatmap Gudang vs Kategori</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: kategori part dominan pada masing-masing gudang.</p>
                      <div style={{ height: '300px' }}><GudangHeatmapCategoryChart data={gudangHeatmapCategoryData} average={gudangHeatmapCategoryAverage} loading={gudangHeatmapCategoryLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightHeatmap(gudangHeatmapCategoryData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Top Sparepart per Gudang</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: perbedaan pola part cepat habis antar gudang.</p>
                      <div style={{ height: '300px' }}><GudangTopSparepartChart data={gudangTopSparepartData} average={gudangTopSparepartAverage} loading={gudangTopSparepartLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightTopSparepartGudang(gudangTopSparepartData)}</p>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '560px' }}>
                <h3 style={{ marginTop: 0 }}>Analisis Pemakaian per Cabang</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: perbandingan beban pemakaian part antar cabang untuk seluruh unit dan kategori unit spesifik.</p>
                <Paper variant="outlined" sx={{ p: 1.5, height: '480px' }}>
                  <p style={{ margin: '8px 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: line menampilkan nilai pemakaian per unitcabang, dengan line frekuensi pada sumbu Y2.</p>
                  <div style={{ height: '390px' }}><CabangBubbleAllChart data={cabangBubbleAllData} average={cabangBubbleAllAverage} loading={cabangBubbleAllLoading} /></div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightCabangBubble(cabangBubbleAllData)}</p>
                </Paper>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '560px' }}>
                <h3 style={{ marginTop: 0 }}>Pemakaian kdunit null per Gudang</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: distribusi nilai pemakaian barang yang tidak memiliki kdunit pada setiap gudang.</p>
                <div style={{ height: '470px' }}>
                  <GudangRadarNullKdunitChart data={gudangRadarNullKdunitData} average={gudangRadarNullKdunitAverage} loading={gudangRadarNullKdunitLoading} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightGudangNullKdunit(gudangRadarNullKdunitData)}</p>
              </Paper>
            </Grid>
            {categoryCharts.map((charts) => (
              <Grid item md={6} xs={12} key={`cabang-${charts.code}`}>
                <Paper variant="outlined" sx={{ p: 1.5, height: '380px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: 8 }}>Pemakaian Unit Kategori {charts.code} per Cabang</h4>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: peringkat cabang dengan biaya pemakaian tertinggi khusus unit kategori {charts.code}.</p>
                  <div style={{ height: '290px' }}><CabangBarChart {...charts.cabang} category={charts.code} color={charts.color} /></div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: palette.text.secondary }}>{insightCabangBar(charts.cabang.data, charts.code)}</p>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <h3 style={{ margin: 0 }}>Nilai Pemakaian Equipment per Unit Cabang</h3>
                  <div>
                    <TextField
                      size="small"
                      inputProps={{ list: 'unitcabang-options' }}
                      value={selectedUnitCabang}
                      onChange={(e) => setSelectedUnitCabang(e.target.value)}
                      placeholder="Cari / pilih unitcabang"
                      sx={{ minWidth: 240 }}
                    />
                    <datalist id="unitcabang-options">
                      {unitCabangOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                </Stack>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: palette.text.secondary }}>Insight: perbandingan nilai pemakaian barang per equipment (kdunit) pada unit cabang terpilih, dipisah kategori HE, DT, MD, dan AD.</p>
                <Grid container spacing={2}>
                  {categoryCharts.map((charts) => (
                    <Grid item md={6} xs={12} key={charts.code}>
                      <Paper variant="outlined" sx={{ p: 1.5, height: '430px' }}>
                        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Kategori {charts.code} (X: kdunit, Y: Nilai Juta)</h4>
                        <div style={{ height: '350px' }}><EquipmentValueByCabangChart data={charts.equipmentByCabang.data} loading={charts.equipmentByCabang.loading} color={charts.color} /></div>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <div style={{ padding: '16px', height: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <h3 style={{ margin: 0 }}>{slides[currentSlideIndex]?.title || 'Slideshow'}</h3>
              <span style={{ fontWeight: 600 }}>{`00:${String(remainingSeconds).padStart(2, '0')}`}</span>
            </Stack>
            <div style={{ flex: 1, minHeight: '60vh' }}>{slides[currentSlideIndex]?.content}</div>
          </div>
        )}
      </Paper>
    </Stack>
  );
}
