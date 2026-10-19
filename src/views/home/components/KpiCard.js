'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';

export default function KpiCard({
  icon,
  label,
  value,
  helper,
  color = 'primary',
  loading = false,
  error = null,
  trend,
  href
}) {
  const theme = useTheme();
  const palette = theme.palette[color] || theme.palette.primary;

  const paperSx = {
    p: 2.5,
    height: '100%',
    borderRadius: 2.5,
    borderColor: theme.palette.divider,
    bgcolor: 'background.paper',
    transition: 'transform .2s ease, box-shadow .2s ease',
    cursor: href ? 'pointer' : 'default',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    '&:hover': href
      ? {
          transform: 'translateY(-2px)',
          boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.08)}`
        }
      : undefined
  };

  const body = (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.75,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(palette.main, 0.08),
            color: palette.main,
            flexShrink: 0
          }}
        >
          {icon}
        </Box>
      </Stack>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {loading ? (
          <Skeleton width={72} height={34} />
        ) : (
          <Typography variant="h3" fontWeight={700} lineHeight={1.15} sx={{ fontSize: { xs: 28, xl: 32 }, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {error ? '—' : value}
          </Typography>
        )}
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
          {helper || error ? (
            <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'} role={error ? 'alert' : undefined}>
              {error ? 'Data tidak tersedia' : helper}
            </Typography>
          ) : null}
          {trend ? (
            <Chip
              size="small"
              color={trend.positive ? 'success' : trend.neutral ? 'default' : 'error'}
              variant="light"
              label={trend.label}
              sx={{ height: 20, fontWeight: 700 }}
            />
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );

  if (href) {
    return (
      <Paper variant="outlined" sx={paperSx} component={Link} href={href}>
        {body}
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={paperSx}>
      {body}
    </Paper>
  );
}
