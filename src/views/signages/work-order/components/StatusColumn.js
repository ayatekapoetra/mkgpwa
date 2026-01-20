'use client';

import React, { useState } from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

// PROJECT IMPORTS
import WorkOrderCard from './WorkOrderCard';
import { COLUMN_GRADIENTS, STATUS_LABELS } from '../utils/workOrderConstants';
import { getStatusConfig, sortWorkOrders } from '../utils/workOrderHelpers';

// ==============================|| STATUS COLUMN ||============================== //

const StatusColumn = ({ status, workOrders, onCardClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const statusConfig = getStatusConfig(status);
  const gradient = COLUMN_GRADIENTS[status] || COLUMN_GRADIENTS.WT;
  const sortedWorkOrders = sortWorkOrders(workOrders);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    // Future: Handle drop logic for drag-and-drop functionality
  };

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 340,
        maxWidth: 420,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Column Header */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: '12px 12px 0 0',
          background: gradient,
          color: 'white',
          p: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              {status === 'WT' && 'Wait Technician'}
              {status === 'WP' && 'Wait Part'}
              {status === 'WS' && 'In Service'}
              {status === 'DONE' && 'Completed'}
            </Typography>

            {/* Count Badge */}
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 900,
                  lineHeight: 1
                }}
              >
                {workOrders.length}
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              opacity: 0.9,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            {STATUS_LABELS[status]}
          </Typography>
        </Box>
      </Paper>

      {/* Column Body - Scrollable Cards Area */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 1.5,
          background: isDark ? 'rgba(20, 20, 20, 0.6)' : 'rgba(245, 245, 245, 0.6)',
          backdropFilter: 'blur(10px)',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: '0 0 12px 12px',
          transition: 'all 0.3s ease',
          ...(isDraggingOver && {
            background: `${statusConfig.primary}15`,
            borderColor: statusConfig.primary,
            boxShadow: `inset 0 0 20px ${statusConfig.primary}30`
          }),
          '&::-webkit-scrollbar': {
            width: 6
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: statusConfig.primary,
            borderRadius: 3,
            opacity: 0.5
          },
          '&::-webkit-scrollbar-thumb:hover': {
            opacity: 0.8
          }
        }}
      >
        {sortedWorkOrders.length === 0 ? (
          // Empty State
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              py: 4
            }}
          >
            <Box
              sx={{
                fontSize: 48,
                mb: 1,
                opacity: 0.3
              }}
            >
              📋
            </Box>
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
                opacity: 0.6
              }}
            >
              No work orders
            </Typography>
            <Typography
              sx={{
                fontSize: '11px',
                textAlign: 'center',
                opacity: 0.4
              }}
            >
              Drag & drop or add new items
            </Typography>
          </Box>
        ) : (
          // Work Order Cards
          <Stack
            spacing={1.5}
            sx={{
              pb: 1,
              '& > *': {
                animation: 'fadeInUp 0.3s ease forwards',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(10px)'
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }
            }}
          >
            {sortedWorkOrders.map((wo, index) => (
              <Box
                key={wo.id}
                sx={{
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <WorkOrderCard workOrder={wo} onCardClick={onCardClick} />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default StatusColumn;
