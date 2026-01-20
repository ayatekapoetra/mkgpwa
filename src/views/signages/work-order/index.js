'use client';

import React, { useEffect, useState, useRef } from 'react';

// MATERIAL - UI
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// PROJECT IMPORTS
import { useGetSignages } from 'api/signages';
import { usePublicCabang } from 'api/cabang';
import WorkOrderHeader from './components/WorkOrderHeader';
import WorkOrderList from './components/WorkOrderList';
import { API_DEFAULTS } from './utils/workOrderConstants';
import moment from 'moment';

// ==============================|| WORK ORDER SCREEN ||============================== //

export default function WorkOrderScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Clock & Date State
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));

  // API Params
  const [apiParams, setApiParams] = useState({
    cabang_id: API_DEFAULTS.CABANG_ID,
    ctg: API_DEFAULTS.CTG,
    page: API_DEFAULTS.PAGE,
    perPage: API_DEFAULTS.PER_PAGE
  });

  // Data Fetching
  const { data: cabang, dataLoading: isLoadingCabang } = usePublicCabang();
  const { data, rawData, lastPage, total, perPage, dataLoading, BDtot, WTtot, WPtot, WStot } = useGetSignages(apiParams);

  // Debug: Log full API response on mount
  useEffect(() => {
    if (rawData && !dataLoading) {
      console.log('[API Response] Full structure:', rawData);
      console.log('[API Response] data (array):', data);
      console.log('[API Response] lastPage:', lastPage);
      console.log('[API Response] total:', total);
      console.log('[API Response] perPage:', perPage);
    }
  }, [rawData, dataLoading]);

  // Use refs to avoid re-renders and dependency issues
  const lastPageRef = useRef(lastPage);
  const paramsRef = useRef(apiParams);
  const currentPageRef = useRef(1);

  // Keep refs in sync
  useEffect(() => {
    lastPageRef.current = lastPage;
  }, [lastPage]);

  useEffect(() => {
    paramsRef.current = apiParams;
  }, [apiParams]);

  // Sync currentPageRef when page changes externally (e.g., from filters, NOT from pagination timer)
  useEffect(() => {
    // Only sync if different (avoid infinite loop)
    if (currentPageRef.current !== apiParams.page) {
      currentPageRef.current = apiParams.page;
      setCurrentPage(apiParams.page);
    }
  }, [apiParams.page]);

  // Auto-pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Combined timer: handles both refresh (every 3 min) and pagination (every 1 min)
  useEffect(() => {
    let minuteCounter = 0;

    const interval = setInterval(() => {
      minuteCounter++;
      const lastPageValue = lastPageRef.current;
      const currentParams = paramsRef.current;

      const totalPages = lastPageValue || 1;

      console.log('[Pagination] Minute:', minuteCounter, 'Total pages:', totalPages, 'LastPage:', lastPageValue, 'Current page:', currentPageRef.current);

      // Check if this is a 3-minute mark (time to refresh)
      const isRefreshTime = minuteCounter % 3 === 0;

      if (isRefreshTime && totalPages > 1) {
        // At 3-minute mark, reset to page 1
        console.log('[Pagination] Refresh time - resetting to page 1');
        currentPageRef.current = 1;
        setCurrentPage(1);
        setApiParams((prevParams) => ({ ...prevParams, page: 1 }));
      } else if (totalPages > 1) {
        // Every 1 minute: change page
        const nextPage = currentPageRef.current >= totalPages ? 1 : currentPageRef.current + 1;
        console.log('[Pagination] Changing to page:', nextPage, 'of', totalPages);
        currentPageRef.current = nextPage;
        setCurrentPage(nextPage);
        setApiParams((prevParams) => ({ ...prevParams, page: nextPage }));
      } else {
        console.log('[Pagination] Only 1 page, no pagination needed');
      }
    }, 60000); // 1 minute

    return () => {
      console.log('[Pagination] Cleaning up interval');
      clearInterval(interval);
    };
  }, []); // Empty dependency array - only run once

  // Auto-update clock every second
  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [clock]);

  // Loading State
  if (isLoadingCabang) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'text.secondary'
          }}
        >
          Loading Work Orders...
        </Typography>
      </Box>
    );
  }

  return (
    <Stack
      sx={{
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'background.default'
      }}
    >
      {/* Header Section */}
      <WorkOrderHeader
        data={data}
        cabang={cabang}
        apiParams={apiParams}
        setApiParams={setApiParams}
        clock={clock}
        tanggal={tanggal}
        isLoading={dataLoading}
        BDtot={BDtot}
        WTtot={WTtot}
        WPtot={WPtot}
        WStot={WStot}
      />

      {/* Main List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {dataLoading ? (
          // Loading Overlay
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.paper',
              zIndex: 10,
              gap: 2
            }}
          >
            <CircularProgress size={48} thickness={4} />
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'text.secondary'
              }}
            >
              Updating work orders...
            </Typography>
          </Box>
        ) : (
          // Work Order List
          <WorkOrderList data={data} setParams={setApiParams} />
        )}
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'text.secondary'
          }}
        >
          Last updated: {moment().format('HH:mm:ss')} | Page {currentPage} of {Math.ceil((data?.pagination?.total || 1) / apiParams.perPage) || 1}
        </Typography>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          Refresh in 3m | Next page in {60 - (moment().seconds() % 60)}s
        </Typography>
      </Box>
    </Stack>
  );
}
