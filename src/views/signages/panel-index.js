'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Setting2,
  Timer1,
  Profile2User,
  TruckFast,
  Hierarchy3,
  ShoppingCart,
  Box1,
  Clock,
  ClipboardText,
  PresentionChart,
  ArrowRight2,
  MonitorMobbile
} from 'iconsax-react';

const PANELS = [
  {
    slug: 'site-monitoring',
    href: '/panel/site-monitoring',
    title: 'Site Monitoring',
    description: 'Monitoring terpadu produksi, equipment, spare part, dan manpower per site.',
    category: 'Operation',
    color: 'info',
    icon: PresentionChart
  },
  {
    slug: 'produksi',
    href: '/panel/produksi',
    title: 'Produksi',
    description: 'Ringkasan panel produksi dan indikator ritase operasional.',
    category: 'Produksi',
    color: 'primary',
    icon: TruckFast
  },
  {
    slug: 'produksi-pit-cycle-time-monitoring',
    href: '/panel/produksi-pit-cycle-time-monitoring',
    title: 'PIT Cycle Time',
    description: 'Monitoring cycle time fleet, ritase, dan performa area PIT.',
    category: 'Produksi',
    color: 'info',
    icon: Hierarchy3
  },
  {
    slug: 'breakdown',
    href: '/panel/breakdown',
    title: 'Breakdown Analytics',
    description: 'Dashboard breakdown equipment, trend downtime, dan status perbaikan.',
    category: 'Maintenance',
    color: 'error',
    icon: Setting2
  },
  {
    slug: 'breakdown-today',
    href: '/panel/breakdown-today',
    title: 'Breakdown Today',
    description: 'Active duration stack breakdown hari ini (HE & DT).',
    category: 'Maintenance',
    color: 'warning',
    icon: Timer1
  },
  {
    slug: 'sparepart-used',
    href: '/panel/sparepart-used',
    title: 'Sparepart Used',
    description: 'Pemakaian sparepart by value, frekuensi, gudang, dan kategori.',
    category: 'Maintenance',
    color: 'secondary',
    icon: Box1
  },
  {
    slug: 'work-order',
    href: '/panel/work-order',
    title: 'Work Order',
    description: 'Panel monitoring work order maintenance.',
    category: 'Maintenance',
    color: 'warning',
    icon: ClipboardText
  },
  {
    slug: 'kehadiran-karyawan',
    href: '/panel/kehadiran-karyawan',
    title: 'Kehadiran Karyawan',
    description: 'Analitik absensi, telat, alpha, dan sebaran per cabang.',
    category: 'Human Capital',
    color: 'success',
    icon: Profile2User
  },
  {
    slug: 'timesheet',
    href: '/panel/timesheet',
    title: 'Timesheet',
    description: 'Analitik timesheet operasional dan utilisasi jam kerja.',
    category: 'Operation',
    color: 'info',
    icon: Clock
  },
  {
    slug: 'purchasing-request',
    href: '/panel/purchasing-request',
    title: 'Purchasing Request',
    description: 'Monitoring PR, approval rate, spending, dan aging dokumen.',
    category: 'SCM',
    color: 'primary',
    icon: ShoppingCart
  }
];

function PanelCard({ item }) {
  const theme = useTheme();
  const palette = theme.palette[item.color] || theme.palette.primary;
  const Icon = item.icon;

  return (
    <Paper
      component={Link}
      href={item.href}
      variant="outlined"
      sx={{
        p: 2.25,
        height: '100%',
        borderRadius: 2.5,
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        borderColor: alpha(palette.main, 0.22),
        background: `linear-gradient(145deg, ${alpha(palette.main, 0.12)} 0%, ${theme.palette.background.paper} 58%)`,
        transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(palette.main, 0.45),
          boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.08)}`
        }
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(palette.main, 0.16),
            color: palette.main,
            flexShrink: 0
          }}
        >
          <Icon size={24} variant="Bold" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h5" fontWeight={800} noWrap>
              {item.title}
            </Typography>
            <Chip size="small" color={item.color} variant="light" label={item.category} sx={{ height: 22 }} />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
            {item.href}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2 }}>
        {item.description}
      </Typography>

      <Stack direction="row" justifyContent="flex-end">
        <Button size="small" color={item.color} endIcon={<ArrowRight2 size={14} />}>
          Buka Panel
        </Button>
      </Stack>
    </Paper>
  );
}

export default function SignagePanelIndex() {
  const theme = useTheme();
  const categories = [...new Set(PANELS.map((p) => p.category))];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        px: { xs: 2, md: 3 },
        py: { xs: 2.5, md: 3.5 },
        background: `radial-gradient(1200px 500px at 10% -10%, ${alpha(theme.palette.primary.main, 0.14)}, transparent 60%),
          radial-gradient(900px 400px at 100% 0%, ${alpha(theme.palette.info.main, 0.1)}, transparent 55%),
          ${theme.palette.background.default}`
      }}
    >
      <Stack spacing={2.75} sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 2.75 },
            borderRadius: 2.5,
            borderColor: alpha(theme.palette.primary.main, 0.2),
            background: `linear-gradient(125deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${theme.palette.background.paper} 70%)`
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                  color: 'primary.main'
                }}
              >
                <MonitorMobbile size={28} variant="Bold" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={800}>
                  Signage Board Directory
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pilih panel monitoring untuk ditampilkan di layar operasional
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip size="small" color="primary" variant="light" label={`${PANELS.length} panel aktif`} />
                  {categories.map((c) => (
                    <Chip key={c} size="small" variant="outlined" label={c} />
                  ))}
                </Stack>
              </Box>
            </Stack>

            <Button component={Link} href="/home" variant="outlined" startIcon={<PresentionChart size={16} />}>
              Kembali ke Home
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            width: '100%',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: 'repeat(3, minmax(0, 1fr))'
            }
          }}
        >
          {PANELS.map((item) => (
            <Box key={item.slug} sx={{ minWidth: 0 }}>
              <PanelCard item={item} />
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
