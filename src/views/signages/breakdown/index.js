'use client';
import React, { useEffect, useState } from 'react';

// MATERIAL - UI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PolarChartByCtEquipment } from './Charts';
import { useGetBreakdownChartPolar, useGetBreakdownChartLineDuration, useGetBreakdownTrendMonthly, useGetRepairTimeDistribution, useGetEquipmentPerformanceMatrix } from 'api/breakdown-charts';
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

  // UI State (tidak dikirim ke API)
  const [isGrid, setIsGrid] = useState(true);

  // Header filter + slideshow
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(31, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [isSlideshow, setIsSlideshow] = useState(false);

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
  const { data: bubbleData, loading: bubbleLoading } = useGetEquipmentPerformanceMatrix({ cabang_id: apiParams.cabang_id });
  const hasPolarData = polarChartData && Array.isArray(polarChartData) && polarChartData.length > 0;

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

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    // TODO: integrate with breakdown API when date filters are supported
    console.log('Apply filter:', dateRange);
  };

  const handleToggleSlideshow = () => {
    setIsSlideshow(prev => !prev);
  };

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
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateChange('start', e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateChange('end', e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleApplyFilter}
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}
          >
            Apply
          </button>
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
          overflow: 'auto',
          backgroundColor: 'transparent',
          boxShadow: 'none'
        }}
      >
        {!dataLoading && (
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
                bubbleData={bubbleData}
                bubbleLoading={bubbleLoading}
              />
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
}
