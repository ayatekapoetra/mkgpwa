'use client';

import { useMediaQuery, useTheme } from '@mui/material';

import PengajuanDanaListDesktop from './list-desktop';
import PengajuanDanaListMobile from './list-mobile';

export default function PengajuanDanaList({
  rows = [],
  selectionMode = false,
  selectedIds = new Set(),
  onSelect = () => {}
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const props = { rows, selectionMode, selectedIds, onSelect };

  if (isMobile) {
    return <PengajuanDanaListMobile {...props} />;
  }

  return <PengajuanDanaListDesktop {...props} />;
}
