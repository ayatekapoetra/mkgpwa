'use client';

import React, { useMemo } from 'react';
// MATERIAL - UI
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';

// PROJECT IMPORTS
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SpeedIcon from '@mui/icons-material/Speed';

// ==============================|| WORK ORDER HEADER ||============================== //

const WorkOrderHeader = ({ data, cabang, apiParams, setApiParams, clock, tanggal, isLoading, BDtot, WTtot, WPtot, WStot }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate breakdown by category - use API response values directly from props
  const breakdownByCategory = useMemo(() => {
    console.log('[WorkOrderHeader] BDtot:', BDtot, 'WTtot:', WTtot, 'WPtot:', WPtot, 'WStot:', WStot);

    return {
      total: BDtot || 0,
      WT: WTtot || 0,
      WP: WPtot || 0,
      WS: WStot || 0
    };
  }, [BDtot, WTtot, WPtot, WStot]);

  return (
    <Box
      sx={{
        px: 1,
        pt: 0.75,
        pb: 0.5,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Compact Header Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap'
        }}
      >
        {/* Title & Clock */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography
            sx={{
              fontSize: isSmallMobile ? '16px' : '18px',
              fontWeight: 900,
              color: 'text.primary',
              letterSpacing: -0.5,
              textTransform: 'uppercase'
            }}
          >
            WO Panel
          </Typography>

          {/* Date & Clock */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, pl: 1, borderLeft: '1px solid', borderColor: 'divider' }}>
            <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: 'text.secondary' }}>
              {tanggal}
            </Typography>
            <Typography
              sx={{
                fontSize: isSmallMobile ? '16px' : '20px',
                fontWeight: 900,
                color: 'primary.main',
                letterSpacing: 2,
                lineHeight: 1,
                fontFamily: 'monospace',
                ml: 0.5
              }}
            >
              {clock}
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Branch */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="cabang_id" sx={{ fontSize: '12px' }}>Branch</InputLabel>
            <Select
              id="cabang_id"
              labelId="cabang_id"
              value={apiParams.cabang_id || ''}
              label="Branch"
              onChange={(e) => setApiParams((prev) => ({ ...prev, cabang_id: e.target.value }))}
              sx={{ fontSize: '12px' }}
            >
              {cabang?.map((m, idx) => (
                <MenuItem key={idx} value={m.id} sx={{ fontSize: '12px' }}>
                  [{m.kode}] {m.nama}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Limit */}
          <FormControl size="small" sx={{ width: 85 }}>
            <InputLabel id="perPage" sx={{ fontSize: '12px' }}>Limit</InputLabel>
            <Select
              id="perPage"
              labelId="perPage"
              value={apiParams.perPage || 12}
              label="Limit"
              onChange={(e) => setApiParams((prev) => ({ ...prev, perPage: parseInt(e.target.value) || 12 }))}
              sx={{ fontSize: '12px' }}
            >
              <MenuItem value={10} sx={{ fontSize: '12px' }}>10</MenuItem>
              <MenuItem value={12} sx={{ fontSize: '12px' }}>12</MenuItem>
              <MenuItem value={25} sx={{ fontSize: '12px' }}>25</MenuItem>
              <MenuItem value={50} sx={{ fontSize: '12px' }}>50</MenuItem>
              <MenuItem value={100} sx={{ fontSize: '12px' }}>100</MenuItem>
            </Select>
          </FormControl>

          {/* Category */}
          <RadioGroup
            aria-label="ctg"
            value={apiParams.ctg}
            name="ctg"
            onChange={(e) => setApiParams((prev) => ({ ...prev, ctg: e.target.value }))}
            row
            sx={{ gap: 0.5 }}
          >
            <FormControlLabel
              value="HE"
              control={<Radio size="small" sx={{ fontSize: '18px' }} />}
              label="HE"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px', fontWeight: 700 }, ml: -0.5 }}
            />
            <FormControlLabel
              value="DT"
              control={<Radio size="small" sx={{ fontSize: '18px' }} />}
              label="DT"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px', fontWeight: 700 }, ml: -0.5 }}
            />
          </RadioGroup>
        </Stack>
      </Box>

      {/* Breakdown by Category */}
      {!isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            py: 0.75,
            px: 1.5,
            backgroundColor: 'action.hover',
            borderRadius: 1,
            mt: 0.5
          }}
        >
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase'
            }}
          >
            Status Breakdown:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'error.main'
                }}
              />
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.primary' }}>
                Total: <span style={{ color: 'error.main' }}>{breakdownByCategory.total}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main'
                }}
              />
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.primary' }}>
                Menunggu Teknisi: <span style={{ color: 'primary.main' }}>{breakdownByCategory.WT}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'warning.main'
                }}
              />
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.primary' }}>
                Menunggu Part: <span style={{ color: 'warning.main' }}>{breakdownByCategory.WP}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'success.main'
                }}
              />
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.primary' }}>
                Dalam Pengerjaan: <span style={{ color: 'success.main' }}>{breakdownByCategory.WS}</span>
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WorkOrderHeader;
