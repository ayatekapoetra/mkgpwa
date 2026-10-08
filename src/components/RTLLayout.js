import PropTypes from 'prop-types';
import { useEffect } from 'react';

// PROJECT IMPORTS
import { useLayoutConfig } from 'hooks/useConfig';

// ==============================|| RTL LAYOUT ||============================== //

const RTLLayout = ({ children }) => {
  const { themeDirection } = useLayoutConfig();

  useEffect(() => {
    document.dir = themeDirection;
  }, [themeDirection]);

  // Emotion styles must use ThemeCustomization's per-render SSR cache.
  return <>{children}</>;
};

RTLLayout.propTypes = {
  children: PropTypes.node
};

export default RTLLayout;
