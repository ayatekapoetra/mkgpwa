'use client';
import React, { useEffect, useState } from 'react';

// MATERIAL - UI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { PolarChartByCtEquipment } from './Charts';
import { useGetBreakdownChartPolar, useGetBreakdownChartLineDuration, useGetBreakdownTrendMonthly, useGetRepairTimeDistribution, useGetEquipmentPerformanceMatrix } from 'api/breakdown-charts';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useGetSignages } from 'api/signages';
import moment from 'moment';
import { usePublicCabang } from 'api/cabang';

export default function BreakdownScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const { data: cabang, dataLoading: isLoading } = usePublicCabang();

  // UI State (tidak dikirim ke API)
  const [isGrid, setIsGrid] = useState(true);

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

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Compact Header with Stats and Controls */}
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ 
          mx: 1, 
          mt: 1, 
          mb: 0.5,
          flexWrap: 'wrap',
          gap: 1
        }}
      >

        {/* Controls - Horizontal with Clock */}
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
