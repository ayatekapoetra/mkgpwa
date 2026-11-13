'use client';

import { Fragment, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowDown2,
  ArrowUp2,
  Edit,
  Box1,
  Calendar,
  Chart21,
  GasStation,
  Hierarchy,
  Refresh,
  Routing2,
  Timer1,
  TruckFast,
  Weight
} from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import { useGetRekapDetail } from 'api/ritase-rekap';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const formatNum = (v, digits = 2) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatInt = (v) => Number(v || 0).toLocaleString('id-ID');

const formatTime = (v) => {
  if (!v) return '-';
  const t = String(v);
  const clock = t.includes(' ') ? t.split(' ')[1] : t;
  return clock ? clock.slice(0, 5) : '-';
};

const statusColor = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'OPEN') return 'success';
  if (s === 'CLOSED') return 'default';
  return 'warning';
};

function KpiCard({ icon, label, value, caption, color = 'primary.main' }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Paper>
  );
}

export default function RekapRitaseDetailView() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(() => new Set());

  const query = useMemo(
    () => ({
      date_ops: searchParams?.get('date_ops') || '',
      shift_id: searchParams?.get('shift_id') || '',
      bisnis_id: searchParams?.get('bisnis_id') || '',
      penyewa_id: searchParams?.get('penyewa_id') || '',
      fleet_name: searchParams?.get('fleet_name') || '',
      excavator_id: searchParams?.get('excavator_id') || '',
      startpit_id: searchParams?.get('startpit_id') || '',
      material_id: searchParams?.get('material_id') || ''
    }),
    [searchParams]
  );

  const { header, items, hourly, doms, loading, error, diagnostic, refresh } = useGetRekapDetail(
    query,
    Boolean(query.date_ops && query.shift_id && query.excavator_id && query.startpit_id && query.material_id)
  );

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Rekap Ritase', to: '/rekap-ritase' },
    { title: 'Detail' }
  ];

  const toggleRow = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chartBase = useMemo(
    () => ({
      axisLabel: { style: { colors: theme.palette.text.secondary, fontSize: '11px' } },
      baseChart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: theme.typography.fontFamily,
        foreColor: theme.palette.text.secondary
      }
    }),
    [theme]
  );

  // Grafik 1: ritase per jam. Jam kosong diisi 0 agar sumbu-X kontinu.
  const hourlyChart = useMemo(() => {
    const { axisLabel, baseChart } = chartBase;
    const list = Array.isArray(hourly) ? hourly : [];
    if (!list.length) return null;

    const minHour = Math.min(...list.map((h) => h.hour));
    const maxHour = Math.max(...list.map((h) => h.hour));
    const byHour = new Map(list.map((h) => [h.hour, h]));

    const categories = [];
    const ritase = [];
    const tonase = [];
    for (let h = minHour; h <= maxHour; h += 1) {
      const row = byHour.get(h);
      categories.push(`${String(h).padStart(2, '0')}:00`);
      ritase.push(row ? row.ritase : 0);
      tonase.push(row ? Number(row.total_ton) : 0);
    }

    return {
      series: [
        { name: 'Ritase', type: 'column', data: ritase },
        { name: 'Tonase', type: 'line', data: tonase }
      ],
      options: {
        chart: { ...baseChart, type: 'line', height: 300, stacked: false },
        colors: [theme.palette.primary.main, theme.palette.success.main],
        stroke: { width: [0, 3], curve: 'smooth' },
        plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
        dataLabels: { enabled: false },
        markers: { size: 3 },
        xaxis: { categories, labels: axisLabel, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: [
          {
            title: { text: 'Ritase', style: { color: theme.palette.text.secondary, fontSize: '11px' } },
            labels: { ...axisLabel, formatter: (v) => formatInt(v) }
          },
          {
            opposite: true,
            title: { text: 'Tonase', style: { color: theme.palette.text.secondary, fontSize: '11px' } },
            labels: { ...axisLabel, formatter: (v) => formatInt(v) }
          }
        ],
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        legend: { position: 'top', horizontalAlign: 'right' },
        tooltip: { theme: theme.palette.mode }
      }
    };
  }, [hourly, theme, chartBase]);

  // Grafik 2: distribusi ritase per DOM.
  const domChart = useMemo(() => {
    const { baseChart } = chartBase;
    const list = Array.isArray(doms) ? doms : [];
    if (!list.length) return null;
    return {
      series: list.map((d) => d.dom_kode),
      options: {
        chart: { ...baseChart, type: 'donut', height: 300 },
        labels: list.map((d) => d.dom_kode),
        legend: { position: 'bottom', fontSize: '11px' },
        dataLabels: { enabled: true, formatter: (v) => `${Math.round(v)}%` },
        plotOptions: { pie: { donut: { size: '62%' } } },
        stroke: { width: 1, colors: [theme.palette.background.paper] },
        tooltip: { theme: theme.palette.mode }
      }
    };
  }, [doms, theme, chartBase]);

  // Grafik 3: ranking ritase per DT.
  const dtChart = useMemo(() => {
    const { axisLabel, baseChart } = chartBase;
    const list = [...(items || [])].sort((a, b) => b.total_ritase - a.total_ritase);
    if (!list.length) return null;
    return {
      series: [{ name: 'Ritase', data: list.map((d) => d.total_ritase) }],
      options: {
        chart: { ...baseChart, type: 'bar', height: Math.max(220, list.length * 34) },
        colors: [theme.palette.info.main],
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '62%' } },
        dataLabels: { enabled: true, style: { fontSize: '11px' } },
        xaxis: { categories: list.map((d) => d.dumptruck_kode || `DT #${d.dumptruck_id}`), labels: axisLabel },
        yaxis: { labels: { ...axisLabel, style: { ...axisLabel.style, fontSize: '12px' } } },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        tooltip: { theme: theme.palette.mode }
      }
    };
  }, [items, theme, chartBase]);

  const allocTotal = useMemo(
    () => (items || []).reduce((sum, it) => sum + (it.allocations || []).length, 0),
    [items]
  );

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Rekap Ritase" links={breadcrumbLinks} />

      <MainCard
        title={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <BtnBack href="/rekap-ritase" />
          </Stack>
        }
        secondary={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="warning"
              size="small"
              startIcon={<Edit />}
              onClick={() => router.push(`/rekap-ritase/edit?${searchParams.toString()}`)}
              disabled={loading || !header}
            >
              Ubah Data
            </Button>
            <Button variant="outlined" color="secondary" size="small" startIcon={<Refresh />} onClick={refresh} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat rincian: {error?.response?.data?.diagnostic?.message || error?.message || 'kesalahan tidak diketahui'}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1.5 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Memuat rincian rekap ritase...
            </Typography>
          </Box>
        ) : !header ? (
          <Alert severity="info">Data rincian tidak tersedia untuk kombinasi filter ini.</Alert>
        ) : (
          <Stack spacing={2.5}>
            {/* ---- KPI ---- */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}>
                <KpiCard
                  icon={<TruckFast size={18} variant="Bold" />}
                  label="Total Ritase"
                  value={formatInt(header.total_ritase)}
                  caption={`${header.total_dumptruck} DT aktif`}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KpiCard
                  icon={<Weight size={18} variant="Bold" />}
                  label="Tonase"
                  value={formatNum(header.total_ton)}
                  caption="Ton"
                  color="success.main"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KpiCard
                  icon={<Box1 size={18} variant="Bold" />}
                  label="BCM"
                  value={formatNum(header.total_bcm)}
                  caption="Bank Cubic Meter"
                  color="warning.main"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KpiCard
                  icon={<Timer1 size={18} variant="Bold" />}
                  label="Avg Cycle Time"
                  value={header.avg_cycle_time != null ? `${formatNum(header.avg_cycle_time, 1)} m` : '-'}
                  caption="menit per rit"
                  color="info.main"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KpiCard
                  icon={<Routing2 size={18} variant="Bold" />}
                  label="Rit / DT"
                  value={formatNum(header.avg_rit_per_dt, 1)}
                  caption={`${formatNum(header.avg_ton_per_rit, 1)} ton / rit`}
                  color="secondary.main"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KpiCard
                  icon={<Hierarchy size={18} variant="Bold" />}
                  label="DOM"
                  value={formatInt(header.total_dom)}
                  caption={`${header.dom_open} open • ${header.dom_closed} closed`}
                  color="error.main"
                />
              </Grid>
            </Grid>

            {/* ---- Scope ---- */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Calendar size={16} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Lingkup Data
                </Typography>
              </Stack>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="caption" color="text.secondary">Unit Bisnis / IUP</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {header.bisnis_initial || header.bisnis_id || '-'} / {header.penyewa_abbr || header.penyewa_id || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="caption" color="text.secondary">Fleet / Loader</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {header.fleet_name || '-'} ({header.excavator_kode || header.excavator_id || '-'})
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="caption" color="text.secondary">PIT Asal</Typography>
                  <Typography variant="body2" fontWeight={600}>{header.startpit_nama || header.startpit_id || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="caption" color="text.secondary">Material</Typography>
                  <Typography variant="body2" fontWeight={600}>{header.material_nama || header.material_id || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="caption" color="text.secondary">Shift</Typography>
                  <Typography variant="body2" fontWeight={600}>{header.shift_nama || `Shift ${header.shift_id}`}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="caption" color="text.secondary">Alokasi DOM</Typography>
                  <Typography variant="body2" fontWeight={600}>{allocTotal} baris</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* ---- Charts ---- */}
            <Grid container spacing={2}>
              <Grid item xs={12} lg={7}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chart21 size={16} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Produktivitas per Jam
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (ritase & tonase)
                    </Typography>
                  </Stack>
                  {hourlyChart ? (
                    <ReactApexChart type="line" height={300} series={hourlyChart.series} options={hourlyChart.options} />
                  ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data waktu ritase.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} lg={5}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <GasStation size={16} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Porsi Ritase per DOM
                    </Typography>
                  </Stack>
                  {domChart ? (
                    <ReactApexChart type="donut" height={300} series={domChart.series} options={domChart.options} />
                  ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada alokasi DOM.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <TruckFast size={16} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Ranking Ritase per Dumptruck
                    </Typography>
                  </Stack>
                  {dtChart ? (
                    <ReactApexChart type="bar" height={dtChart.options.chart.height} series={dtChart.series} options={dtChart.options} />
                  ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data dumptruck.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* ---- DOM target vs realisasi ---- */}
            {doms.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Hierarchy size={16} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Target vs Realisasi DOM
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  {doms.map((d) => {
                    const target = Number(d.target_ret || 0);
                    const current = Number(d.current_ret || 0);
                    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={d.dom_kode}>
                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={700} noWrap title={d.dom_kode}>
                              {d.dom_kode}
                            </Typography>
                            <Chip size="small" variant="outlined" color={statusColor(d.status)} label={d.status || '-'} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {d.stockpile_nama || 'Stockpile belum ditentukan'}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatInt(current)} / {formatInt(target)} rit
                            </Typography>
                            <Typography variant="caption" fontWeight={700}>
                              {pct}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 6, borderRadius: 3 }}
                            color={pct >= 100 ? 'success' : pct >= 60 ? 'primary' : 'warning'}
                          />
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            )}

            {/* ---- Tabel DT ---- */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <TruckFast size={16} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Daftar Dump Truck & Alokasi DOM
                </Typography>
                <Chip size="small" label={`${items.length} DT`} />
              </Stack>

              {items.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada rincian baris.
                  </Typography>
                  {diagnostic?.params && (
                    <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 1 }}>
                      Filter: {JSON.stringify(diagnostic.params)}
                    </Typography>
                  )}
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 620 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 40 }} />
                        <TableCell sx={{ fontWeight: 700 }}>Hauler (DT)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>KDSM</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Jarak</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>TF (T/BCM)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Cycle</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Rit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Tonase</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>BCM</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Alokasi DOM</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((row) => {
                        const isOpen = expanded.has(row.dumptruck_id);
                        return (
                          <Fragment key={row.dumptruck_id}>
                            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                              <TableCell>
                                <IconButton size="small" onClick={() => toggleRow(row.dumptruck_id)}>
                                  {isOpen ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {row.dumptruck_kode || `DT #${row.dumptruck_id}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Tiretype: {row.tiretype || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>{row.kdsm || '-'}</TableCell>
                              <TableCell align="right">{row.distance_km != null ? `${row.distance_km} km` : '-'}</TableCell>
                              <TableCell align="center">
                                {row.tf_ton || 0} / {row.tf_bcm || 0}
                              </TableCell>
                              <TableCell align="right">
                                {row.avg_cycle_time != null ? `${formatNum(row.avg_cycle_time, 1)} m` : '-'}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                  {row.total_ritase}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{formatNum(row.total_ton)}</TableCell>
                              <TableCell align="right">{formatNum(row.total_bcm)}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                  {(row.allocations || []).slice(0, isOpen ? undefined : 2).map((alloc, aidx) => (
                                    <Tooltip
                                      key={aidx}
                                      title={
                                        alloc.dom_status
                                          ? `Status ${alloc.dom_status} • ${alloc.dom_current_ret ?? '-'} / ${alloc.dom_target_ret ?? '-'} rit`
                                          : alloc.stockpile_nama || ''
                                      }
                                    >
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        color={statusColor(alloc.dom_status)}
                                        label={`${alloc.dom_id || 'DOM'}: ${alloc.ritase} rit`}
                                      />
                                    </Tooltip>
                                  ))}
                                  {!isOpen && (row.allocations || []).length > 2 && (
                                    <Chip size="small" label={`+${row.allocations.length - 2}`} onClick={() => toggleRow(row.dumptruck_id)} />
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={10} sx={{ py: 0, borderBottom: isOpen ? undefined : 'unset' }}>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                  <Box sx={{ py: 1.5, pl: 6, pr: 2 }}>
                                    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Rit pertama: <strong>{formatTime(row.first_rit)}</strong>
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Rit terakhir: <strong>{formatTime(row.last_rit)}</strong>
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Cycle min/max: <strong>{row.min_cycle_time ?? '-'}</strong> / <strong>{row.max_cycle_time ?? '-'}</strong> menit
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Sumber: <strong>{row.input_source || '-'}</strong>
                                      </Typography>
                                    </Stack>
                                    <Divider sx={{ mb: 1 }} />
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 700 }}>DOM</TableCell>
                                          <TableCell sx={{ fontWeight: 700 }}>Stockpile</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700 }}>Target</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700 }}>Realisasi DOM</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700 }}>Rit di grup ini</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {(row.allocations || []).map((alloc, aidx) => (
                                          <TableRow key={aidx}>
                                            <TableCell>{alloc.dom_id || '-'}</TableCell>
                                            <TableCell>{alloc.stockpile_nama || '-'}</TableCell>
                                            <TableCell align="center">
                                              {alloc.dom_status ? (
                                                <Chip size="small" variant="outlined" color={statusColor(alloc.dom_status)} label={alloc.dom_status} />
                                              ) : (
                                                '-'
                                              )}
                                            </TableCell>
                                            <TableCell align="right">{alloc.dom_target_ret != null ? formatInt(alloc.dom_target_ret) : '-'}</TableCell>
                                            <TableCell align="right">{alloc.dom_current_ret != null ? formatInt(alloc.dom_current_ret) : '-'}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                              {alloc.ritase}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell colSpan={6} sx={{ fontWeight: 700 }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatInt(header.total_ritase)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatNum(header.total_ton)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatNum(header.total_bcm)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}
