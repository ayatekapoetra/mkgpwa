'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import { PresentionChart } from 'iconsax-react';
import moment from 'moment';
import 'moment/locale/id';

import {
  useFleetAssignmentAccess,
  useFleetMatrix,
  useFleetSummary,
  fleetErrorMessage,
} from 'api/fleet-assignment';
import { useGetSiteMonitoringFilterOptions } from 'api/site-monitoring';
import { usePublicLokasiKerja } from 'api/lokasi-kerja';
import {
  formatTime,
  localDate,
} from 'views/operational/mining/fleet-assignment/shared';

moment.locale('id');

const REFRESH_INTERVAL_MS = 30000;
const REFRESH_INTERVAL_SECONDS = REFRESH_INTERVAL_MS / 1000;

function SummaryCardSection({ summary, loading, presentation }) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const total = Number(summary.total) || 0;
  const cards = [
    { key: 'beroperasi', label: 'Beroperasi', caption: 'Unit produktif', value: summary.beroperasi, icon: <CheckCircleIcon />, accent: '#27e879', rgb: '39,232,121' },
    { key: 'standby', label: 'Standby', caption: 'Menunggu aktivitas', value: summary.standby, icon: <WarningAmberIcon />, accent: '#ffc928', rgb: '255,201,40' },
    { key: 'breakdown', label: 'Breakdown', caption: 'Perlu penanganan', value: summary.breakdown, icon: <ErrorOutlineIcon />, accent: '#ff4664', rgb: '255,70,100' },
    { key: 'nostatus', label: 'Tanpa Status', caption: 'Belum dilaporkan', value: summary.nostatus, icon: <HelpOutlineIcon />, accent: '#7f93a8', rgb: '127,147,168' },
    { key: 'total', label: 'Total Armada', caption: 'Unit terpantau', value: summary.total, icon: <SpeedIcon />, accent: '#39c6ff', rgb: '57,198,255' },
  ];

  if (presentation) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0.75 }}>
        {cards.map((card) => {
          const percentage = card.key === 'total' ? (total > 0 ? 100 : 0) : total > 0 ? Math.round((Number(card.value) || 0) / total * 100) : 0;
          return (
            <Box
              key={card.key}
              sx={{
                height: 54,
                minWidth: 0,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.85,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 1.4,
                border: '1px solid',
                borderColor: card.accent,
                background: darkMode
                  ? `linear-gradient(115deg, rgba(${card.rgb},0.13) 0%, rgba(8,24,38,0.97) 48%, rgba(${card.rgb},0.05) 100%)`
                  : `linear-gradient(115deg, rgba(${card.rgb},0.1) 0%, #ffffff 62%)`,
                boxShadow: darkMode
                  ? `inset 0 0 14px rgba(${card.rgb},0.09), 0 0 6px rgba(${card.rgb},0.38)`
                  : `inset 0 0 10px rgba(${card.rgb},0.06), 0 3px 9px rgba(24,39,52,0.07)`,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '20%',
                  right: '20%',
                  bottom: -2,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: card.accent,
                  filter: 'blur(4px)',
                  opacity: darkMode ? 0.6 : 0.25
                }
              }}
            >
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'grid', placeItems: 'center', flexShrink: 0, color: card.accent, bgcolor: `rgba(${card.rgb},0.1)`, border: `1px solid rgba(${card.rgb},0.35)`, '& svg': { fontSize: 16 } }}>
                {card.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ color: card.accent, fontSize: '0.54rem', fontWeight: 900, letterSpacing: 0.7, textTransform: 'uppercase', lineHeight: 1.1 }}>
                  {card.label}
                </Typography>
                <Typography noWrap color="text.secondary" sx={{ fontSize: '0.48rem', mt: 0.25, lineHeight: 1 }}>
                  {card.caption}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography sx={{ color: darkMode ? '#f5f9fc' : '#17212b', fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
                  {loading ? <CircularProgress size={15} sx={{ color: card.accent }} /> : card.value}
                </Typography>
                <Typography sx={{ color: card.accent, fontSize: '0.48rem', fontWeight: 900, mt: 0.2 }}>{percentage}%</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }

  const cols = presentation
    ? 'repeat(5, minmax(0, 1fr))'
    : { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: presentation ? 1.5 : 0.75 }}>
      {cards.map((card) => {
        const percentage = card.key === 'total' ? (total > 0 ? 100 : 0) : total > 0 ? Math.round((Number(card.value) || 0) / total * 100) : 0;
        const isTotal = card.key === 'total';
        return (
          <Card
            key={card.key}
            elevation={0}
            sx={{
              background: darkMode
                ? `linear-gradient(145deg, rgba(${card.rgb},0.05) 0%, rgba(8,24,38,0.96) 52%, rgba(${card.rgb},0.12) 100%)`
                : `linear-gradient(145deg, #ffffff 0%, rgba(${card.rgb},0.08) 100%)`,
              color: darkMode ? '#f5f9fc' : '#17212b',
              borderRadius: presentation ? 2 : 1.5,
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: card.accent,
              boxShadow: darkMode
                ? `inset 0 0 18px rgba(${card.rgb},0.1), 0 0 7px rgba(${card.rgb},0.58), 0 0 18px rgba(${card.rgb},0.22), 0 8px 18px rgba(0,0,0,0.24)`
                : `inset 0 0 14px rgba(${card.rgb},0.07), 0 0 6px rgba(${card.rgb},0.3), 0 7px 15px rgba(24,39,52,0.1)`,
              gridColumn: { xs: isTotal ? 'span 2' : 'auto', sm: 'auto' },
              transition: 'transform 160ms ease, box-shadow 160ms ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '18%',
                right: '18%',
                bottom: -2,
                height: 5,
                borderRadius: '50%',
                bgcolor: card.accent,
                filter: 'blur(5px)',
                opacity: darkMode ? 0.7 : 0.32
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                boxShadow: `inset 0 0 0 1px rgba(${card.rgb},0.18)`,
                pointerEvents: 'none'
              },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `inset 0 0 22px rgba(${card.rgb},0.14), 0 0 10px rgba(${card.rgb},0.72), 0 0 24px rgba(${card.rgb},0.32), 0 10px 20px rgba(0,0,0,0.24)`
              }
            }}
          >
            <CardContent sx={{ p: presentation ? 2 : 1, pl: presentation ? 2.25 : 1.35, position: 'relative', zIndex: 1, '&:last-child': { pb: presentation ? 2 : 1 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.75}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: card.accent, fontSize: presentation ? '0.72rem' : '0.58rem', fontWeight: 800, letterSpacing: 0.55, textTransform: 'uppercase', textShadow: darkMode ? `0 0 8px rgba(${card.rgb},0.55)` : 'none' }} noWrap>
                    {card.label}
                  </Typography>
                  <Typography sx={{ color: darkMode ? '#f5f9fc' : '#17212b', fontSize: presentation ? '2rem' : '1.35rem', fontWeight: 900, lineHeight: 1.05, mt: 0.25, letterSpacing: -0.5, textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none' }}>
                    {loading ? <CircularProgress size={presentation ? 24 : 16} sx={{ color: card.accent }} /> : card.value}
                  </Typography>
                </Box>
                <Box sx={{ width: presentation ? 40 : 28, height: presentation ? 40 : 28, borderRadius: 1.15, display: 'grid', placeItems: 'center', bgcolor: `rgba(${card.rgb},${darkMode ? 0.12 : 0.1})`, border: `1px solid rgba(${card.rgb},0.35)`, color: card.accent, boxShadow: darkMode ? `0 0 10px rgba(${card.rgb},0.22)` : 'none', flexShrink: 0, '& svg': { fontSize: presentation ? 22 : 16 } }}>
                  {card.icon}
                </Box>
              </Stack>

              <Box sx={{ mt: 0.7, height: 2, borderRadius: 3, bgcolor: 'rgba(31,46,59,0.08)', overflow: 'hidden' }}>
                <Box sx={{ width: `${percentage}%`, height: '100%', borderRadius: 3, bgcolor: card.accent, transition: 'width 0.35s ease' }} />
              </Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.35 }}>
                <Typography sx={{ color: darkMode ? '#91a4b7' : '#6f7b86', fontSize: presentation ? '0.65rem' : '0.52rem' }} noWrap>{card.caption}</Typography>
                <Typography sx={{ color: card.accent, fontSize: presentation ? '0.7rem' : '0.55rem', fontWeight: 900 }}>{percentage}%</Typography>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

function EquipmentCardReadOnly({ item, presentation }) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const status = String(item.status || '').toLowerCase();
  const code = item.equipment_abbr || item.equipment_kode || item.kode || item.code || item.kdunit || '-';
  const category = String(item.equipment_kategori || item.ctgunit || '-').toUpperCase();
  const locationName = item.lokasi_pit_nama || 'Tanpa lokasi';
  const neon = {
    beroperasi: { main: '#27e879', rgb: '39,232,121' },
    standby: { main: '#ffc928', rgb: '255,201,40' },
    breakdown: { main: '#ff4664', rgb: '255,70,100' }
  }[status] || { main: '#7f93a8', rgb: '127,147,168' };
  const background = darkMode
    ? `linear-gradient(145deg, rgba(${neon.rgb},0.05) 0%, rgba(8,24,38,0.96) 52%, rgba(${neon.rgb},0.12) 100%)`
    : `linear-gradient(145deg, #ffffff 0%, rgba(${neon.rgb},0.08) 100%)`;
  const rivets = [
    { top: 5, left: 5 },
    { top: 5, right: 5 },
    { bottom: 5, left: 5 },
    { bottom: 5, right: 5 }
  ];

  return (
    <Tooltip title={`${item.equipment_model || item.equipment_nama || category} · ${item.kegiatan_name || 'Belum ada kegiatan'} · ${formatTime(item.start_time)}-${formatTime(item.finish_time)}`} arrow>
      <Box
        sx={{
          height: 62,
          minWidth: 0,
          px: presentation ? 0.7 : 0.6,
          py: presentation ? 0.5 : 0.55,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 1.4,
          border: '1px solid',
          borderColor: neon.main,
          background,
          boxShadow: darkMode
            ? `inset 0 0 18px rgba(${neon.rgb},0.12), 0 0 7px rgba(${neon.rgb},0.7), 0 0 18px rgba(${neon.rgb},0.28), 0 8px 18px rgba(0,0,0,0.28)`
            : `inset 0 0 14px rgba(${neon.rgb},0.08), 0 0 6px rgba(${neon.rgb},0.42), 0 7px 15px rgba(24,39,52,0.12)`,
          transition: 'transform 160ms ease, box-shadow 160ms ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '18%',
            right: '18%',
            bottom: -2,
            height: 5,
            borderRadius: '50%',
            bgcolor: neon.main,
            filter: 'blur(5px)',
            opacity: darkMode ? 0.75 : 0.38
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            boxShadow: `inset 0 0 0 1px rgba(${neon.rgb},0.2)`,
            pointerEvents: 'none'
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `inset 0 0 22px rgba(${neon.rgb},0.16), 0 0 10px rgba(${neon.rgb},0.8), 0 0 24px rgba(${neon.rgb},0.38), 0 10px 20px rgba(0,0,0,0.28)`
          }
        }}
      >
        {rivets.map((position, index) => (
          <Box
            key={index}
            aria-hidden="true"
            sx={{
              position: 'absolute',
              ...position,
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: darkMode ? '#07111d' : '#dce3e9',
              border: '1px solid',
              borderColor: `rgba(${neon.rgb},0.72)`,
              boxShadow: `inset 0 0 2px rgba(255,255,255,0.55), 0 0 4px rgba(${neon.rgb},0.48)`,
              zIndex: 2
            }}
          />
        ))}
        <Typography sx={{ width: '100%', textAlign: 'center', color: darkMode ? '#f5f9fc' : 'text.primary', fontSize: presentation ? '0.72rem' : '0.68rem', fontWeight: 900, lineHeight: 0.98, mt: 0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none' }}>{code}</Typography>
        <Typography title={locationName} sx={{ width: 'calc(100% - 12px)', mt: 0.25, color: neon.main, textAlign: 'center', fontSize: presentation ? '0.53rem' : '0.5rem', fontWeight: 800, lineHeight: 0.95, letterSpacing: 0.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: `0 0 8px rgba(${neon.rgb},0.7)` }}>{locationName}</Typography>
      </Box>
    </Tooltip>
  );
}

function MatrixSkeleton({ presentation }) {
  const cols = presentation
    ? 'repeat(12, minmax(0, 1fr))'
    : { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(6, minmax(0, 1fr))', md: 'repeat(8, minmax(0, 1fr))', lg: 'repeat(12, minmax(0, 1fr))' };
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: 0.8 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={62} sx={{ borderRadius: 1.4 }} />
      ))}
    </Box>
  );
}

export default function FleetMonitoringScreen() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const access = useFleetAssignmentAccess();
  const filterOptions = useGetSiteMonitoringFilterOptions();
  const lokasiKerja = usePublicLokasiKerja();

  const [isPresentation, setIsPresentation] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const [filters, setFilters] = useState({
    date_ops: localDate(),
    shift_id: '',
    area: '',
    lokasi_site_id: '',
    lokasi_pit_id: '',
  });

  const surfaceColor = darkMode ? '#0c1a29' : theme.palette.background.paper;
  const raisedSurfaceColor = darkMode ? '#102338' : alpha(theme.palette.primary.lighter, 0.36);
  const canvasColor = darkMode ? '#060f17' : theme.palette.background.default;
  const sectionStyle = {
    p: { xs: 1.25, md: 1.5 },
    borderRadius: 2,
    borderColor: darkMode ? '#21394f' : theme.palette.divider,
    background: darkMode
      ? 'linear-gradient(145deg, #0d1d2e 0%, #091725 100%)'
      : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.lighter, 0.28)} 100%)`,
    boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, darkMode ? 0.2 : 0.06)}`
  };

  const enabled = access.permissions.read && Boolean(filters.date_ops);

  const matrixParams = useMemo(() => ({
    date_ops: filters.date_ops,
    shift_id: filters.shift_id,
    area: filters.area,
    lokasi_site_id: filters.lokasi_site_id,
    lokasi_pit_id: filters.lokasi_pit_id,
    perPage: 1000,
  }), [filters]);

  const summaryParams = useMemo(() => ({
    date_ops: filters.date_ops,
    shift_id: filters.shift_id,
    area: filters.area,
    lokasi_site_id: filters.lokasi_site_id,
    lokasi_pit_id: filters.lokasi_pit_id,
  }), [filters]);

  const matrix = useFleetMatrix(matrixParams, enabled, REFRESH_INTERVAL_MS);
  const summary = useFleetSummary(summaryParams, enabled, REFRESH_INTERVAL_MS);

  const matrixData = matrix.matrix.data || [];
  const summaryData = summary.summary || {};
  const hasData = matrixData.length > 0;
  const areaOptions = useMemo(
    () => [...new Set(lokasiKerja.lokasiKerja.map((item) => String(item.area || '').trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'id')),
    [lokasiKerja.lokasiKerja]
  );
  const lokasiOptions = useMemo(
    () => lokasiKerja.lokasiKerja.filter((item) => !filters.area || String(item.area || '') === String(filters.area)),
    [filters.area, lokasiKerja.lokasiKerja]
  );

  useEffect(() => {
    setRefreshCountdown(REFRESH_INTERVAL_SECONDS);
    if (!enabled) return undefined;

    const timer = window.setInterval(() => {
      setRefreshCountdown((current) => current <= 1 ? REFRESH_INTERVAL_SECONDS : current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [enabled, filters]);

  useEffect(() => {
    if (matrix.isValidating || summary.isValidating) {
      setRefreshCountdown(REFRESH_INTERVAL_SECONDS);
    }
  }, [matrix.isValidating, summary.isValidating]);

  const setFilter = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleTogglePresentation = () => setIsPresentation((prev) => !prev);

  const filterPaperStyle = {
    px: 1.25,
    py: 0.55,
    minWidth: { sm: 145 },
    borderRadius: 1.5,
    bgcolor: surfaceColor,
    backgroundImage: 'none'
  };

  const filterLabelStyle = {
    display: 'block',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'text.secondary'
  };

  const filterSelectStyle = {
    width: '100%',
    fontSize: 10,
    fontWeight: 700,
    '& .MuiSelect-select': { py: 0.15, pr: '24px !important' }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        height: isPresentation ? '100vh' : 'auto',
        width: '100%',
        overflow: isPresentation ? 'hidden' : 'auto',
        px: isPresentation ? { xs: 0.75, md: 1 } : { xs: 1.25, md: 2.25 },
        py: isPresentation ? { xs: 0.75, md: 1 } : { xs: 1.25, md: 1.5 },
        color: 'text.primary',
        background: `radial-gradient(circle at 18% 0, ${alpha(theme.palette.primary.main, darkMode ? 0.18 : 0.1)} 0, transparent 32%), ${canvasColor}`,
      }}
    >
      <Box
        sx={{
          maxWidth: isPresentation ? 'none' : 1920,
          mx: 'auto',
          height: isPresentation ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        {/* Header */}
        <Stack
          component="header"
          direction={{ xs: 'column', lg: 'row' }}
          spacing={{ xs: 1.25, lg: 2 }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', lg: 'center' }}
          sx={{ pb: 1.25, mb: 1.25, borderBottom: '1px solid', borderColor: darkMode ? '#21394f' : 'divider', flexShrink: 0 }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                color: 'primary.main',
                fontSize: 13,
                fontWeight: 900,
                boxShadow: `0 0 18px ${alpha(theme.palette.primary.main, 0.25)}`
              }}
            >
              PR
            </Box>
            <Box>
              <Typography color="primary.main" sx={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.8 }}>
                INTEGRATED CONTROL ROOM
              </Typography>
              <Typography component="h1" sx={{ fontSize: { xs: 15, sm: 18 }, fontWeight: 800, letterSpacing: 0.45, lineHeight: 1.25 }}>
                FLEET MONITORING
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={0.8}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="flex-end"
            flexWrap="wrap"
            useFlexGap
          >
            {!isPresentation && (
              <>
                <Paper variant="outlined" sx={filterPaperStyle}>
                  <Typography sx={filterLabelStyle}>Area</Typography>
                  <Select
                    value={filters.area}
                    onChange={(event) => setFilters((current) => ({ ...current, area: event.target.value, lokasi_pit_id: '' }))}
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    disabled={lokasiKerja.lokasiKerjaLoading}
                    inputProps={{ 'aria-label': 'Filter area' }}
                    sx={filterSelectStyle}
                  >
                    <MenuItem value="" sx={{ fontSize: 11 }}>All Area</MenuItem>
                    {areaOptions.map((area) => (
                      <MenuItem key={area} value={area} sx={{ fontSize: 11 }}>{area}</MenuItem>
                    ))}
                  </Select>
                </Paper>

                <Paper variant="outlined" sx={filterPaperStyle}>
                  <Typography sx={filterLabelStyle}>Penyewa</Typography>
                  <Select
                    value={filters.lokasi_site_id}
                    onChange={setFilter('lokasi_site_id')}
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    disabled={filterOptions.loading}
                    inputProps={{ 'aria-label': 'Filter penyewa' }}
                    sx={filterSelectStyle}
                  >
                    <MenuItem value="" sx={{ fontSize: 11 }}>All Penyewa</MenuItem>
                    {filterOptions.penyewa.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: 11 }}>
                        {item.nama || item.initial || `Penyewa ${item.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Paper>

                <Paper variant="outlined" sx={{ ...filterPaperStyle, minWidth: { sm: 165 } }}>
                  <Typography sx={filterLabelStyle}>Lokasi Kerja</Typography>
                  <Select
                    value={filters.lokasi_pit_id}
                    onChange={setFilter('lokasi_pit_id')}
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    disabled={lokasiKerja.lokasiKerjaLoading}
                    inputProps={{ 'aria-label': 'Filter lokasi kerja' }}
                    sx={filterSelectStyle}
                  >
                    <MenuItem value="" sx={{ fontSize: 11 }}>All Lokasi Kerja</MenuItem>
                    {lokasiOptions.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: 11 }}>
                        {item.nama || item.abbr || `Lokasi ${item.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Paper>

                <Paper variant="outlined" sx={filterPaperStyle}>
                  <Typography component="label" htmlFor="produksi-date" sx={filterLabelStyle}>
                    Reporting Date
                  </Typography>
                  <Box
                    id="produksi-date"
                    component="input"
                    type="date"
                    value={filters.date_ops}
                    max={moment().format('YYYY-MM-DD')}
                    onChange={(event) => { if (event.target.value) setFilters((current) => ({ ...current, date_ops: event.target.value })); }}
                    sx={{
                      width: '100%',
                      p: 0,
                      border: 0,
                      outline: 0,
                      bgcolor: 'transparent',
                      color: 'text.primary',
                      colorScheme: darkMode ? 'dark' : 'light',
                      fontFamily: 'inherit',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1.5
                    }}
                  />
                </Paper>

                <Paper variant="outlined" sx={filterPaperStyle}>
                  <Typography sx={filterLabelStyle}>Shift</Typography>
                  <Select
                    value={filters.shift_id}
                    onChange={setFilter('shift_id')}
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    disabled={filterOptions.loading}
                    inputProps={{ 'aria-label': 'Filter shift' }}
                    sx={filterSelectStyle}
                  >
                    <MenuItem value="" sx={{ fontSize: 11 }}>All Shift</MenuItem>
                    {filterOptions.shifts.map((shift) => (
                      <MenuItem key={shift.id} value={String(shift.id)} sx={{ fontSize: 11 }}>
                        {shift.nama || `Shift ${shift.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Paper>
              </>
            )}

            <Box
              component="button"
              type="button"
              onClick={handleTogglePresentation}
              aria-label={isPresentation ? 'Stop presentation' : 'Start presentation'}
              title={isPresentation ? 'Stop presentation' : 'Start presentation'}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: isPresentation ? 'error.main' : darkMode ? '#35516a' : 'divider',
                bgcolor: isPresentation ? 'error.main' : surfaceColor,
                color: isPresentation ? 'error.contrastText' : 'text.primary',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.2,
                minHeight: 36,
                '&:hover': {
                  bgcolor: isPresentation ? 'error.dark' : alpha(theme.palette.primary.main, darkMode ? 0.12 : 0.08)
                }
              }}
            >
              <PresentionChart size={18} variant="Bold" />
              {isPresentation ? 'Stop' : 'Start'}
            </Box>
          </Stack>
        </Stack>

        {/* Body */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: isPresentation ? 0.75 : 1.25 }}>
          {access.accessLoading ? (
            <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>
          ) : access.accessError || !access.permissions.read ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>Akses Fleet Assignment tidak tersedia. Data ditutup secara default.</Alert>
          ) : (
            <>
              {/* Summary Cards */}
              <Paper component="section" variant="outlined" sx={{ ...sectionStyle, p: isPresentation ? 0.75 : sectionStyle.p, borderRadius: isPresentation ? 1.5 : 2, flexShrink: 0 }}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: isPresentation ? 0.5 : 1 }}>
                  <Stack direction="row" spacing={0.65} alignItems="center">
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', boxShadow: `0 0 7px ${alpha(theme.palette.primary.main, 0.7)}` }} />
                    <Typography sx={{ fontSize: isPresentation ? 11 : 12, fontWeight: 900, letterSpacing: 1 }}>FLEET SUMMARY</Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontSize: 10, fontWeight: 700 }}>
                    {moment(filters.date_ops).locale('id').format('dddd, DD MMM YYYY')}
                    {filters.shift_id ? ` · Shift ${filters.shift_id}` : ' · All Shift'}
                  </Typography>
                </Stack>
                <SummaryCardSection summary={summaryData} loading={summary.isLoading} presentation={isPresentation} />
              </Paper>

              {/* Equipment Board */}
              <Paper component="section" variant="outlined" sx={{ ...sectionStyle, p: isPresentation ? 0.85 : sectionStyle.p, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: isPresentation ? 0.65 : 1.25 }}>
                  <Stack direction="row" spacing={0.65} alignItems="center">
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main', boxShadow: `0 0 7px ${alpha(theme.palette.info.main, 0.7)}` }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>FLEET STATUS BOARD</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography color="text.secondary" sx={{ fontSize: isPresentation ? 11 : 10, fontWeight: 700 }}>
                      {hasData ? `${matrixData.length} unit` : '0 unit'}
                    </Typography>
                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: matrix.isValidating || summary.isValidating ? 'warning.main' : 'success.main',
                          boxShadow: `0 0 7px ${alpha(matrix.isValidating || summary.isValidating ? theme.palette.warning.main : theme.palette.success.main, 0.65)}`
                        }}
                      />
                      <Typography color="text.secondary" sx={{ fontSize: isPresentation ? 10 : 9, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {matrix.isValidating || summary.isValidating
                          ? 'Memperbarui data...'
                          : `Refetch dalam 00:${String(refreshCountdown).padStart(2, '0')}`}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                {summary.error && (
                  <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>{fleetErrorMessage(summary.error, 'Gagal memuat ringkasan.')}</Alert>
                )}
                {matrix.error && (
                  <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{fleetErrorMessage(matrix.error, 'Gagal memuat matrix equipment.')}</Alert>
                )}

                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  {matrix.isLoading ? (
                    <MatrixSkeleton presentation={isPresentation} />
                  ) : !hasData ? (
                    <Box sx={{ py: isPresentation ? 6 : 4, textAlign: 'center' }}>
                      <GridViewOutlinedIcon sx={{ fontSize: isPresentation ? 56 : 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary" sx={{ fontSize: isPresentation ? 16 : 14 }}>
                        Tidak ada equipment untuk filter ini.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: isPresentation
                          ? 'repeat(auto-fill, minmax(96px, 1fr))'
                          : { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(6, minmax(0, 1fr))', md: 'repeat(8, minmax(0, 1fr))', lg: 'repeat(12, minmax(0, 1fr))' },
                        gap: isPresentation ? 0.75 : 0.8,
                        p: isPresentation ? 0.5 : { xs: 0.5, md: 1 },
                        borderRadius: 2.5,
                      }}
                    >
                      {matrixData.map((item, index) => (
                        <EquipmentCardReadOnly
                          key={item.item_id || item.equipment_id || index}
                          item={item}
                          presentation={isPresentation}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
