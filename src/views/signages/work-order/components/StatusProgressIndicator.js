'use client';

import React from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// PROJECT IMPORTS
import { STATUS_COLORS, STATUS_LABELS } from '../utils/workOrderConstants';

// ==============================|| STATUS PROGRESS INDICATOR ||============================== //

const StatusProgressIndicator = ({ stats, animated = true }) => {
  const total = stats?.total || 0;
  const wtCount = stats?.WT || 0;
  const wpCount = stats?.WP || 0;
  const wsCount = stats?.WS || 0;
  const doneCount = stats?.DONE || 0;

  if (total === 0) {
    return null;
  }

  const wtPercent = (wtCount / total) * 100;
  const wpPercent = (wpCount / total) * 100;
  const wsPercent = (wsCount / total) * 100;
  const donePercent = (doneCount / total) * 100;

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
      {/* Stats - Compact */}
      <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.WT.primary }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.primary' }}>
            WT: <span style={{ color: STATUS_COLORS.WT.primary }}>{wtCount}</span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.WP.primary }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.primary' }}>
            WP: <span style={{ color: STATUS_COLORS.WP.primary }}>{wpCount}</span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.WS.primary }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.primary' }}>
            WS: <span style={{ color: STATUS_COLORS.WS.primary }}>{wsCount}</span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.DONE.primary }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.primary' }}>
            DONE: <span style={{ color: STATUS_COLORS.DONE.primary }}>{doneCount}</span>
          </Typography>
        </Box>
      </Stack>

      {/* Progress Bar - Compact */}
      <Box sx={{ flex: 2, height: 6, borderRadius: 1, overflow: 'hidden' }}>
        <LinearProgress
          variant="determinate"
          value={100}
          sx={{
            height: '100%',
            borderRadius: 1,
            backgroundColor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg,
                ${STATUS_COLORS.WT.primary} 0%,
                ${STATUS_COLORS.WT.primary} ${wtPercent}%,
                ${STATUS_COLORS.WP.primary} ${wtPercent}%,
                ${STATUS_COLORS.WP.primary} ${wtPercent + wpPercent}%,
                ${STATUS_COLORS.WS.primary} ${wtPercent + wpPercent}%,
                ${STATUS_COLORS.WS.primary} ${wtPercent + wpPercent + wsPercent}%,
                ${STATUS_COLORS.DONE.primary} ${wtPercent + wpPercent + wsPercent}%,
                ${STATUS_COLORS.DONE.primary} 100%
              )`,
              transition: 'all 0.5s ease'
            }
          }}
        />
      </Box>

      {/* Total */}
      <Typography sx={{ fontSize: '12px', fontWeight: 900, color: 'primary.main', minWidth: 60 }}>
        {total}
      </Typography>
    </Stack>
  );
};

export default StatusProgressIndicator;
