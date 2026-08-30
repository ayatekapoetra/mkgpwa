'use client';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { PresentionChart } from 'iconsax-react';

import {
  useGetSiteMonitoringDumpTruckStatus,
  useGetSiteMonitoringFilterOptions,
  useGetSiteMonitoringHeStatus,
  useGetSiteMonitoringPoStockStatus,
  useGetSiteMonitoringPrStatus,
  useGetSiteMonitoringProduction,
  useGetSiteMonitoringStandbyDtDetail,
  useGetSiteMonitoringStandbyHeDetail,
  useGetManPowerPerSite,
  useGetDailyAttendance
} from 'api/site-monitoring';
import siteMonitoringMock from './mock-data';

const numberFormatter = new Intl.NumberFormat('id-ID');
const pitTones = ['info', 'primary', 'warning', 'success', 'error'];

moment.locale('id');

function compactNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 ? 1 : 0)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(value < 10000 && value % 1000 ? 1 : 0)}k`;
  return String(value);
}

function getNiceMaximum(values) {
  const largestStack = Math.max(0, ...values.map((stack) => stack.reduce((sum, value) => sum + value, 0)));
  if (!largestStack) return 1;
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(largestStack)) - 1);
  return Math.ceil((largestStack * 1.08) / magnitude) * magnitude;
}

function normalizeProduction(response, fallback) {
  if (!response) return null;

  const materials = Array.isArray(response.materials) ? response.materials : [];
  const pits = Array.isArray(response.pits)
    ? response.pits.map((pit, index) => ({ ...pit, tone: pitTones[index % pitTones.length] }))
    : [];
  const periods = Array.isArray(response.periods) ? response.periods : [];

  return {
    ...fallback,
    materials: materials.map((material) => material.label),
    pits,
    periods: ['DAILY', 'MTD'].map((name) => {
      const period = periods.find((item) => item.name === name) || {};
      const valueMap = new Map(
        (period.values || []).map((item) => [`${item.material_key}|${item.pit_key}`, Number(item.value || 0)])
      );

      return {
        name,
        unit: period.unit || 'MT',
        values: materials.map((material) => pits.map((pit) => valueMap.get(`${material.key}|${pit.key}`) || 0))
      };
    })
  };
}

function SectionHeader({ title, subtitle, summary }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }}>
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.15, textTransform: 'uppercase', lineHeight: 1.25 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 10, mt: 0.25 }}>
          {subtitle}
        </Typography>
      </Box>
      {summary}
    </Stack>
  );
}

function ProductionChart({ period, materials = [], pits = [], tones, surfaceColor, empty = false, presentation = false }) {
  const values = Array.isArray(period?.values) ? period.values : [];
  const maximum = getNiceMaximum(values.length ? values : [[0]]);
  const total = values.flat().reduce((sum, value) => sum + value, 0);
  const ticks = [maximum, maximum * 0.75, maximum * 0.5, maximum * 0.25, 0];
  const accent = tones[{ DAILY: 'info', MTD: 'primary', YTD: 'warning' }[period?.name] || 'info'];
  const hasBars = !empty && values.some((stack) => stack.some((value) => Number(value) > 0));
  const chartHeight = presentation ? 420 : 220;
  const barHeight = presentation ? 360 : 194;
  const barWidth = presentation ? { xs: 28, md: 42 } : { xs: 19, md: 24 };
  const materialMinWidth = presentation ? 90 : 62;

  return (
    <Box
      sx={{
        minWidth: 0,
        height: '100%',
        p: presentation ? { xs: 1.5, md: 2 } : 1.25,
        border: '1px solid',
        borderTop: `3px solid ${accent}`,
        borderColor: tones.divider,
        borderTopColor: accent,
        borderRadius: 1.5,
        bgcolor: surfaceColor,
        boxShadow: `inset 0 1px 0 ${alpha(accent, 0.12)}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: presentation ? 1.25 : 0.75 }}>
        <Stack direction="row" spacing={0.65} alignItems="center">
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent, boxShadow: `0 0 7px ${alpha(accent, 0.7)}` }} />
          <Typography sx={{ fontSize: presentation ? 18 : 11, fontWeight: 900, letterSpacing: 1 }}>{period?.name || '-'}</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ fontSize: presentation ? 14 : 9, fontWeight: 700 }}>
          {hasBars ? `${compactNumber(total)} ${period?.unit || 'MT'}` : `0 ${period?.unit || 'MT'}`}
        </Typography>
      </Stack>

      <Box sx={{ overflowX: 'auto', pb: 0.25, flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            height: presentation ? '100%' : chartHeight,
            minHeight: chartHeight,
            position: 'relative',
            pl: hasBars ? (presentation ? 5.5 : 4.5) : 0,
            pt: 0.5,
            minWidth: hasBars ? Math.max(presentation ? 520 : 280, materials.length * materialMinWidth) : presentation ? 520 : 280,
            display: 'flex',
            alignItems: hasBars ? 'stretch' : 'center',
            justifyContent: hasBars ? 'flex-start' : 'center'
          }}
        >
          {hasBars ? (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  left: presentation ? 42 : 34,
                  right: 0,
                  top: 4,
                  bottom: presentation ? 36 : 22,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(25% - 1px), ${alpha(tones.divider, 0.55)} 25%)`
                }}
              />
              <Stack sx={{ position: 'absolute', left: 0, top: 0, bottom: presentation ? 34 : 20 }} justifyContent="space-between">
                {ticks.map((tick) => (
                  <Typography key={tick} color="text.secondary" sx={{ fontSize: presentation ? 11 : 8, lineHeight: 1 }}>
                    {compactNumber(tick)}
                  </Typography>
                ))}
              </Stack>

              <Stack direction="row" spacing={presentation ? 1.8 : 1.2} alignItems="flex-end" sx={{ height: '100%', position: 'relative', width: '100%' }}>
                {values.map((stackValues, materialIndex) => (
                  <Stack key={`${materials[materialIndex]}-${materialIndex}`} alignItems="center" justifyContent="flex-end" sx={{ flex: 1, height: '100%', minWidth: 0 }}>
                    <Box
                      role="img"
                      aria-label={`${materials[materialIndex]}: ${numberFormatter.format(stackValues.reduce((sum, value) => sum + value, 0))} ${period.unit}`}
                      sx={{
                        width: barWidth,
                        maxWidth: '70%',
                        height: presentation ? 'calc(100% - 36px)' : barHeight,
                        minHeight: presentation ? 280 : barHeight,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        justifyContent: 'flex-start',
                        borderRadius: '4px 4px 1px 1px',
                        overflow: 'hidden',
                        bgcolor: surfaceColor
                      }}
                    >
                      {stackValues.map((value, pitIndex) =>
                        value ? (
                          <Tooltip
                            key={pits[pitIndex].key}
                            title={`${materials[materialIndex]} · ${pits[pitIndex].label}: ${numberFormatter.format(value)} ${period.unit}`}
                            placement="top"
                            arrow
                          >
                            <Box
                              sx={{
                                height: `${(value / maximum) * 100}%`,
                                minHeight: 2,
                                bgcolor: tones[pits[pitIndex].tone],
                                borderTop: `1px solid ${alpha(surfaceColor, 0.65)}`,
                                cursor: 'default'
                              }}
                            />
                          </Tooltip>
                        ) : null
                      )}
                    </Box>
                    <Typography noWrap color="text.secondary" sx={{ width: '100%', textAlign: 'center', fontSize: presentation ? 12 : 8, mt: 0.75, fontWeight: presentation ? 700 : 400 }}>
                      {materials[materialIndex]}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: presentation ? 16 : 11, textAlign: 'center', px: 2 }}>
              Belum ada data ritase production
            </Typography>
          )}
        </Box>
      </Box>

      {presentation && hasBars && (
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1.5, pt: 1.25, borderTop: '1px solid', borderColor: 'divider' }}
        >
          {pits.map((pit) => (
            <Stack key={pit.key} direction="row" spacing={0.75} alignItems="center" sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: alpha(tones[pit.tone], 0.12) }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: tones[pit.tone] }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{pit.label}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function ManPowerBarChart({ items, total, unit, tones, surfaceColor }) {
  const maxValue = Math.max(0, ...items.map((item) => Number(item.value || 0)));
  const niceMax = maxValue > 0 ? Math.ceil(maxValue * 1.1 / 10) * 10 : 10;
  const ticks = [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.25,
        border: '1px solid',
        borderTop: '3px solid',
        borderColor: tones.divider,
        borderTopColor: tones.info,
        borderRadius: 1.5,
        bgcolor: surfaceColor,
        boxShadow: `inset 0 1px 0 ${alpha(tones.info, 0.12)}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5 }}>MAN POWER</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 10, fontWeight: 700 }}>
          {numberFormatter.format(total)} {unit || 'Person'}
        </Typography>
      </Stack>

      <Box sx={{ overflowX: 'auto', pb: 0.25, flex: 1, minHeight: 200 }}>
        <Box
          sx={{
            height: 220,
            position: 'relative',
            pl: 4.5,
            pt: 0.5,
            minWidth: Math.max(320, items.length * 56),
            display: 'flex',
            alignItems: 'flex-end'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 34,
              right: 0,
              top: 4,
              bottom: 22,
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(25% - 1px), ${alpha(tones.divider, 0.55)} 25%)`
            }}
          />
          <Stack sx={{ position: 'absolute', left: 0, top: 0, bottom: 20 }} justifyContent="space-between">
            {ticks.map((tick) => (
              <Typography key={tick} color="text.secondary" sx={{ fontSize: 8, lineHeight: 1 }}>
                {compactNumber(tick)}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={0.8} alignItems="flex-end" sx={{ height: '100%', position: 'relative', width: '100%' }}>
            {items.map((item) => {
              const heightPercent = niceMax > 0 ? (Number(item.value || 0) / niceMax) * 100 : 0;
              return (
                <Stack key={item.label} alignItems="center" justifyContent="flex-end" sx={{ flex: 1, height: '100%', minWidth: 0 }}>
                  <Tooltip title={`${item.label}: ${numberFormatter.format(item.value)} ${unit || 'Person'}`} placement="top" arrow>
                    <Box
                      sx={{
                        width: { xs: 22, md: 28 },
                        maxWidth: '80%',
                        height: `${Math.max(heightPercent, 0)}%`,
                        minHeight: item.value > 0 ? 3 : 0,
                        borderRadius: '4px 4px 1px 1px',
                        bgcolor: tones[item.tone] || tones.info,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        overflow: 'visible',
                        cursor: 'default'
                      }}
                    >
                      {item.value > 0 && (
                        <Typography sx={{ fontSize: 8, fontWeight: 800, color: 'common.white', mt: 0.25, lineHeight: 1 }}>
                          {compactNumber(item.value)}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                  <Typography
                    noWrap
                    color="text.secondary"
                    sx={{ width: '100%', textAlign: 'center', fontSize: 7, mt: 0.5, lineHeight: 1.1 }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function StatusDonutCard({ card, tones, surfaceColor, presentation = false, legendBelow = false, large = false, accentTone }) {
  const total = card.items.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = 0;
  const stops = card.items.map((item) => {
    const end = start + (item.value / total) * 100;
    const stop = `${tones[item.tone]} ${start}% ${end}%`;
    start = end;
    return stop;
  });

  const sizeScale = large ? 2 : 1;
  const donutSize = presentation
    ? { xs: 180 * sizeScale, md: 240 * sizeScale }
    : legendBelow
      ? { xs: 120 * sizeScale, md: 140 * sizeScale }
      : { xs: 100 * sizeScale, md: 116 * sizeScale };
  const donutInset = presentation
    ? { xs: 28 * sizeScale, md: 36 * sizeScale }
    : legendBelow
      ? { xs: 16 * sizeScale, md: 20 * sizeScale }
      : { xs: 13 * sizeScale, md: 16 * sizeScale };

  return (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 0,
        height: presentation ? '100%' : 'auto',
        p: presentation ? { xs: 2, md: 3 } : 1.15,
        borderRadius: 1.5,
        bgcolor: surfaceColor,
        backgroundImage: 'none',
        borderColor: 'divider',
        ...(accentTone && {
          borderTop: `3px solid ${tones[accentTone]}`,
          boxShadow: `inset 0 1px 0 ${alpha(tones[accentTone], 0.12)}`
        }),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: presentation || legendBelow ? 'center' : 'flex-start'
      }}
    >
      <Typography sx={{ fontSize: presentation ? 18 : 12, fontWeight: 800, letterSpacing: 0.3, mb: presentation ? 2 : 0.75, textAlign: presentation || legendBelow ? 'center' : 'left' }}>
        {card.title}
      </Typography>
      <Stack
        direction={presentation ? { xs: 'column', md: 'row' } : legendBelow ? 'column' : 'row'}
        spacing={presentation ? 3 : legendBelow ? 1.25 : 1.1}
        alignItems="center"
        justifyContent={presentation || legendBelow ? 'center' : 'flex-start'}
      >
        <Tooltip
          title={
            <Stack spacing={0.35}>
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>
                Total: {numberFormatter.format(card.total)} {card.unit}
              </Typography>
              {card.items.map((item) => (
                <Typography key={item.label} sx={{ fontSize: 10 }}>
                  {item.label}: {numberFormatter.format(item.value)}
                </Typography>
              ))}
            </Stack>
          }
          placement="top"
          arrow
        >
          <Box
            role="img"
            aria-label={`${card.title}: ${card.items.map((item) => `${item.label} ${item.value}`).join(', ')}`}
            sx={{
              width: donutSize,
              height: donutSize,
              flexShrink: 0,
              borderRadius: '60%',
              display: 'grid',
              placeItems: 'center',
              background: `conic-gradient(${stops.join(', ')})`,
              position: 'relative',
              cursor: 'default',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: donutInset,
                borderRadius: '60%',
                bgcolor: surfaceColor
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: presentation ? { xs: 32 * sizeScale, md: 42 * sizeScale } : legendBelow ? { xs: 22 * sizeScale, md: 26 * sizeScale } : { xs: 20 * sizeScale, md: 23 * sizeScale }, lineHeight: 1, fontWeight: 900 }}>
                {numberFormatter.format(card.total)}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: presentation ? { xs: 12 * sizeScale, md: 14 * sizeScale } : legendBelow ? { xs: 9 * sizeScale, md: 10 * sizeScale } : { xs: 10 * sizeScale, md: 12 * sizeScale }, textTransform: 'uppercase', mt: 0.3 }}>
                {card.unit}
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        <Stack
          direction={legendBelow && !presentation ? 'row' : 'column'}
          spacing={presentation ? 1 : legendBelow ? 0.75 : 0.45}
          flexWrap={legendBelow && !presentation ? 'wrap' : 'nowrap'}
          useFlexGap={legendBelow && !presentation}
          sx={{ minWidth: 0, flex: presentation ? 'unset' : 1, width: presentation ? { xs: '100%', md: 280 } : 'auto', justifyContent: legendBelow ? 'center' : 'flex-start' }}
        >
          {card.items.map((item) => (
            <Stack
              key={item.label}
              direction="row"
              spacing={0.8}
              alignItems="center"
              minWidth={0}
              sx={presentation ? { px: 1.25, py: 0.85, borderRadius: 1.25, bgcolor: alpha(tones[item.tone], 0.1) } : undefined}
            >
              <Box sx={{ width: presentation ? 10 : 6, height: presentation ? 10 : 6, borderRadius: '50%', bgcolor: tones[item.tone], flexShrink: 0 }} />
              <Typography noWrap color="text.secondary" sx={{ minWidth: 0, flex: 1, fontSize: presentation ? 14 : 10, fontWeight: presentation ? 600 : 400 }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: presentation ? 16 : 9, fontWeight: 800 }}>{numberFormatter.format(item.value)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function SiteMonitoringScreen() {
  const theme = useTheme();
  const data = siteMonitoringMock;
  const [filters, setFilters] = useState({
    penyewa_id: '',
    date_ops: moment().format('YYYY-MM-DD'),
    shift_id: ''
  });
  const [isPresentation, setIsPresentation] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const handleTogglePresentation = () => {
    setIsPresentation((prev) => !prev);
    setCurrentSlideIndex(0);
    setRemainingSeconds(30);
  };
  const reportingDate = filters.date_ops;
  const { production: productionResponse, loading: productionLoading, error: productionError } = useGetSiteMonitoringProduction(filters);
  const { heStatus: heStatusResponse, loading: heStatusLoading, error: heStatusError } = useGetSiteMonitoringHeStatus(filters);
  const {
    standbyHeDetail: standbyHeDetailResponse,
    loading: standbyHeDetailLoading,
    error: standbyHeDetailError
  } = useGetSiteMonitoringStandbyHeDetail(filters);
  const {
    dumpTruckStatus: dumpTruckStatusResponse,
    loading: dumpTruckStatusLoading,
    error: dumpTruckStatusError
  } = useGetSiteMonitoringDumpTruckStatus(filters);
  const {
    standbyDtDetail: standbyDtDetailResponse,
    loading: standbyDtDetailLoading,
    error: standbyDtDetailError
  } = useGetSiteMonitoringStandbyDtDetail(filters);
  const { prStatus: prStatusResponse, loading: prStatusLoading, error: prStatusError } = useGetSiteMonitoringPrStatus(filters);
  const {
    poStockStatus: poStockStatusResponse,
    loading: poStockStatusLoading,
    error: poStockStatusError
  } = useGetSiteMonitoringPoStockStatus(filters);
  const { manPower: manPowerResponse, loading: manPowerLoading, error: manPowerError } = useGetManPowerPerSite(filters);
  const { dailyAttendance: dailyAttendanceResponse, loading: dailyAttendanceLoading } = useGetDailyAttendance(filters);
  const { penyewa, shifts, loading: filterOptionsLoading } = useGetSiteMonitoringFilterOptions();
  const production = normalizeProduction(productionResponse, data.production);
  const equipmentCards = useMemo(() => {
    const liveCards = {
      'HE Status': { response: heStatusResponse, loading: heStatusLoading },
      'Standby HE Detail': { response: standbyHeDetailResponse, loading: standbyHeDetailLoading },
      'Dump Truck Status': { response: dumpTruckStatusResponse, loading: dumpTruckStatusLoading },
      'Standby DT Detail': { response: standbyDtDetailResponse, loading: standbyDtDetailLoading },
      'Purchase Request': { response: prStatusResponse, loading: prStatusLoading },
      'Purchase Order': { response: poStockStatusResponse, loading: poStockStatusLoading }
    };

    return data.equipment.cards.map((card) => {
      const live = liveCards[card.title];
      if (!live) return card;

      if (live.response?.card) {
        return {
          ...card,
          ...live.response.card,
          items: Array.isArray(live.response.card.items) ? live.response.card.items : card.items
        };
      }

      if (live.loading) {
        return {
          ...card,
          total: 0,
          items: (live.response?.card?.items || card.items).map((item) => ({ ...item, value: 0 }))
        };
      }

      return card;
    });
  }, [
    data.equipment.cards,
    heStatusResponse,
    heStatusLoading,
    standbyHeDetailResponse,
    standbyHeDetailLoading,
    dumpTruckStatusResponse,
    dumpTruckStatusLoading,
    standbyDtDetailResponse,
    standbyDtDetailLoading,
    prStatusResponse,
    prStatusLoading,
    poStockStatusResponse,
    poStockStatusLoading
  ]);
  const equipmentAvailability = useMemo(() => {
    const he = heStatusResponse?.summary;
    const dt = dumpTruckStatusResponse?.summary;
    if (!he && !dt) return data.equipment.availability;

    const operasi = Number(he?.operasi || 0) + Number(dt?.operasi || 0);
    const standby = Number(he?.standby || 0) + Number(dt?.standby || 0);
    const breakdown = Number(he?.breakdown || 0) + Number(dt?.breakdown || 0);
    const total = operasi + standby + breakdown;
    if (!total) return 0;
    return Number((((operasi + standby) / total) * 100).toFixed(1));
  }, [heStatusResponse, dumpTruckStatusResponse, data.equipment.availability]);
  const manPowerData = useMemo(() => {
    if (manPowerResponse) {
      return {
        total: manPowerResponse.total,
        unit: manPowerResponse.unit || 'Person',
        siteGroups: manPowerResponse.siteGroups || [],
        items: data.manpower.items
      };
    }
    if (manPowerLoading) {
      return {
        total: 0,
        unit: 'Person',
        siteGroups: [],
        items: data.manpower.items
      };
    }
    return data.manpower;
  }, [manPowerResponse, manPowerLoading, data.manpower]);
  const dailyAttendanceItems = useMemo(() => {
    if (dailyAttendanceResponse && dailyAttendanceResponse.length > 0) {
      const liveMap = new Map(dailyAttendanceResponse.map((item) => [item.key, item]));
      return data.manpower.items.map((item) => {
        const liveItem = liveMap.get(item.label.toLowerCase().replace(/\s+/g, '_'));
        if (liveItem) {
          return { ...item, value: liveItem.value, detail: liveItem.detail || item.detail };
        }
        return item;
      });
    }
    return data.manpower.items;
  }, [dailyAttendanceResponse, data.manpower.items]);
  const hasProductionData = Boolean(
    production?.materials?.length &&
      production?.pits?.length &&
      production?.periods?.some((period) => period.values.some((stack) => stack.some((value) => Number(value) > 0)))
  );
  const periodCards = useMemo(
    () =>
      production?.periods?.length
        ? production.periods
        : [
            { name: 'DAILY', unit: 'MT', values: [] },
            { name: 'MTD', unit: 'MT', values: [] }
          ],
    [production]
  );
  const slides = useMemo(
    () => [
      ...periodCards.map((period) => ({
        key: `production-${period.name}`,
        title: `Production · ${period.name}`,
        type: 'production',
        period
      })),
      ...equipmentCards.map((card) => ({
        key: `equipment-${card.title}`,
        title: `Equipment · ${card.title}`,
        type: 'equipment',
        card
      })),
      {
        key: 'manpower',
        title: 'Man Power',
        type: 'manpower'
      }
    ],
    [periodCards, equipmentCards]
  );

  useEffect(() => {
    if (!isPresentation || !slides.length) return undefined;

    setRemainingSeconds(30);
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setCurrentSlideIndex((current) => (current + 1) % slides.length);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPresentation, currentSlideIndex, slides.length]);

  useEffect(() => {
    if (currentSlideIndex >= slides.length) setCurrentSlideIndex(0);
  }, [currentSlideIndex, slides.length]);

  const darkMode = theme.palette.mode === 'dark';
  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const tones = {
    primary: theme.palette.primary.main,
    info: theme.palette.info.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    divider: darkMode ? '#35516a' : theme.palette.divider
  };
  const canvasColor = darkMode ? '#07111d' : theme.palette.background.default;
  const surfaceColor = darkMode ? '#0c1a29' : theme.palette.background.paper;
  const raisedSurfaceColor = darkMode ? '#102338' : alpha(theme.palette.primary.lighter, 0.36);
  const sectionStyle = {
    p: { xs: 1.25, md: 1.5 },
    borderRadius: 2,
    borderColor: darkMode ? '#21394f' : theme.palette.divider,
    background: darkMode
      ? 'linear-gradient(145deg, #0d1d2e 0%, #091725 100%)'
      : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.lighter, 0.28)} 100%)`,
    boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, darkMode ? 0.2 : 0.06)}`
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
        background: `radial-gradient(circle at 18% 0, ${alpha(theme.palette.info.main, darkMode ? 0.18 : 0.1)} 0, transparent 32%), ${canvasColor}`
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
                borderColor: 'info.main',
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                color: 'info.main',
                fontSize: 13,
                fontWeight: 900,
                boxShadow: `0 0 18px ${alpha(theme.palette.info.main, 0.25)}`
              }}
            >
              SM
            </Box>
            <Box>
              <Typography color="info.main" sx={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.8 }}>
                INTEGRATED CONTROL ROOM
              </Typography>
              <Typography component="h1" sx={{ fontSize: { xs: 15, sm: 18 }, fontWeight: 800, letterSpacing: 0.45, lineHeight: 1.25 }}>
                SITE MONITORING DASHBOARD
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
                <Paper
                  variant="outlined"
                  sx={{ px: 1.25, py: 0.55, minWidth: { sm: 180 }, borderRadius: 1.5, bgcolor: surfaceColor, backgroundImage: 'none' }}
                >
                  <Typography color="text.secondary" sx={{ display: 'block', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Pelanggan / Penyewa
                  </Typography>
                  <Select
                    value={filters.penyewa_id}
                    onChange={(event) => setFilters((current) => ({ ...current, penyewa_id: event.target.value }))}
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    disabled={filterOptionsLoading}
                    inputProps={{ 'aria-label': 'Filter pelanggan atau penyewa' }}
                    sx={{ width: '100%', fontSize: 10, fontWeight: 700, '& .MuiSelect-select': { py: 0.15, pr: '24px !important' } }}
                  >
                    <MenuItem value="" sx={{ fontSize: 11 }}>
                      All Pelanggan / Penyewa
                    </MenuItem>
                    {penyewa.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: 11 }}>
                        {item.nama || item.initial || `Penyewa ${item.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ px: 1.25, py: 0.55, minWidth: { sm: 145 }, borderRadius: 1.5, bgcolor: surfaceColor, backgroundImage: 'none' }}
                >
                  <Typography
                    component="label"
                    htmlFor="site-monitoring-date"
                    color="text.secondary"
                    sx={{ display: 'block', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 }}
                  >
                    Reporting Date
                  </Typography>
                  <Box
                    id="site-monitoring-date"
                    component="input"
                    type="date"
                    value={reportingDate}
                    max={moment().format('YYYY-MM-DD')}
                    onChange={(event) => {
                      if (event.target.value) setFilters((current) => ({ ...current, date_ops: event.target.value }));
                    }}
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

                <Paper
                  variant="outlined"
                  sx={{ px: 1.25, py: 0.55, minWidth: { sm: 135 }, borderRadius: 1.5, bgcolor: surfaceColor, backgroundImage: 'none' }}
                >
                  <Typography color="text.secondary" sx={{ display: 'block', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Shift
                  </Typography>
                  <Select
                    value={filters.shift_id}
                    onChange={(event) => setFilters((current) => ({ ...current, shift_id: event.target.value }))}
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    disabled={filterOptionsLoading}
                    inputProps={{ 'aria-label': 'Filter shift' }}
                    sx={{ width: '100%', fontSize: 10, fontWeight: 700, '& .MuiSelect-select': { py: 0.15, pr: '24px !important' } }}
                  >
                    <MenuItem value="" sx={{ fontSize: 11 }}>
                      All Shift
                    </MenuItem>
                    {shifts.map((shift) => (
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
                  bgcolor: isPresentation ? 'error.dark' : alpha(theme.palette.info.main, darkMode ? 0.12 : 0.08)
                }
              }}
            >
              <PresentionChart size={18} variant="Bold" />
              {isPresentation ? 'Stop' : 'Start'}
            </Box>
          </Stack>
        </Stack>

        {isPresentation ? (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25, flexShrink: 0 }}>
              <Typography sx={{ fontSize: { xs: 16, md: 22 }, fontWeight: 900 }}>{currentSlide?.title || 'Presentation'}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  Next in
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{formatCountdown(remainingSeconds)}</Typography>
              </Stack>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {currentSlide?.type === 'production' && (
                <Box sx={{ height: '100%' }}>
                  {productionLoading && !productionResponse ? (
                    <Paper variant="outlined" sx={{ height: '100%', display: 'grid', placeItems: 'center', bgcolor: surfaceColor, backgroundImage: 'none' }}>
                      <Typography color="text.secondary">Memuat data production dari ritase...</Typography>
                    </Paper>
                  ) : productionError && !productionResponse ? (
                    <Paper variant="outlined" sx={{ height: '100%', display: 'grid', placeItems: 'center', bgcolor: surfaceColor, backgroundImage: 'none', borderColor: 'error.main' }}>
                      <Typography color="error.main">Gagal memuat data production.</Typography>
                    </Paper>
                  ) : (
                    <ProductionChart
                      period={currentSlide.period}
                      materials={production?.materials || []}
                      pits={production?.pits || []}
                      tones={tones}
                      surfaceColor={surfaceColor}
                      empty={!hasProductionData}
                      presentation
                    />
                  )}
                </Box>
              )}

              {currentSlide?.type === 'equipment' && currentSlide.card && (
                <Box sx={{ height: '100%', maxWidth: 900, mx: 'auto', width: '100%' }}>
                  <StatusDonutCard card={currentSlide.card} tones={tones} surfaceColor={surfaceColor} presentation />
                </Box>
              )}

              {currentSlide?.type === 'manpower' && (
                <Box sx={{ height: '100%', maxWidth: 1400, mx: 'auto', width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, overflow: 'auto' }}>
                  <Box sx={{ flex: { md: '1 1 60%' }, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StatusDonutCard
                      card={{
                        title: 'Man Power',
                        total: manPowerData.total,
                        unit: manPowerData.unit || 'Person',
                        items: manPowerData.siteGroups || []
                      }}
                      tones={tones}
                      surfaceColor={surfaceColor}
                      presentation
                      large
                    />
                  </Box>
                  <Box sx={{ flex: { md: '1 1 40%' }, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.3, textAlign: 'center' }}>
                      Daily Attendance
                    </Typography>
                    <Stack spacing={0.9}>
                      {dailyAttendanceItems.map((item) => (
                        <Paper key={item.label} variant="outlined" sx={{ px: 1.25, py: 1, bgcolor: surfaceColor, backgroundImage: 'none', borderRadius: 1.25 }}>
                          <Stack direction="row" spacing={0.8} justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={0.7} alignItems="center" minWidth={0}>
                              <Box sx={{ width: 5, height: 24, borderRadius: 1, bgcolor: tones[item.tone], flexShrink: 0 }} />
                              <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
                                {item.label}
                              </Typography>
                            </Stack>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontSize: 22, lineHeight: 1, fontWeight: 900 }}>{numberFormatter.format(item.value)}</Typography>
                              <Typography color="text.secondary" sx={{ fontSize: 10, mt: 0.2 }}>
                                {item.detail}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1.25, flexShrink: 0 }}>
              {slides.map((slide, idx) => (
                <Box
                  key={slide.key}
                  component="button"
                  type="button"
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setRemainingSeconds(30);
                  }}
                  aria-label={`Go to slide ${slide.title}`}
                  sx={{
                    width: idx === currentSlideIndex ? 24 : 10,
                    height: 10,
                    borderRadius: 999,
                    border: 0,
                    p: 0,
                    cursor: 'pointer',
                    bgcolor: idx === currentSlideIndex ? 'info.main' : alpha(theme.palette.text.secondary, 0.35),
                    transition: '0.2s ease'
                  }}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <>
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, minmax(0, 1fr))' } }}>
            <Paper component="section" variant="outlined" sx={{ ...sectionStyle, gridColumn: { lg: '1 / -1' } }}>
              <SectionHeader
                title={data.production.title}
                subtitle="Tonase produksi berdasarkan material dan pit"
                summary={
                  <Typography sx={{ px: 1.1, py: 0.55, borderRadius: 1.25, bgcolor: raisedSurfaceColor, fontSize: 9, color: 'text.secondary' }}>
                    Target dummy bulan ini{' '}
                    <Box component="strong" sx={{ color: 'text.primary' }}>
                      {numberFormatter.format(data.production.target)} MT
                    </Box>
                  </Typography>
                }
              />

              <Box
                sx={{
                  mt: 1,
                  display: 'grid',
                  gap: { xs: 2, md: 1.5 },
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  alignItems: 'stretch'
                }}
              >
                {productionLoading && !productionResponse ? (
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, textAlign: 'center', bgcolor: surfaceColor, backgroundImage: 'none', gridColumn: { md: 'span 2' } }}
                  >
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                      Memuat data production dari ritase...
                    </Typography>
                  </Paper>
                ) : productionError && !productionResponse ? (
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, textAlign: 'center', bgcolor: surfaceColor, backgroundImage: 'none', borderColor: 'error.main', gridColumn: { md: 'span 2' } }}
                  >
                    <Typography color="error.main" sx={{ fontSize: 11 }}>
                      Gagal memuat data production.
                    </Typography>
                  </Paper>
                ) : (
                  periodCards.map((period) => (
                    <ProductionChart
                      key={period.name}
                      period={period}
                      materials={production?.materials || []}
                      pits={production?.pits || []}
                      tones={tones}
                      surfaceColor={surfaceColor}
                      empty={!hasProductionData}
                    />
                  ))
                )}
                <StatusDonutCard
                  card={{
                    title: 'Man Power',
                    total: manPowerData.total,
                    unit: manPowerData.unit || 'Person',
                    items: manPowerData.siteGroups || []
                  }}
                  tones={tones}
                  surfaceColor={surfaceColor}
                  legendBelow
                  accentTone="warning"
                />
              </Box>

              {hasProductionData && (
                <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {production.pits.map((pit) => (
                    <Stack key={pit.key} direction="row" spacing={0.6} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: 0.4, bgcolor: tones[pit.tone] }} />
                      <Typography color="text.secondary" sx={{ fontSize: 8 }}>
                        {pit.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper component="section" variant="outlined" sx={{ ...sectionStyle, gridColumn: { lg: 'span 3' } }}>
              <SectionHeader
                title="Equipment & Spare Part"
                subtitle="Unit availability, standby breakdown & procurement status"
                summary={
                  <Typography sx={{ px: 1.1, py: 0.55, borderRadius: 1.25, bgcolor: raisedSurfaceColor, fontSize: 9, color: 'text.secondary' }}>
                        Availability <Box component="strong" sx={{ color: 'text.primary' }}>{equipmentAvailability}%</Box>
                        {' · '}Critical item <Box component="strong" sx={{ color: 'error.main' }}>{data.equipment.criticalItems}</Box>
                        {heStatusError ||
                        standbyHeDetailError ||
                        dumpTruckStatusError ||
                        standbyDtDetailError ||
                        prStatusError ||
                        poStockStatusError ? (
                          <Box component="span" sx={{ color: 'error.main', ml: 0.75 }}>
                            · Equipment/PR/PO API error
                          </Box>
                        ) : null}
                      </Typography>
                    }
                  />
                  <Box
                    sx={{
                      mt: 1,
                      display: 'grid',
                      gap: 0.9,
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }
                    }}
                  >
                {equipmentCards.map((card) => (
                  <StatusDonutCard key={card.title} card={card} tones={tones} surfaceColor={surfaceColor} />
                ))}
              </Box>
            </Paper>

            <Paper component="aside" variant="outlined" sx={{ ...sectionStyle, gridColumn: { lg: 'span 1' } }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3, mb: 0.75 }}>
                Daily Attendance
              </Typography>
              <Stack spacing={0.65}>
                {dailyAttendanceItems.map((item) => (
                  <Paper key={item.label} variant="outlined" sx={{ px: 1, py: 0.65, bgcolor: surfaceColor, backgroundImage: 'none', borderRadius: 1.25 }}>
                    <Stack direction="row" spacing={0.8} justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={0.7} alignItems="center" minWidth={0}>
                        <Box sx={{ width: 5, height: 20, borderRadius: 1, bgcolor: tones[item.tone], flexShrink: 0 }} />
                        <Typography noWrap sx={{ fontSize: 10, fontWeight: 700 }}>
                          {item.label}
                        </Typography>
                      </Stack>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1, fontWeight: 900 }}>{numberFormatter.format(item.value)}</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 7, mt: 0.2 }}>
                          {item.detail}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Box>
          </>
        )}

        {!isPresentation && <Stack
          component="footer"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={0.75}
          justifyContent="space-between"
          sx={{ pt: 1, color: 'text.secondary' }}
        >
          <Typography sx={{ fontSize: 8 }}>
            Production, equipment (HE/DT), PR, PO, Man Power & Daily Attendance dari data real · refresh setiap{' '}
            {data.meta.refreshMinutes} menit
          </Typography>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: productionError ? 'error.main' : 'success.main', animation: 'pulse 2s infinite' }} />
            <Typography color={productionError ? 'error.main' : 'success.main'} sx={{ fontSize: 8, fontWeight: 700 }}>
              Production API: {productionError ? 'Degraded' : 'Normal'}
            </Typography>
          </Stack>
        </Stack>}
      </Box>
    </Box>
  );
}
