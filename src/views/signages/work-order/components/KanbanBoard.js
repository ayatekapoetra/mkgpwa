'use client';

import React, { useMemo, useEffect, useState } from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// PROJECT IMPORTS
import StatusColumn from './StatusColumn';
import { COLUMN_ORDER, API_DEFAULTS } from '../utils/workOrderConstants';
import { transformToKanbanData, calculateColumnStats } from '../utils/workOrderHelpers';

// ==============================|| KANBAN BOARD ||============================== //

const KanbanBoard = ({ data, setParams }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentPage, setCurrentPage] = useState(1);

  // Transform API data to kanban format
  const kanbanData = useMemo(() => {
    return transformToKanbanData(data);
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateColumnStats(kanbanData);
  }, [kanbanData]);

  // Auto-pagination effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => {
        const totalPages = Math.ceil((data?.pagination?.total || 1) / (API_DEFAULTS.PER_PAGE));
        const nextPage = prev >= totalPages ? 1 : prev + 1;

        // Update API params
        if (setParams) {
          setParams((prevParams) => ({
            ...prevParams,
            page: nextPage
          }));
        }

        return nextPage;
      });
    }, API_DEFAULTS.PAGINATION_INTERVAL);

    return () => clearInterval(interval);
  }, [data, setParams]);

  const handleCardClick = (workOrder) => {
    // Future: Open detail modal or navigate to detail page
    console.log('Card clicked:', workOrder);
  };

  if (isSmallMobile) {
    // Mobile: Stacked columns vertically
    return (
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          pb: 2
        }}
      >
        <Stack spacing={2}>
          {COLUMN_ORDER.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              workOrders={kanbanData[status] || []}
              onCardClick={handleCardClick}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  if (isMobile) {
    // Tablet: 2 columns with horizontal scroll
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: 1
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            py: 1
          }}
        >
          {COLUMN_ORDER.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              workOrders={kanbanData[status] || []}
              onCardClick={handleCardClick}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  // Desktop: 3 columns in a row
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        px: 1,
        pt: 1
      }}
    >
      {/* Kanban Board */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 2
        }}
      >
        {COLUMN_ORDER.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            workOrders={kanbanData[status] || []}
            onCardClick={handleCardClick}
          />
        ))}
      </Box>

      {/* Pagination Indicator */}
      {data?.pagination && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <Box sx={{ flex: 1, height: 3, borderRadius: 1, backgroundColor: 'action.hover', overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${(currentPage / (Math.ceil(data.pagination.total / API_DEFAULTS.PER_PAGE) || 1)) * 100}%`,
                backgroundColor: 'primary.main',
                transition: 'width 0.3s ease',
                borderRadius: 1
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'text.secondary',
              px: 1
            }}
          >
            Page {currentPage} of {Math.ceil(data.pagination.total / API_DEFAULTS.PER_PAGE) || 1}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default KanbanBoard;
