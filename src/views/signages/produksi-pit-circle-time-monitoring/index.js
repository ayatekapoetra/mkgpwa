'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import 'moment/locale/id';
import { PresentionChart, TruckFast, Timer1, Calendar1, HierarchySquare3, Box1, Warning2 } from 'iconsax-react';

import FleetPerformanceChart from './FleetPerformanceChart';
import { useGetProduksiPitCircleTimeMonitoring, useGetCabangAreaList } from 'api/produksi-pit-circle-time-monitoring';

moment.locale('id');

const SummaryChip = ({ icon, title, value, accent = '#2563eb' }) => (
  <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, height: '100%' }}>
    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
      <Stack alignItems="center" justifyContent="center" sx={{ width: 30, height: 30, borderRadius: '999px', bgcolor: `${accent}22`, color: accent, flexShrink: 0 }}>
        {icon}
      </Stack>
      <Stack spacing={0.3} minWidth={0}>
        <Typography variant="h5" fontWeight={700} lineHeight={1.1} noWrap>{value}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{title}</Typography>
      </Stack>
    </Stack>
  </Paper>
);

const PresentationMetric = ({ icon, title, value, accent = '#2563eb' }) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 1.5, md: 2 },
      borderRadius: 3,
      height: '100%',
      bgcolor: 'rgba(255,255,255,0.92)',
      borderColor: `${accent}44`
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: { xs: 40, md: 54 }, height: { xs: 40, md: 54 }, borderRadius: 2.5, bgcolor: `${accent}22`, color: accent, flexShrink: 0 }}
      >
        {icon}
      </Stack>
      <Stack minWidth={0}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" noWrap>{title}</Typography>
        <Typography variant="h4" fontWeight={900} lineHeight={1.15} noWrap>{value}</Typography>
      </Stack>
    </Stack>
  </Paper>
);

export default function ProduksiPitCircleTimeMonitoringScreen() {
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(10);
  const [dateRange, setDateRange] = useState({
    start: moment().add(-2, 'day').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [appliedDateRange, setAppliedDateRange] = useState({
    start: moment().add(-2, 'day').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [selectedArea, setSelectedArea] = useState('');

  const params = useMemo(() => ({
    start_date: appliedDateRange.start,
    end_date: appliedDateRange.end,
    area: selectedArea || undefined
  }), [appliedDateRange.end, appliedDateRange.start, selectedArea]);

  const { fleets, loading, error } = useGetProduksiPitCircleTimeMonitoring(params);
  const { cabangAreaList } = useGetCabangAreaList(appliedDateRange.start && appliedDateRange.end ? appliedDateRange : null);

  const uniqueAreas = useMemo(() => {
    const seen = new Set();
    return cabangAreaList.filter((item) => {
      if (seen.has(item.area)) return false;
      seen.add(item.area);
      return true;
    }).map((item) => ({ area: item.area }));
  }, [cabangAreaList]);

  const sortedFleets = useMemo(() => {
    return [...fleets].sort((a, b) => {
      const dateA = moment(a.date_ops);
      const dateB = moment(b.date_ops);

      if (dateA.isValid() && dateB.isValid() && !dateA.isSame(dateB)) {
        return dateB.valueOf() - dateA.valueOf();
      }

      if (Number(a.shift_id || 0) !== Number(b.shift_id || 0)) {
        return Number(a.shift_id || 0) - Number(b.shift_id || 0);
      }

      const pitCompare = String(a.startpit_name || '').localeCompare(String(b.startpit_name || ''));
      if (pitCompare !== 0) return pitCompare;

      const excavatorCompare = String(a.excavator_kode || '').localeCompare(String(b.excavator_kode || ''));
      if (excavatorCompare !== 0) return excavatorCompare;

      return String(a.material_name || '').localeCompare(String(b.material_name || ''));
    });
  }, [fleets]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [clock]);

  const handleApplyFilter = () => {
    setAppliedDateRange(dateRange);
  };

  useEffect(() => {
    if (!isSlideshow || !sortedFleets.length) return undefined;

    setRemainingSeconds(10);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setCurrentSlideIndex((current) => (current + 1) % sortedFleets.length);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSlideshow, sortedFleets.length]);

  useEffect(() => {
    if (currentSlideIndex >= sortedFleets.length) {
      setCurrentSlideIndex(0);
    }
  }, [currentSlideIndex, sortedFleets.length]);

  const handleToggleSlideshow = () => {
    setIsSlideshow((prev) => !prev);
    setCurrentSlideIndex(0);
    setRemainingSeconds(10);
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderFleetCard = (fleet) => (
    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'white' }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
          <Typography variant="h4" fontWeight={800}>{moment(fleet.date_ops).format('dddd, DD MMMM YYYY')}</Typography>
        </Stack>

        <Box>
          <Grid container spacing={1}>
            <Grid item xs={12} md={3}>
              <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, height: '100%', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Total Ritase</Typography>
                <Typography fontSize={40} fontWeight={900} lineHeight={0.95}>{fleet.total_ritase}</Typography>
                <Typography fontSize={22} fontWeight={800} lineHeight={1}>{fleet.material_name}</Typography>
                <Typography variant="body2">{fleet.startpit_name}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
              <Box>
                <Grid container spacing={1}>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<TruckFast size={18} />} title="Dumptruck" value={fleet.total_dumptruck} accent="#7c3aed" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<Box1 size={18} />} title="Material" value={fleet.material_name} accent="#0ea5e9" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<Timer1 size={18} />} title="EWH" value={fleet.ewh_hours ? `${fleet.ewh_hours.toFixed(1)} Jam` : '-'} accent="#10b981" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<PresentionChart size={18} />} title="APH" value={fleet.aph_ton_per_hour ? `${fleet.aph_ton_per_hour.toFixed(1)} Ton/Jam` : '-'} accent="#f59e0b" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<Calendar1 size={18} />} title="Jadwal Shift" value={fleet.shift_name} accent="#f59e0b" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<HierarchySquare3 size={18} />} title="Fleet Kerja" value={fleet.excavator_kode} accent="#1d4ed8" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<Timer1 size={18} />} title="Efektif Unit" value={fleet.effective_dumptrucks} accent="#2563eb" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <SummaryChip icon={<Warning2 size={18} />} title="Avg CircleTime" value={`${fleet.avg_circle_time_minutes} Menit`} accent="#dc2626" />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={800}>Performa Dumptruck per Fleet</Typography>
              <Typography variant="caption" color="text.secondary">Bar = ritase, line = avg circle time</Typography>
            </Stack>
            <Box sx={{ height: 280 }}>
              <FleetPerformanceChart dumptrucks={fleet.dumptrucks} averageFleetCircleTime={fleet.avg_circle_time_minutes} />
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );

  const renderFleetSlide = (fleet) => (
    <Stack spacing={1.25} sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Paper
        sx={{
          p: { xs: 1.25, md: 1.75 },
          borderRadius: 3,
          color: 'white',
          background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 72%, #0f766e 130%)',
          boxShadow: 4,
          flexShrink: 0
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
            <Box sx={{ px: 1.5, py: 0.75, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.16)', textAlign: 'center', minWidth: { xs: 82, md: 110 }, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ opacity: 0.72, fontWeight: 800, textTransform: 'uppercase' }}>Ritase</Typography>
              <Typography fontSize={{ xs: 30, md: 42 }} fontWeight={950} lineHeight={0.9}>{fleet.total_ritase}</Typography>
            </Box>
            <Stack spacing={0.35} minWidth={0}>
              <Typography fontSize={{ xs: 24, md: 36 }} fontWeight={950} lineHeight={1} noWrap>
                {fleet.excavator_kode || 'Fleet'}
              </Typography>
              <Typography fontSize={{ xs: 13, md: 17 }} sx={{ opacity: 0.9 }} noWrap>
                {moment(fleet.date_ops).format('DD MMM YYYY')} • {fleet.shift_name || '-'} • {fleet.startpit_name || '-'} • {fleet.material_name || '-'}
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-around"
            alignItems="center"
            flexWrap="nowrap"
            sx={{ width: { xs: '100%', md: 'auto' }, flex: { xs: 'unset', md: 1 }, gap: { xs: 0.75, md: 1 }, minWidth: 0, overflow: 'hidden' }}
          >
            <CompactKpi label="DT" value={fleet.total_dumptruck} />
            <CompactKpi label="Efektif" value={fleet.effective_dumptrucks} />
            <CompactKpi label="EWH" value={fleet.ewh_hours ? `${fleet.ewh_hours.toFixed(1)}j` : '-'} />
            <CompactKpi label="APH" value={fleet.aph_ton_per_hour ? `${fleet.aph_ton_per_hour.toFixed(1)}` : '-'} />
            <CompactKpi label="Avg CT" value={`${fleet.avg_circle_time_minutes}m`} danger />
            {/* <CompactKpi label="Slide" value={`${currentSlideIndex + 1}/${sortedFleets.length}`} />
            <CompactKpi label="Next" value={formatCountdown(remainingSeconds)} /> */}
            <Button size="small" variant="contained" color="inherit" onClick={handleToggleSlideshow} sx={{ color: '#111827', fontWeight: 900, borderRadius: 2, minWidth: { xs: 64, md: 72 }, height: 38, px: 1.25, flexShrink: 0 }}>
              Stop
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 3, flex: 1, minHeight: 0, bgcolor: 'white', boxShadow: 3, overflow: 'hidden' }}>
        <Stack spacing={0.75} sx={{ height: '100%', minHeight: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            <Typography fontSize={{ xs: 16, md: 20 }} fontWeight={900}>Performa Dumptruck per Fleet</Typography>
            <Typography variant="caption" color="text.secondary">Bar = ritase • Line = avg circle time</Typography>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <FleetPerformanceChart dumptrucks={fleet.dumptrucks} averageFleetCircleTime={fleet.avg_circle_time_minutes} />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );

  function CompactKpi({ label, value, danger = false }) {
    return (
      <Box sx={{ 
        px: { xs: 0.75, md: 1 }, 
        py: 0.6, 
        borderRadius: 2, 
        bgcolor: danger ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.16)', 
        flex: '1 1 0', 
        minWidth: 0, 
        maxWidth: { xs: 92, md: 102 }, 
        textAlign: 'center' }}>
        <Typography variant="caption" sx={{ opacity: 0.72, fontWeight: 800, lineHeight: 1 }} noWrap>{label}</Typography>
        <Typography fontSize={{ xs: 13, md: 17 }} fontWeight={950} lineHeight={1.05} noWrap>{value}</Typography>
      </Box>
    );
  }

  return (
    <Stack sx={{ minHeight: '100vh', overflow: 'hidden', bgcolor: isSlideshow ? '#e5e7eb' : 'transparent' }}>
      {!isSlideshow ? (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Stack>
            <Typography variant="h2" fontSize="1.5rem" fontWeight={800}>Produksi Pit & Circle Time Monitoring</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.95rem', color: 'text.secondary' }}>
              <span>{tanggal}</span>
              <span>|</span>
              <span>{clock}</span>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #d4d4d8', background: '#f5f5f5', fontWeight: 600, minWidth: 140 }}
            >
              <option value="">Semua Area</option>
              {uniqueAreas.map((a) => (
                <option key={a.area} value={a.area}>{a.area}</option>
              ))}
            </select>

            <input type="date" value={dateRange.start} onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #d4d4d8', background: '#f5f5f5', fontWeight: 600 }} />
            <span>to</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #d4d4d8', background: '#f5f5f5', fontWeight: 600 }} />
            <button onClick={handleApplyFilter} style={{ padding: '10px 18px', minWidth: 120, borderRadius: '12px', border: 'none', background: '#3862f0', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Apply</button>
            <button
              onClick={handleToggleSlideshow}
              style={{ padding: '10px 18px', minWidth: 100, borderRadius: '12px', border: '1px solid #111827', background: 'white', color: '#111827', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <PresentionChart size={18} variant="Bold" />
              Start
            </button>
          </Stack>
        </Stack>
      ) : null}

      <Paper sx={{ flex: 1, p: isSlideshow ? { xs: 1, md: 1.5 } : 2, overflow: isSlideshow ? 'hidden' : 'auto', backgroundColor: isSlideshow ? '#e5e7eb' : '#f5f5f5', borderRadius: 0 }}>
        {error ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" sx={{ mt: 0 }}>Gagal memuat monitoring produksi pit</Typography>
            <Typography sx={{ mb: 0 }}>Periksa endpoint backend circle time monitoring atau filter tanggal yang digunakan.</Typography>
          </Paper>
        ) : loading ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" sx={{ mt: 0 }}>Memuat data fleet...</Typography>
            <Typography sx={{ mb: 0 }}>Mengambil data ritase pit dan menghitung circle time dumptruck.</Typography>
          </Paper>
        ) : !sortedFleets.length ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" sx={{ mt: 0 }}>Belum ada data fleet</Typography>
            <Typography sx={{ mb: 0 }}>Tidak ditemukan data ritase pit produksi untuk filter tanggal yang dipilih.</Typography>
          </Paper>
        ) : !isSlideshow ? (
          <Box>
            <Grid container spacing={1}>
              {sortedFleets.map((fleet) => (
                <Grid item xs={12} key={fleet.fleet_key}>
                  {renderFleetCard(fleet)}
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Stack spacing={0.75} sx={{ height: { xs: 'calc(100vh - 8px)', md: 'calc(100vh - 12px)' }, minHeight: 0, overflow: 'hidden' }}>
            {sortedFleets[currentSlideIndex] ? renderFleetSlide(sortedFleets[currentSlideIndex]) : null}
            <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ py: 0.25, flexShrink: 0 }}>
              {sortedFleets.map((fleet, idx) => (
                <button
                  key={fleet.fleet_key}
                  onClick={() => { setCurrentSlideIndex(idx); setRemainingSeconds(10); }}
                  style={{
                    width: idx === currentSlideIndex ? 24 : 10,
                    height: 10,
                    borderRadius: 999,
                    border: 'none',
                    margin: 4,
                    background: idx === currentSlideIndex ? '#2563eb' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: '0.2s ease'
                  }}
                  aria-label={`Go to fleet ${fleet.excavator_kode || idx + 1}`}
                />
              ))}
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
