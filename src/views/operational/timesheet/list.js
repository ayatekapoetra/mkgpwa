'use client';

import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

import ListTimesheetDesktop from './list-desktop';
import ListTimesheetMobile from './list-mobile';

export default function ListTimesheet({ data, queueStatus = {}, setParams }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return <ListTimesheetMobile data={data} queueStatus={queueStatus} setParams={setParams} />;
  }

  return <ListTimesheetDesktop data={data} queueStatus={queueStatus} setParams={setParams} />;
}
