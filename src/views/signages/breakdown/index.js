'use client';
import React, { useEffect, useMemo, useState } from 'react';

// MATERIAL - UI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PolarChartByCtEquipment } from './Charts';
import LineChartDurationBreakdown from './LineChartDurationBreakdown';
import StackedBarChartBreakdown from './StackedBarChartBreakdown';
import BubbleChartDummy from './BubbleChartDummy';
import { useGetBreakdownChartPolar, useGetBreakdownChartLineDuration, useGetBreakdownTrendMonthly, useGetRepairTimeDistribution } from 'api/breakdown-charts';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useGetSignages } from 'api/signages';
import moment from 'moment';
import { usePublicCabang } from 'api/cabang';
import { PresentionChart } from 'iconsax-react';

export default function BreakdownScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const { data: cabang, dataLoading: isLoading } = usePublicCabang();

  // Slideshow
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  // API Params (hanya yang dibutuhkan backend)
  const [apiParams, setApiParams] = useState({
    cabang_id: 2,
    ctg: 'HE',
    page: 1,
    perPage: 8
  });

  const { data, dataLoading } = useGetSignages(apiParams);
  const { data: polarChartData, error: polarError } = useGetBreakdownChartPolar({ cabang_id: apiParams.cabang_id });
  const { data: lineChartData, loading: lineChartLoading } = useGetBreakdownChartLineDuration({ cabang_id: apiParams.cabang_id });
  const { data: trendMonthlyData, loading: trendMonthlyLoading } = useGetBreakdownTrendMonthly({ cabang_id: apiParams.cabang_id });
  const { data: repairTimeData, loading: repairTimeLoading } = useGetRepairTimeDistribution({ cabang_id: apiParams.cabang_id });
  const hasPolarData = polarChartData && Array.isArray(polarChartData) && polarChartData.length > 0;

  // Derived for stacked bar (reuse from Charts)
  const statusLabels = ['WT', 'WP', 'WS', 'WV', 'WTT', 'IP'];
  const statusPalette = {
    WT: '#1E88E5',
    WP: '#FBC02D',
    WS: '#43A047',
    WV: '#E53935',
    WTT: '#FB8C00',
    IP: '#8E24AA'
  };

  const validCategorySeries = useMemo(() => {
    if (!Array.isArray(polarChartData)) return [];
    const grouped = polarChartData.map(item => ({
      ctgequipment: item.ctgequipment,
      total: item.total,
      status_count: item.status_count || { WT: 0, WP: 0, WS: 0, WV: 0, WTT: 0, IP: 0 }
    })).sort((a, b) => b.total - a.total);

    const categorySeries = grouped.map(cat => ({
      name: cat.ctgequipment,
      data: statusLabels.map(s => cat.status_count?.[s] || 0)
    }));

    return categorySeries.filter(series => series.data.some(v => v > 0));
  }, [polarChartData]);

  // Debug polar chart data
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🎯 Breakdown Index - Polar Chart Data:', {
      polarChartData,
      polarError,
      hasPolarData,
      dataType: Array.isArray(polarChartData) ? 'Array' : typeof polarChartData,
      dataLength: Array.isArray(polarChartData) ? polarChartData.length : 'N/A'
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [clock]);

  const handleToggleSlideshow = () => {
    setIsSlideshow(prev => !prev);
    setCurrentSlideIndex(0);
    setRemainingSeconds(30);
  };

  // Slideshow data (order of charts)
  const slides = useMemo(() => [
    {
      key: 'stacked-bar',
      title: 'Status Breakdown per Kategori',
      content: (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <StackedBarChartBreakdown
            data={polarChartData}
            validCategorySeries={validCategorySeries}
            statusLabels={statusLabels}
            statusPalette={statusPalette}
            fullHeight
            fullWidth
          />
        </div>
      )
    },
    {
      key: 'line-duration',
      title: 'Durasi Breakdown per Equipment',
      content: (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <LineChartDurationBreakdown data={lineChartData} loading={lineChartLoading} fullHeight fullWidth />
        </div>
      )
    },
    {
      key: 'trend-monthly',
      title: 'Trend Bulanan',
      content: (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <BubbleChartDummy
            trendMonthlyData={trendMonthlyData}
            trendMonthlyLoading={trendMonthlyLoading}
            repairTimeData={null}
            repairTimeLoading={false}
            fullHeight
            fullWidth
            mode="trend"
          />
        </div>
      )
    },
    {
      key: 'repair-time',
      title: 'Distribusi Waktu Perbaikan',
      content: (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <BubbleChartDummy
            trendMonthlyData={null}
            trendMonthlyLoading={false}
            repairTimeData={repairTimeData}
            repairTimeLoading={repairTimeLoading}
            fullHeight
            fullWidth
            mode="repair"
          />
        </div>
      )
    }
  ], [polarChartData, validCategorySeries, lineChartData, lineChartLoading, trendMonthlyData, trendMonthlyLoading, repairTimeData, repairTimeLoading]);

  // Slideshow timer
  useEffect(() => {
    if (!isSlideshow) return undefined;

    setRemainingSeconds(30);

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          const nextIndex = (currentSlideIndex + 1) % slides.length;
          setCurrentSlideIndex(nextIndex);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSlideshow, currentSlideIndex, slides.length]);

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header (mirrors Purchasing Request layout) */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Stack>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Breakdown Dashboard</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <button
            onClick={handleToggleSlideshow}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: isSlideshow ? '#ef4444' : 'white', color: isSlideshow ? 'white' : 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            aria-label={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
            title={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
          >
            <PresentionChart size={18} variant="Bold" />
            {isSlideshow ? 'Stop' : 'Start'}
          </button>
        </Stack>
      </Stack>

      {/* Main Content - Full Width */}
      <Paper 
        sx={{ 
          flex: 1, 
          m: 1, 
          mt: 0,
          maxHeight: 'calc(100vh - 16px)', 
          overflow: isSlideshow ? 'hidden' : 'auto',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {!dataLoading && (!isSlideshow ? (
          <>
            {/* Polar Chart by CtgEquipment - Display above the list */}
            {hasPolarData && (
              <PolarChartByCtEquipment
                data={polarChartData}
                lineChartData={lineChartData}
                lineChartLoading={lineChartLoading}
                trendMonthlyData={trendMonthlyData}
                trendMonthlyLoading={trendMonthlyLoading}
                repairTimeData={repairTimeData}
                repairTimeLoading={repairTimeLoading}
              />
            )}
          </>
        ) : (
          <div style={{ padding: '16px', flex: 1, minHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <h3 style={{ margin: 0 }}>{slides[currentSlideIndex]?.title || 'Slideshow'}</h3>
              <Stack direction="row" spacing={1} alignItems="center">
                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Next in</span>
                <span style={{ fontWeight: 600 }}>{`${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`}</span>
              </Stack>
            </Stack>
            <div style={{ flex: 1, minHeight: 0 }}>
              {slides[currentSlideIndex]?.content}
            </div>
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
              {slides.map((slide, idx) => (
                <button
                  key={slide.key}
                  onClick={() => { setCurrentSlideIndex(idx); setRemainingSeconds(30); }}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: 'none',
                    margin: 4,
                    background: idx === currentSlideIndex ? '#3b82f6' : '#d1d5db',
                    cursor: 'pointer'
                  }}
                  aria-label={`Go to slide ${slide.title}`}
                />
              ))}
            </Stack>
          </div>
        ))}
      </Paper>
    </Stack>
  );
}
