import PropTypes from 'prop-types';
import { useEffect } from 'react';

// MATERIAL - UI
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// THIRD - PARTY
import rtlPlugin from 'stylis-plugin-rtl';

// PROJECT IMPORTS
import { useLayoutConfig } from 'hooks/useConfig';
import { ThemeDirection } from 'config';

const ltrCache = createCache({
  key: 'css',
  prepend: true
});

const rtlCache = createCache({
  key: 'rtl',
  prepend: true,
  stylisPlugins: [rtlPlugin]
});

// ==============================|| RTL LAYOUT ||============================== //

const RTLLayout = ({ children }) => {
  const { themeDirection } = useLayoutConfig();

  useEffect(() => {
    document.dir = themeDirection;
  }, [themeDirection]);

  const cache = themeDirection === ThemeDirection.RTL ? rtlCache : ltrCache;

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};

RTLLayout.propTypes = {
  children: PropTypes.node
};

export default RTLLayout;
