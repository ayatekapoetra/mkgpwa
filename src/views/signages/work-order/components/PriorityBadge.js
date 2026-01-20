'use client';

import React from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// PROJECT IMPORTS
import { getPriorityConfig } from '../utils/workOrderHelpers';

// ==============================|| PRIORITY BADGE ||============================== //

const PriorityBadge = ({ priority, size = 'medium', showIcon = true }) => {
  const theme = useTheme();
  const config = getPriorityConfig(priority);

  const sizeStyles = {
    small: {
      padding: '2px 8px',
      fontSize: '10px',
      iconSize: '12px'
    },
    medium: {
      padding: '4px 12px',
      fontSize: '11px',
      iconSize: '14px'
    },
    large: {
      padding: '6px 16px',
      fontSize: '12px',
      iconSize: '16px'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  const isCritical = priority === 'CRITICAL';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: currentSize.padding,
        py: 0.5,
        borderRadius: '20px',
        background: config.background,
        border: `1px solid ${config.border}`,
        fontWeight: 700,
        fontSize: currentSize.fontSize,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: config.primary,
        ...(isCritical && {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
              transform: 'scale(1)'
            },
            '50%': {
              boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)',
              transform: 'scale(1.02)'
            }
          }
        }),
        transition: 'all 0.3s ease'
      }}
    >
      {showIcon && (
        <Typography
          sx={{
            fontSize: currentSize.iconSize,
            lineHeight: 1
          }}
        >
          {config.icon}
        </Typography>
      )}
      <Typography
        sx={{
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 1.2
        }}
      >
        {priority}
      </Typography>
    </Box>
  );
};

export default PriorityBadge;
