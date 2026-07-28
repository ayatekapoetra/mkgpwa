'use client';

import { useMediaQuery, useTheme } from '@mui/material';

import PengajuanDanaListDesktop from './list-desktop';
import PengajuanDanaListMobile from './list-mobile';

export default function PengajuanDanaList({ rows }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return <PengajuanDanaListMobile rows={rows} />;
  }

  return <PengajuanDanaListDesktop rows={rows} />;
}
