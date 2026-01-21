'use client';

import React, { useMemo } from 'react';
import moment from 'moment';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Image from 'next/image';

// PROJECT IMPORTS
import { transformToKanbanData, calculateColumnStats, formatDuration, getDurationColor } from '../utils/workOrderHelpers';
import { STATUS_COLORS, STATUS_LABELS } from '../utils/workOrderConstants';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Helper function untuk mendapatkan brand logo
function getBrandLogo(manufacturer) {
  const logos = {
    Caterpillar: `/assets/images/manufaktur/Caterpillar.png?v=2`,
    Mitsubishi: `/assets/images/manufaktur/Mitsubishi.png?v=2`,
    Kobelco: `/assets/images/manufaktur/Kobelco.png?v=2`,
    Hidromek: `/assets/images/manufaktur/Hidromek.png?v=2`,
    Hitachi: `/assets/images/manufaktur/Hitachi.png?v=2`,
    HONGYAN: `/assets/images/manufaktur/Hongyan.png?v=2`,
    Isuzu: `/assets/images/manufaktur/Isuzu.png?v=2`,
    JCB: `/assets/images/manufaktur/JCB.png?v=2`,
    Sumitomo: `/assets/images/manufaktur/Sumitomo.png?v=2`,
    'Atlas Copco': `/assets/images/manufaktur/AtlasCopco.png?v=2`,
    Daihatsu: `/assets/images/manufaktur/Daihatsu.png?v=2`,
    JACRO: `/assets/images/manufaktur/Jacro.png?v=2`,
    Kubota: `/assets/images/manufaktur/Kubota.png?v=2`,
    Perkins: `/assets/images/manufaktur/Perkins.png?v=2`,
    Sakai: `/assets/images/manufaktur/Sakai.png?v=2`,
    Sany: `/assets/images/manufaktur/Sany.png?v=2`,
    Sachman: `/assets/images/manufaktur/Shacman.png?v=2`,
    Shantui: `/assets/images/manufaktur/Shantui.png?v=2`,
    Toyota: `/assets/images/manufaktur/Toyota.png?v=2`,
    XGMA: `/assets/images/manufaktur/XGMA.png?v=2`
  };
  return logos[manufacturer] || '/assets/images/manufaktur/NoLogo.png';
}

// ==============================|| WORK ORDER LIST ||============================== //

const WorkOrderList = ({ data, setParams }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Flatten kanban data into list
  const workOrderList = useMemo(() => {
    console.log('[WorkOrderList] Input data:', data);
    console.log('[WorkOrderList] Data type:', typeof data, 'Is array:', Array.isArray(data), 'Length:', data?.length);

    if (!data) {
      console.log('[WorkOrderList] Data is null/undefined');
      return [];
    }

    // If data is the rowsInfo object (with total, lastPage, etc), get the data array
    const dataArray = Array.isArray(data) ? data : (data?.data || data?.rows?.data || []);
    console.log('[WorkOrderList] Data array length:', dataArray.length);
    console.log('[WorkOrderList] First item:', dataArray[0]);

    const kanbanData = transformToKanbanData(dataArray);
    const list = [];

    // Add all work orders from all statuses
    Object.keys(kanbanData).forEach((status) => {
      kanbanData[status].forEach((wo) => {
        list.push({ ...wo, status });
      });
    });

    console.log('[WorkOrderList] List length after transform:', list.length);
    console.log('[WorkOrderList] First work order:', list[0]);

    // Sort by priority and duration
    const sorted = list.sort((a, b) => {
      const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const durationA = parseFloat(formatDuration(a)) || 0;
      const durationB = parseFloat(formatDuration(b)) || 0;
      return durationB - durationA;
    });

    console.log('[WorkOrderList] Sorted list length:', sorted.length);

    return sorted;
  }, [data]);

  const getStatusChip = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.WT;
    return (
      <Chip
        label={STATUS_LABELS[status] || status}
        size="small"
        sx={{
          backgroundColor: config.light,
          color: config.primary,
          border: `1px solid ${config.border}`,
          fontWeight: 700,
          fontSize: '10px',
          height: 22,
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    );
  };

  if (workOrderList.length === 0) {
    return (
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
        <Box sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}>📋</Box>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, opacity: 0.6 }}>No work orders found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        px: 1,
        pt: 1
      }}
    >
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8
          },
          '&::-webkit-scrollbar-track': {
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 4
          }
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: 'background.paper',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  width: 60,
                  px: 1.5
                }}
              >
                Brand
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'background.paper',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  width: 140,
                  px: 1.5
                }}
              >
                WO Number
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'background.paper',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  width: 140,
                  px: 1.5
                }}
              >
                Unit
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'background.paper',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  px: 1.5
                }}
              >
                Problem
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'background.paper',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  width: 80,
                  px: 1.5
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'background.paper',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  width: 350,
                  px: 1.5
                }}
              >
                Duration
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrderList.map((wo, index) => {
              const duration = formatDuration(wo);
              const durationColor = getDurationColor(wo);
              const statusConfig = STATUS_COLORS[wo.status] || STATUS_COLORS.WT;

              return (
                <TableRow
                  key={wo.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                    },
                    animation: `fadeIn 0.3s ease ${index * 0.03}s both`,
                    '@keyframes fadeIn': {
                      from: { opacity: 0, transform: 'translateY(-10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' }
                    },
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <TableCell sx={{ px: 1, py: 1, textAlign: 'center' }}>
                    <Box
                      sx={{
                        position: 'relative',
                        width: '50px',
                        height: '30px',
                        mx: 'auto',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        borderRadius: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Image
                        src={getBrandLogo(wo.manufacturer)}
                        fill
                        style={{ objectFit: 'contain', padding: '2px' }}
                        alt={wo.manufacturer || 'Equipment'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1.5, py: 1 }}>
                    <Box>
                      <Box
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: statusConfig.primary,
                          letterSpacing: 0.5,
                          mb: 0.25
                        }}
                      >
                        {wo.woNumber || 'N/A'}
                      </Box>
                      {wo.pitName && wo.pitName !== 'Unassigned' && (
                        <Box
                          sx={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: 0.3
                          }}
                        >
                          📍 {wo.pitName}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1.5, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {/* Priority Indicator */}
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: wo.priority === 'CRITICAL' ? '#EF4444' :
                                         wo.priority === 'HIGH' ? '#F97316' :
                                         wo.priority === 'MEDIUM' ? '#EAB308' : '#22C55E',
                          flexShrink: 0,
                          ...(wo.priority === 'CRITICAL' && {
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
                              '50%': { boxShadow: '0 0 0 4px rgba(239, 68, 68, 0)' }
                            }
                          })
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            fontSize: '14px',
                            fontWeight: 900,
                            color: 'text.primary',
                            lineHeight: 1.3,
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: 0.5
                          }}
                        >
                          {wo.unitCode}
                        </Box>
                        <Box
                          sx={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'text.secondary',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {wo.breakdownAt ? moment(wo.breakdownAt, 'DD-MM-YYYY HH:mm').format('DD-MM-YYYY') : '-'}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1.5, py: 1 }}>
                    <Box
                      sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'text.primary',
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        pl: 1,
                        borderLeft: `3px solid ${statusConfig.primary}`
                      }}
                    >
                      {wo.problem}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1.5, py: 1 }}>{getStatusChip(wo.status)}</TableCell>
                  <TableCell sx={{ px: 1.5, py: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: durationColor,
                        fontWeight: 700,
                        fontSize: '11px',
                        lineHeight: 1.3
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 13 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {duration}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkOrderList;
