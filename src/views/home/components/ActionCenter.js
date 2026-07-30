'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { alpha, useTheme } from '@mui/material/styles';
import { Warning2, ArrowRight2 } from 'iconsax-react';
import SectionCard from './SectionCard';
import { formatNumber } from '../utils';

function ActionItem({ title, count, severity = 'warning', href, description }) {
  const theme = useTheme();
  const color = severity === 'error' ? 'error' : severity === 'info' ? 'info' : 'warning';
  const palette = theme.palette[color];

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(palette.main, 0.25),
        bgcolor: alpha(palette.main, 0.04),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.25,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(palette.main, 0.14),
            color: palette.main,
            flexShrink: 0
          }}
        >
          <Warning2 size={18} variant="Bold" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {description}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
        <Chip size="small" color={color} label={formatNumber(count)} sx={{ fontWeight: 800 }} />
        {href ? (
          <Button component={Link} href={href} size="small" endIcon={<ArrowRight2 size={14} />}>
            Buka
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function ActionCenter({ items = [], loading }) {
  const actionable = items.filter((i) => Number(i.count) > 0);

  return (
    <SectionCard
      title="Action Center"
      subtitle="Yang perlu ditindaklanjuti hari ini"
      icon={<Warning2 size={20} variant="Bold" />}
      color="warning"
      loading={loading}
      minHeight={280}
    >
      {actionable.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            Tidak ada antrean kritis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Semua indikator dalam kondisi normal untuk filter aktif.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.25}>
          {actionable.map((item) => (
            <ActionItem key={item.id} {...item} />
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}
