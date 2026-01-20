'use client';

import React, { useEffect, useState } from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

// PROJECT IMPORTS
import StatusProgressIndicator from './StatusProgressIndicator';
import { STATUS_COLORS, STATUS_LABELS } from '../utils/workOrderConstants';
import { calculateColumnStats, transformToKanbanData } from '../utils/workOrderHelpers';

// ==============================|| WORK ORDER DASHBOARD ||============================== //

const WODashboard = ({ data }) => {
  const theme = useTheme();
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    WT: 0,
    WP: 0,
    WS: 0,
    DONE: 0
  });

  const kanbanData = transformToKanbanData(data);
  const stats = calculateColumnStats(kanbanData);

  // Animate statistics on mount or data change
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setAnimatedStats({
        total: Math.round(stats.total * easeProgress),
        WT: Math.round(stats.WT * easeProgress),
        WP: Math.round(stats.WP * easeProgress),
        WS: Math.round(stats.WS * easeProgress),
        DONE: Math.round(stats.DONE * easeProgress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(stats);
      }
    }, increment);

    return () => clearInterval(timer);
  }, [stats]);

  const StatCard = ({ title, value, color, icon, trend }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${color}20`,
          borderColor: color
        }
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: '32px',
                fontWeight: 900,
                color: color,
                lineHeight: 1,
                textShadow: `0 2px 8px ${color}30`
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              fontSize: '32px',
              opacity: 0.8,
              filter: `drop-shadow(0 2px 4px ${color}40)`
            }}
          >
            {icon}
          </Box>
        </Stack>
        {trend && (
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 600,
              color: trend > 0 ? 'success.main' : 'error.main',
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.25
            }}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mb: 2 }}>
      {/* Main Statistics Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3} md={1.5}>
          <StatCard
            title="Total WO"
            value={animatedStats.total}
            color={STATUS_COLORS.WT.primary}
            icon="📊"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <StatCard
            title={STATUS_LABELS.WT}
            value={animatedStats.WT}
            color={STATUS_COLORS.WT.primary}
            icon="🔵"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <StatCard
            title={STATUS_LABELS.WP}
            value={animatedStats.WP}
            color={STATUS_COLORS.WP.primary}
            icon="🟡"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <StatCard
            title={STATUS_LABELS.WS}
            value={animatedStats.WS}
            color={STATUS_COLORS.WS.primary}
            icon="🟢"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <StatCard
            title={STATUS_LABELS.DONE}
            value={animatedStats.DONE}
            color={STATUS_COLORS.DONE.primary}
            icon="✅"
          />
        </Grid>
      </Grid>

      {/* Progress Indicator */}
      <StatusProgressIndicator stats={stats} animated={true} />
    </Box>
  );
};

export default WODashboard;
