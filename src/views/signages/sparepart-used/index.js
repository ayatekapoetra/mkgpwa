'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import moment from 'moment';
import { PresentionChart } from 'iconsax-react';

import {
  endpoints,
  useGetPartUsedTopFrequencyHe,
  useGetPartUsedTopFrequencyDt,
  useGetPartUsedTopValueHe,
  useGetPartUsedTopValueDt,
  useGetPartUsedDailyTrend,
  useGetPartUsedByUnit,
  useGetPartUsedByCategory,
  useGetPartUsedGudangTopValue,
  useGetPartUsedGudangTopFrequency,
  useGetPartUsedGudangDailyTrend,
  useGetPartUsedGudangHeatmapCategory,
  useGetPartUsedGudangTopSparepart,
  useGetPartUsedCabangBubbleAll,
  useGetPartUsedCabangDtBar,
  useGetPartUsedCabangHeBar,
  useGetPartUsedGudangRadarNullKdunit
} from 'api/part-used-charts';

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
import CabangDtBarChart from './CabangDtBarChart';
import CabangHeBarChart from './CabangHeBarChart';
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

export default function SparepartUsedScreen() {
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

  const paramsDt = useMemo(() => ({ ...params, ctgunit: 'DT' }), [params]);
  const paramsHe = useMemo(() => ({ ...params, ctgunit: 'HE' }), [params]);
  const paramsCabang = useMemo(() => (selectedUnitCabang ? { ...params, unitcabang: selectedUnitCabang } : params), [params, selectedUnitCabang]);
  const paramsDtCabang = useMemo(() => ({ ...paramsCabang, ctgunit: 'DT' }), [paramsCabang]);
  const paramsHeCabang = useMemo(() => ({ ...paramsCabang, ctgunit: 'HE' }), [paramsCabang]);

  const { data: topFrequencyHeData, loading: topFrequencyHeLoading, error: topFrequencyHeError } = useGetPartUsedTopFrequencyHe(params);
  const { data: topFrequencyDtData, loading: topFrequencyDtLoading, error: topFrequencyDtError } = useGetPartUsedTopFrequencyDt(params);
  const { data: topValueHeData, loading: topValueHeLoading, error: topValueHeError } = useGetPartUsedTopValueHe(params);
  const { data: topValueDtData, loading: topValueDtLoading, error: topValueDtError } = useGetPartUsedTopValueDt(params);
  const { data: dailyTrendData, loading: dailyTrendLoading, error: dailyTrendError } = useGetPartUsedDailyTrend(params);
  const { data: byUnitDtData, loading: byUnitDtLoading, error: byUnitDtError } = useGetPartUsedByUnit(paramsDt);
  const { data: byUnitHeData, loading: byUnitHeLoading, error: byUnitHeError } = useGetPartUsedByUnit(paramsHe);
  const { data: byCategoryDtData, loading: byCategoryDtLoading, error: byCategoryDtError } = useGetPartUsedByCategory(paramsDt);
  const { data: byCategoryHeData, loading: byCategoryHeLoading, error: byCategoryHeError } = useGetPartUsedByCategory(paramsHe);
  const { data: byUnitDtCabangData, loading: byUnitDtCabangLoading, error: byUnitDtCabangError } = useGetPartUsedByUnit(paramsDtCabang);
  const { data: byUnitHeCabangData, loading: byUnitHeCabangLoading, error: byUnitHeCabangError } = useGetPartUsedByUnit(paramsHeCabang);
  const { data: gudangTopValueData, loading: gudangTopValueLoading, error: gudangTopValueError } = useGetPartUsedGudangTopValue(params);
  const { data: gudangTopFrequencyData, loading: gudangTopFrequencyLoading, error: gudangTopFrequencyError } = useGetPartUsedGudangTopFrequency(params);
  const { data: gudangDailyTrendData, loading: gudangDailyTrendLoading, error: gudangDailyTrendError } = useGetPartUsedGudangDailyTrend(params);
  const { data: gudangHeatmapCategoryData, loading: gudangHeatmapCategoryLoading, error: gudangHeatmapCategoryError } = useGetPartUsedGudangHeatmapCategory(params);
  const { data: gudangTopSparepartData, loading: gudangTopSparepartLoading, error: gudangTopSparepartError } = useGetPartUsedGudangTopSparepart(params);
  const { data: cabangBubbleAllData, loading: cabangBubbleAllLoading, error: cabangBubbleAllError } = useGetPartUsedCabangBubbleAll(params);
  const { data: cabangDtBarData, loading: cabangDtBarLoading, error: cabangDtBarError } = useGetPartUsedCabangDtBar(params);
  const { data: cabangHeBarData, loading: cabangHeBarLoading, error: cabangHeBarError } = useGetPartUsedCabangHeBar(params);
  const { data: gudangRadarNullKdunitData, loading: gudangRadarNullKdunitLoading, error: gudangRadarNullKdunitError } = useGetPartUsedGudangRadarNullKdunit(params);

  const hasApiError = Boolean(topFrequencyHeError || topFrequencyDtError || topValueHeError || topValueDtError || dailyTrendError || byUnitDtError || byUnitHeError || byCategoryDtError || byCategoryHeError || byUnitDtCabangError || byUnitHeCabangError || gudangTopValueError || gudangTopFrequencyError || gudangDailyTrendError || gudangHeatmapCategoryError || gudangTopSparepartError || cabangBubbleAllError || cabangDtBarError || cabangHeBarError || gudangRadarNullKdunitError);

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

  const slides = useMemo(
    () => [
      { key: 'daily-trend', title: 'Tren Harian Pemakaian', content: <DailyTrendChart data={dailyTrendData} loading={dailyTrendLoading} /> },
      { key: 'top-frequency-he', title: 'Top 20 Frekuensi (HE)', content: <TopFrequencyChart data={topFrequencyHeData} loading={topFrequencyHeLoading} /> },
      { key: 'top-frequency-dt', title: 'Top 20 Frekuensi (DT)', content: <TopFrequencyChart data={topFrequencyDtData} loading={topFrequencyDtLoading} /> },
      { key: 'top-value-he', title: 'Top 20 Nilai Pemakaian (HE)', content: <TopValueChart data={topValueHeData} loading={topValueHeLoading} /> },
      { key: 'top-value-dt', title: 'Top 20 Nilai Pemakaian (DT)', content: <TopValueChart data={topValueDtData} loading={topValueDtLoading} /> },
      { key: 'by-unit-dt', title: 'Pemakaian per Unit Kategori DT', content: <ByUnitChart data={byUnitDtData} loading={byUnitDtLoading} /> },
      { key: 'by-unit-he', title: 'Pemakaian per Unit Kategori HE', content: <ByUnitChart data={byUnitHeData} loading={byUnitHeLoading} /> },
      { key: 'by-category-dt', title: 'Pemakaian per Kategori Barang DT', content: <ByCategoryChart data={byCategoryDtData} loading={byCategoryDtLoading} /> },
      { key: 'by-category-he', title: 'Pemakaian per Kategori Barang HE', content: <ByCategoryChart data={byCategoryHeData} loading={byCategoryHeLoading} /> },
      { key: 'gudang-top-value', title: 'Top Gudang by Nilai', content: <GudangTopValueChart data={gudangTopValueData} loading={gudangTopValueLoading} /> },
      { key: 'gudang-top-frequency', title: 'Top Gudang by Frekuensi', content: <GudangTopFrequencyChart data={gudangTopFrequencyData} loading={gudangTopFrequencyLoading} /> },
      { key: 'gudang-daily-trend', title: 'Tren Harian per Gudang', content: <GudangDailyTrendChart data={gudangDailyTrendData} loading={gudangDailyTrendLoading} /> },
      { key: 'gudang-heatmap-category', title: 'Heatmap Gudang vs Kategori', content: <GudangHeatmapCategoryChart data={gudangHeatmapCategoryData} loading={gudangHeatmapCategoryLoading} /> },
      { key: 'gudang-top-sparepart', title: 'Top Sparepart per Gudang', content: <GudangTopSparepartChart data={gudangTopSparepartData} loading={gudangTopSparepartLoading} /> },
      { key: 'cabang-bubble-all', title: 'Pemakaian Semua Unit per Cabang', content: <CabangBubbleAllChart data={cabangBubbleAllData} loading={cabangBubbleAllLoading} /> },
      { key: 'cabang-dt-bar', title: 'Pemakaian Unit DT per Cabang', content: <CabangDtBarChart data={cabangDtBarData} loading={cabangDtBarLoading} /> },
      { key: 'cabang-he-bar', title: 'Pemakaian Unit HE per Cabang', content: <CabangHeBarChart data={cabangHeBarData} loading={cabangHeBarLoading} /> },
      { key: 'gudang-radar-null-kdunit', title: 'Radar kdunit null per Gudang', content: <GudangRadarNullKdunitChart data={gudangRadarNullKdunitData} loading={gudangRadarNullKdunitLoading} /> }
    ],
    [
      byCategoryDtData,
      byCategoryDtLoading,
      byCategoryHeData,
      byCategoryHeLoading,
      byUnitDtData,
      byUnitDtLoading,
      byUnitHeData,
      byUnitHeLoading,
      dailyTrendData,
      dailyTrendLoading,
      topFrequencyDtData,
      topFrequencyDtLoading,
      topFrequencyHeData,
      topFrequencyHeLoading,
      topValueDtData,
      topValueDtLoading,
      topValueHeData,
      topValueHeLoading,
      gudangTopValueData,
      gudangTopValueLoading,
      gudangTopFrequencyData,
      gudangTopFrequencyLoading,
      gudangDailyTrendData,
      gudangDailyTrendLoading,
      gudangHeatmapCategoryData,
      gudangHeatmapCategoryLoading,
      gudangTopSparepartData,
      gudangTopSparepartLoading,
      cabangBubbleAllData,
      cabangBubbleAllLoading,
      cabangDtBarData,
      cabangDtBarLoading,
      cabangHeBarData,
      cabangHeBarLoading,
      gudangRadarNullKdunitData,
      gudangRadarNullKdunitLoading
    ]
  );

  useEffect(() => {
    if (!isSlideshow) return undefined;
    setRemainingSeconds(30);
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          const nextIndex = (currentSlideIndex + 1) % slides.length;
          refreshSlideData(slides[nextIndex]?.key);
          setCurrentSlideIndex(nextIndex);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSlideIndex, isSlideshow, slides]);

  const handleDateChange = (field, value) => setDateRange((prev) => ({ ...prev, [field]: value }));
  const handleApplyFilter = () => {};

  const buildUrl = (endpoint, p) => `${endpoint}?${new URLSearchParams(p).toString()}`;

  const refreshSlideData = (slideKey) => {
    const baseParams = { start_date: dateRange.start, end_date: dateRange.end, limit: 20, mode: 'raw' };
    if (slideKey === 'daily-trend') mutate(buildUrl(endpoints.dailyTrend, baseParams));
    if (slideKey === 'top-frequency-he') mutate(buildUrl(endpoints.topFrequencyHe, baseParams));
    if (slideKey === 'top-frequency-dt') mutate(buildUrl(endpoints.topFrequencyDt, baseParams));
    if (slideKey === 'top-value-he') mutate(buildUrl(endpoints.topValueHe, baseParams));
    if (slideKey === 'top-value-dt') mutate(buildUrl(endpoints.topValueDt, baseParams));
    if (slideKey === 'by-unit-dt') mutate(buildUrl(endpoints.byUnit, { ...baseParams, ctgunit: 'DT' }));
    if (slideKey === 'by-unit-he') mutate(buildUrl(endpoints.byUnit, { ...baseParams, ctgunit: 'HE' }));
    if (slideKey === 'by-category-dt') mutate(buildUrl(endpoints.byCategory, { ...baseParams, ctgunit: 'DT' }));
    if (slideKey === 'by-category-he') mutate(buildUrl(endpoints.byCategory, { ...baseParams, ctgunit: 'HE' }));
    if (slideKey === 'gudang-top-value') mutate(buildUrl(endpoints.gudangTopValue, baseParams));
    if (slideKey === 'gudang-top-frequency') mutate(buildUrl(endpoints.gudangTopFrequency, baseParams));
    if (slideKey === 'gudang-daily-trend') mutate(buildUrl(endpoints.gudangDailyTrend, baseParams));
    if (slideKey === 'gudang-heatmap-category') mutate(buildUrl(endpoints.gudangHeatmapCategory, baseParams));
    if (slideKey === 'gudang-top-sparepart') mutate(buildUrl(endpoints.gudangTopSparepart, baseParams));
    if (slideKey === 'cabang-bubble-all') mutate(buildUrl(endpoints.cabangBubbleAll, baseParams));
    if (slideKey === 'cabang-dt-bar') mutate(buildUrl(endpoints.cabangDtBar, baseParams));
    if (slideKey === 'cabang-he-bar') mutate(buildUrl(endpoints.cabangHeBar, baseParams));
    if (slideKey === 'gudang-radar-null-kdunit') mutate(buildUrl(endpoints.gudangRadarNullKdunit, baseParams));
  };

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
          <input type="date" value={dateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <span>to</span>
          <input type="date" value={dateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <button onClick={handleApplyFilter} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}>
            Apply
          </button>
          <button
            onClick={() => {
              setIsSlideshow((prev) => !prev);
              setCurrentSlideIndex(0);
              setRemainingSeconds(30);
            }}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: isSlideshow ? '#ef4444' : 'white', color: isSlideshow ? 'white' : '#1D2630', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PresentionChart size={18} variant="Bold" />
            {isSlideshow ? 'Stop' : 'Start'}
          </button>
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
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: perubahan intensitas pemakaian part dari hari ke hari dan titik lonjakan utama.</p>
                <div style={{ height: '250px' }}><DailyTrendChart data={dailyTrendData} loading={dailyTrendLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightDailyTrend(dailyTrendData)}</p>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <h3 style={{ marginTop: 0 }}>Top 20 Frekuensi Pemakaian (HE / DT)</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: part yang paling sering digunakan untuk melihat kebutuhan replenishment rutin.</p>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '520px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>HE</h4>
                      <div style={{ height: '430px' }}><TopFrequencyChart data={topFrequencyHeData} loading={topFrequencyHeLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightTopFrequency(topFrequencyHeData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '520px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>DT</h4>
                      <div style={{ height: '430px' }}><TopFrequencyChart data={topFrequencyDtData} loading={topFrequencyDtLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightTopFrequency(topFrequencyDtData)}</p>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <h3 style={{ marginTop: 0 }}>Top 20 Nilai Rupiah Pemakaian (HE / DT)</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: part dengan dampak biaya terbesar untuk prioritas kontrol cost.</p>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '520px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>HE</h4>
                      <div style={{ height: '430px' }}><TopValueChart data={topValueHeData} loading={topValueHeLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightTopValue(topValueHeData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '520px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>DT</h4>
                      <div style={{ height: '430px' }}><TopValueChart data={topValueDtData} loading={topValueDtLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightTopValue(topValueDtData)}</p>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '360px' }}>
                <h3>Pemakaian per Unit Kategori DT</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: unit DT dengan konsumsi part tertinggi untuk deteksi beban maintenance armada DT.</p>
                <div style={{ height: '270px' }}><ByUnitChart data={byUnitDtData} loading={byUnitDtLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightByUnit(byUnitDtData)}</p>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '360px' }}>
                <h3>Pemakaian per Unit Kategori HE</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: unit HE dengan konsumsi part tertinggi untuk deteksi beban maintenance alat berat.</p>
                <div style={{ height: '270px' }}><ByUnitChart data={byUnitHeData} loading={byUnitHeLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightByUnit(byUnitHeData)}</p>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '420px' }}>
                <h3>Pemakaian per Kategori Barang DT</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: kategori part dominan yang menyerap volume dan biaya pada unit kategori DT.</p>
                <div style={{ height: '330px' }}><ByCategoryChart data={byCategoryDtData} loading={byCategoryDtLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightByCategory(byCategoryDtData)}</p>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '420px' }}>
                <h3>Pemakaian per Kategori Barang HE</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: kategori part dominan yang menyerap volume dan biaya pada unit kategori HE.</p>
                <div style={{ height: '330px' }}><ByCategoryChart data={byCategoryHeData} loading={byCategoryHeLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightByCategory(byCategoryHeData)}</p>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <h3 style={{ marginTop: 0 }}>Analisis Pemakaian per Gudang</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: perbandingan aktivitas, biaya, dan pola konsumsi part antar gudang.</p>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Top Gudang by Nilai</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: gudang dengan kontribusi biaya pemakaian terbesar.</p>
                      <div style={{ height: '280px' }}><GudangTopValueChart data={gudangTopValueData} loading={gudangTopValueLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightGudangTopValue(gudangTopValueData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Top Gudang by Frekuensi</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: gudang paling aktif berdasarkan jumlah transaksi pemakaian part.</p>
                      <div style={{ height: '280px' }}><GudangTopFrequencyChart data={gudangTopFrequencyData} loading={gudangTopFrequencyLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightGudangTopFrequency(gudangTopFrequencyData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '480px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Tren Harian per Gudang</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: dinamika nilai pemakaian per gudang untuk melihat pola beban harian.</p>
                      <div style={{ height: '360px' }}><GudangDailyTrendChart data={gudangDailyTrendData} loading={gudangDailyTrendLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightGudangDaily(gudangDailyTrendData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Heatmap Gudang vs Kategori</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: kategori part dominan pada masing-masing gudang.</p>
                      <div style={{ height: '300px' }}><GudangHeatmapCategoryChart data={gudangHeatmapCategoryData} loading={gudangHeatmapCategoryLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightHeatmap(gudangHeatmapCategoryData)}</p>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '400px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Top Sparepart per Gudang</h4>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: perbedaan pola part cepat habis antar gudang.</p>
                      <div style={{ height: '300px' }}><GudangTopSparepartChart data={gudangTopSparepartData} loading={gudangTopSparepartLoading} /></div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightTopSparepartGudang(gudangTopSparepartData)}</p>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '560px' }}>
                <h3 style={{ marginTop: 0 }}>Analisis Pemakaian per Cabang</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: perbandingan beban pemakaian part antar cabang untuk seluruh unit dan kategori unit spesifik.</p>
                <Paper variant="outlined" sx={{ p: 1.5, height: '480px' }}>
                  <p style={{ margin: '8px 0 8px', fontSize: 12, color: '#64748b' }}>Insight: line menampilkan nilai pemakaian per unitcabang, dengan line frekuensi pada sumbu Y2.</p>
                  <div style={{ height: '390px' }}><CabangBubbleAllChart data={cabangBubbleAllData} loading={cabangBubbleAllLoading} /></div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightCabangBubble(cabangBubbleAllData)}</p>
                </Paper>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper sx={{ p: 2, height: '560px' }}>
                <h3 style={{ marginTop: 0 }}>Pemakaian kdunit null per Gudang</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: distribusi nilai pemakaian barang yang tidak memiliki kdunit pada setiap gudang.</p>
                <div style={{ height: '470px' }}>
                  <GudangRadarNullKdunitChart data={gudangRadarNullKdunitData} loading={gudangRadarNullKdunitLoading} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightGudangNullKdunit(gudangRadarNullKdunitData)}</p>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper variant="outlined" sx={{ p: 1.5, height: '380px' }}>
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>Pemakaian Unit Kategori DT per Cabang</h4>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: peringkat cabang dengan biaya pemakaian tertinggi khusus unit kategori DT.</p>
                <div style={{ height: '290px' }}><CabangDtBarChart data={cabangDtBarData} loading={cabangDtBarLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightCabangBar(cabangDtBarData, 'DT')}</p>
              </Paper>
            </Grid>
            <Grid item md={6} xs={12}>
              <Paper variant="outlined" sx={{ p: 1.5, height: '380px' }}>
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>Pemakaian Unit Kategori HE per Cabang</h4>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: peringkat cabang dengan biaya pemakaian tertinggi khusus unit kategori HE.</p>
                <div style={{ height: '290px' }}><CabangHeBarChart data={cabangHeBarData} loading={cabangHeBarLoading} /></div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{insightCabangBar(cabangHeBarData, 'HE')}</p>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <h3 style={{ margin: 0 }}>Nilai Pemakaian Equipment per Unit Cabang</h3>
                  <div>
                    <input
                      list="unitcabang-options"
                      value={selectedUnitCabang}
                      onChange={(e) => setSelectedUnitCabang(e.target.value)}
                      placeholder="Cari / pilih unitcabang"
                      style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', background: 'white', minWidth: 240 }}
                    />
                    <datalist id="unitcabang-options">
                      {unitCabangOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                </Stack>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>Insight: perbandingan nilai pemakaian barang per equipment (kdunit) pada unit cabang terpilih, dipisah kategori DT dan HE.</p>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '430px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Kategori DT (X: kdunit, Y: Nilai Juta)</h4>
                      <div style={{ height: '350px' }}><EquipmentValueByCabangChart data={byUnitDtCabangData} loading={byUnitDtCabangLoading} color="rgba(37,99,235,0.85)" /></div>
                    </Paper>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '430px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Kategori HE (X: kdunit, Y: Nilai Juta)</h4>
                      <div style={{ height: '350px' }}><EquipmentValueByCabangChart data={byUnitHeCabangData} loading={byUnitHeCabangLoading} color="rgba(5,150,105,0.85)" /></div>
                    </Paper>
                  </Grid>
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
