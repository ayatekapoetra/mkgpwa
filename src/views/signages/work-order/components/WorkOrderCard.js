'use client';

import React, { useState } from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EngineeringIcon from '@mui/icons-material/Engineering';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// PROJECT IMPORTS
import PriorityBadge from './PriorityBadge';
import {
  formatDuration,
  getDurationColor,
  getGlassmorphismStyles,
  truncateText,
  calculateProgress,
  getPartsStatusColor,
  formatWONumber,
  getStatusConfig
} from '../utils/workOrderHelpers';

// ==============================|| WORK ORDER CARD ||============================== //

const WorkOrderCard = ({ workOrder, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = getStatusConfig(workOrder.status);
  const glassStyles = getGlassmorphismStyles(isDark, workOrder.status);
  const duration = formatDuration(workOrder);
  const durationColor = getDurationColor(workOrder);

  const handleCopyWO = () => {
    if (workOrder.woNumber) {
      navigator.clipboard.writeText(workOrder.woNumber);
    }
  };

  const partsProgress = calculateProgress(workOrder.partsCompleted, workOrder.partsTotal);
  const partsColor = getPartsStatusColor(workOrder.partsCompleted, workOrder.partsTotal);

  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        width: '100%',
        minWidth: 300,
        maxWidth: 380,
        minHeight: 280,
        maxHeight: 380,
        background: glassStyles.background,
        backdropFilter: glassStyles.backdropFilter,
        WebkitBackdropFilter: glassStyles.backdropFilter,
        borderRadius: '16px',
        border: `1px solid ${glassStyles.border}`,
        boxShadow: glassStyles.shadow,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        ...(isHovered && {
          transform: 'perspective(1000px) rotateX(2deg) rotateY(2deg) scale(1.02)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          borderColor: statusConfig.primary
        }),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: statusConfig.gradient,
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.3s ease'
        }
      }}
    >
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Row: Priority, WO Number, Duration */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5,
            gap: 1
          }}
        >
          <PriorityBadge priority={workOrder.priority} size="small" />

          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Tooltip title="Click to copy" arrow>
              <Box
                onClick={handleCopyWO}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: statusConfig.primary,
                    letterSpacing: 0.5
                  }}
                >
                  {formatWONumber(workOrder.woNumber)}
                </Typography>
                <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.6 }} />
              </Box>
            </Tooltip>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              backgroundColor: `${durationColor}15`,
              border: `1px solid ${durationColor}40`
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 14, color: durationColor }} />
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                color: durationColor
              }}
            >
              {duration}
            </Typography>
          </Box>
        </Box>

        {/* Unit Information */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'text.primary',
              mb: 0.25,
              letterSpacing: 0.5
            }}
          >
            {workOrder.unitCode}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'text.secondary',
                flex: 1
              }}
            >
              {workOrder.unitName}
            </Typography>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: statusConfig.light,
                color: statusConfig.primary,
                textTransform: 'uppercase'
              }}
            >
              {workOrder.pitName}
            </Typography>
          </Box>
        </Box>

        {/* Problem Description */}
        <Box sx={{ mb: 1.5, flex: 1 }}>
          <Tooltip title={workOrder.problem} arrow>
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'text.primary',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                backgroundColor: 'action.hover',
                borderLeft: `3px solid ${statusConfig.primary}`
              }}
            >
              {truncateText(workOrder.problem, 80)}
            </Typography>
          </Tooltip>
        </Box>

        {/* Technician & Parts Info */}
        <Box sx={{ mb: 1 }}>
          {/* Technicians */}
          {workOrder.technicians && workOrder.technicians.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <EngineeringIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <AvatarGroup
                max={3}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 24,
                    height: 24,
                    fontSize: '10px',
                    fontWeight: 700,
                    border: `2px solid ${theme.palette.background.paper}`
                  }
                }}
              >
                {workOrder.technicians.map((tech, idx) => (
                  <Avatar
                    key={idx}
                    sx={{
                      backgroundColor: statusConfig.primary,
                      color: 'white'
                    }}
                  >
                    {tech.name?.substring(0, 2).toUpperCase() || 'T'}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Typography
                sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'text.secondary'
                }}
              >
                {workOrder.technicians.length} Tech
              </Typography>
            </Box>
          )}

          {/* Parts Progress */}
          {workOrder.partsTotal > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory2Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography
                    sx={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'text.secondary'
                    }}
                  >
                    Parts
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: partsColor
                    }}
                  >
                    {workOrder.partsCompleted}/{workOrder.partsTotal}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'action.hover',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${partsProgress}%`,
                      backgroundColor: partsColor,
                      borderRadius: 2,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1, borderColor: 'divider', opacity: 0.6 }} />

        {/* Footer: Status Badge */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              background: statusConfig.gradient,
              boxShadow: `0 2px 8px ${statusConfig.primary}40`
            }}
          >
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              {workOrder.status === 'WT' && 'Wait Tech'}
              {workOrder.status === 'WP' && 'Wait Part'}
              {workOrder.status === 'WS' && 'In Service'}
              {workOrder.status === 'DONE' && 'Completed'}
            </Typography>
          </Box>

          {workOrder.createdAt && (
            <Typography
              sx={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'text.secondary'
              }}
            >
              Since: {new Date(workOrder.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkOrderCard;
