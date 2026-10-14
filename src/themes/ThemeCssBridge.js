'use client';

import { useEffect } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import { useTheme } from '@mui/material/styles';
import { themeCssVariables } from './cssVariables';

export default function ThemeCssBridge() {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme.palette.mode === 'dark');
  }, [theme.palette.mode]);

  // Higher specificity than globals.css :root/.dark, regardless of Emotion order.
  return <GlobalStyles styles={{ 'html:root': themeCssVariables(theme) }} />;
}
