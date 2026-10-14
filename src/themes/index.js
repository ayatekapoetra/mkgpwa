import PropTypes from 'prop-types';
import { useMemo } from 'react';

// MATERIAL - UI
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

// PROJECT IMPORTS
import Palette from './palette';
import Typography from './typography';
import CustomShadows from './shadows';
import componentsOverride from './overrides';
import { NextAppDirEmotionCacheProvider } from './emotionCache';
import ThemeCssBridge from './ThemeCssBridge';

import { HEADER_HEIGHT } from 'config';
import { useLayoutConfig, useThemeConfig } from 'hooks/useConfig';
import { ThemeDirection, ThemeMode } from 'config';

// ==============================|| DEFAULT THEME - MAIN  ||============================== //

export default function ThemeCustomization({ children }) {
  const { themeDirection } = useLayoutConfig();
  const { mode, presetColor, fontFamily, themeContrast } = useThemeConfig();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const themeMode = mode === ThemeMode.AUTO ? (prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT) : mode;

  const theme = useMemo(() => Palette(themeMode, presetColor, themeContrast), [themeMode, presetColor, themeContrast]);

  const themeTypography = useMemo(
    () => Typography(themeMode, fontFamily, theme),
    [themeMode, fontFamily, theme]
  );
  const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440
        }
      },
      direction: themeDirection,
      mixins: {
        toolbar: {
          minHeight: HEADER_HEIGHT,
          paddingTop: 8,
          paddingBottom: 8
        }
      },
      palette: theme.palette,
      shape: {
        borderRadius: 8
      },
      customShadows: themeCustomShadows,
      typography: themeTypography
    }),
    [themeDirection, theme, themeTypography, themeCustomShadows]
  );

  const themes = useMemo(() => {
    const createdTheme = createTheme(themeOptions);
    createdTheme.components = componentsOverride(createdTheme);
    return createdTheme;
  }, [themeOptions]);

  return (
    <NextAppDirEmotionCacheProvider
      key={themeDirection}
      options={{
        key: themeDirection === ThemeDirection.RTL ? 'mui-rtl' : 'mui',
        prepend: true,
        ...(themeDirection === ThemeDirection.RTL && { stylisPlugins: [prefixer, rtlPlugin] })
      }}
    >
      <ThemeProvider theme={themes}>
        <CssBaseline enableColorScheme />
        <ThemeCssBridge />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}

ThemeCustomization.propTypes = {
  children: PropTypes.node
};
