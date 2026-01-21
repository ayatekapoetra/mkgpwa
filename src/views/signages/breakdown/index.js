'use client';
import React, { useEffect, useState } from 'react';

// MATERIAL - UI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { PolarChartByCtEquipment } from './Charts';
import { useGetBreakdownChartPolar, useGetBreakdownChartLineDuration, useGetBreakdownTrendMonthly, useGetRepairTimeDistribution, useGetEquipmentPerformanceMatrix } from 'api/breakdown-charts';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useGetSignages } from 'api/signages';
import moment from 'moment';
import { usePublicCabang } from 'api/cabang';

// Refresh interval in milliseconds (3 minutes)
const REFRESH_INTERVAL = 180000;

export default function BreakdownScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000); // in seconds
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

  // Countdown timer for refetch
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return REFRESH_INTERVAL / 1000; // Reset to 3 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format countdown as MM:SS
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for circular progress
  const progressPercent = ((REFRESH_INTERVAL / 1000 - countdown) / (REFRESH_INTERVAL / 1000)) * 100;

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
        {/* Left Side - Date & Time */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {clock}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {tanggal}
          </Typography>
        </Stack>

        {/* Right Side - Refetch Countdown Timer */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'primary.main',
            borderRadius: 2
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex'
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  borderRadius: '50%',
                  background: `conic-gradient(rgba(255, 255, 255, 0.8) ${progressPercent}%, transparent ${progressPercent}%)`,
                  animation: countdown <= 10 ? 'pulse 1s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 }
                  }
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  right: 4,
                  bottom: 4,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: countdown <= 10 ? '0.9rem' : '0.75rem',
                    lineHeight: 1
                  }}
                >
                  {formatCountdown(countdown)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Stack>
            <Typography
              variant="caption"
              sx={{ color: 'white', fontWeight: 500, lineHeight: 1.2 }}
            >
              Auto-Refresh
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem', lineHeight: 1.2 }}
            >
              Data update in
            </Typography>
          </Stack>
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
