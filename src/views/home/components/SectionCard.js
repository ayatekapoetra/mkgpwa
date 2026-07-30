'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { alpha, useTheme } from '@mui/material/styles';

export default function SectionCard({
  title,
  subtitle,
  icon,
  loading = false,
  actionHref,
  actionLabel = 'Detail',
  children,
  minHeight = 320,
  color = 'primary'
}) {
  const theme = useTheme();
  const palette = theme.palette[color] || theme.palette.primary;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        height: '100%',
        minHeight,
        width: '100%',
        m: 0,
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          px: 2.25,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          bgcolor: alpha(palette.main, 0.045),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(palette.main, 0.12),
              color: palette.main,
              flexShrink: 0
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {loading ? <CircularProgress size={18} /> : null}
          {actionHref ? (
            <Button component={Link} href={actionHref} size="small" variant="text">
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </Box>
      <Box sx={{ p: { xs: 1.75, md: 2.25 } }}>{children}</Box>
    </Paper>
  );
}
