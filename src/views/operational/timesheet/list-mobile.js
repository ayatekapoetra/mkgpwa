'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';

import { Box, Card, CardContent, Typography, Stack, Divider, Chip } from '@mui/material';

// THIRD - PARTY
import { Timer1, Edit, Building4, Location, UserSquare, GasStation, TruckFast } from 'iconsax-react';

import Paginate from 'components/Paginate';
import moment from 'moment';
import IconButton from 'components/@extended/IconButton';

export default function ListTimesheetMobile({ data, queueStatus = {}, setParams }) {
  const tableData = useMemo(() => {
    const rows = data?.data?.rows || data?.data || data?.rows || data;
    const processedRows = Array.isArray(rows) ? rows : [];

    // Merge queue status with table data
    return processedRows.map((row) => ({
      ...row,
      syncStatus: queueStatus[row.id] || 'synced'
    }));
  }, [data, queueStatus]);

  const getLSBadge = (longshift) => {
    if (longshift == 'ls0') {
      return <Chip label="LS0" color="success" size="small" />;
    } else if (longshift == 'ls1') {
      return <Chip label="LS1" color="warning" size="small" />;
    } else {
      return <Chip label="LS2" color="error" size="small" />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mx: '1em' }}>
      {tableData.map((row) => (
        <Card
          key={row.id}
          sx={{
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 6
            },
            mt: 1
          }}
        >
          {/* Header with gradient background */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: 2,
              color: 'white',
              position: 'relative'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                  {row.kdunit || '-'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.2 }}>
                  {moment(row.date_ops).format('DD MMM YYYY')}
                </Typography>
              </Box>
              <IconButton
                size="small"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
                component={Link}
                href={`/timesheet/${row.id}/show`}
              >
                <Edit />
              </IconButton>
            </Stack>
          </Box>

          <CardContent sx={{ pb: 2, position: 'relative' }}>
            {/* Status Badge - Body Position */}
            <Box
              sx={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                backgroundColor: 'background.paper',
                borderRadius: '20px',
                px: 2,
                py: 0.5,
                boxShadow: 2,
                border: '2px solid',
                borderColor: (theme) => {
                  if (row.syncStatus === 'pending') return theme.palette.warning.main;
                  if (row.syncStatus === 'synced') return theme.palette.success.main;
                  if (row.syncStatus === 'failed') return theme.palette.error.main;
                  return 'divider';
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: (theme) => {
                      if (row.syncStatus === 'pending') return theme.palette.warning.main;
                      if (row.syncStatus === 'synced') return theme.palette.success.main;
                      if (row.syncStatus === 'failed') return theme.palette.error.main;
                      return 'grey.500';
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  sx={{
                    color: (theme) => {
                      if (row.syncStatus === 'pending') return theme.palette.warning.main;
                      if (row.syncStatus === 'synced') return theme.palette.success.main;
                      if (row.syncStatus === 'failed') return theme.palette.error.main;
                      return 'text.primary';
                    }
                  }}
                >
                  {row.syncStatus === 'pending'
                    ? 'OFFLINE'
                    : row.syncStatus === 'synced'
                      ? 'SYNCED'
                      : row.syncStatus === 'failed'
                        ? 'FAILED'
                        : '-'}
                </Typography>
              </Stack>
            </Box>

            {/* Quick Info Section */}
            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Location and Business */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Location size={18} sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Site
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {row.cabang?.initial || '-'}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Building4 size={18} sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Bisnis
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {row.bisnis?.initial || '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Divider />

              {/* Operator Info */}
              <Box sx={{ backgroundColor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <UserSquare size={20} sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Operator / Driver
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {row.karyawan?.nama || '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Equipment and Penyewa */}
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Equipment
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {row.kdunit || '-'}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Penyewa
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {row.penyewa?.abbr || '-'}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              {/* Production Stats */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Production Data
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GasStation size={16} sx={{ color: 'warning.main' }} />
                      <Typography variant="body2">BBM</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {row.bbm || '-'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">SMU Start</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {row.smustart || '-'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">SMU Finish</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {row.smufinish || '-'}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ backgroundColor: 'success.lighter', p: 1, borderRadius: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TruckFast size={18} sx={{ color: 'success.main' }} />
                      <Typography variant="body2" fontWeight="bold">
                        SMU USED
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {row.usedhmkm?.toFixed(2) || '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              {/* Activity Section */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Activity
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Timer1 size={16} sx={{ color: 'info.main' }} />
                    {getLSBadge(row.longshift)}
                  </Stack>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Method
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {row.metode?.toUpperCase() || '-'}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Allocation
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {row.mainact?.toUpperCase() || '-'}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      <Box sx={{ mt: 2 }}>
        <Paginate
          page={data?.data?.page || data?.page}
          total={data?.data?.total || data?.total || 0}
          lastPage={data?.data?.lastPage || data?.lastPage || 1}
          perPage={data?.data?.perPage || data?.perPage || 10}
          onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
        />
      </Box>
    </Box>
  );
}
