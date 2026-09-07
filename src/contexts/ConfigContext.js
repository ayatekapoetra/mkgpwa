import PropTypes from 'prop-types';
import { createContext, useCallback, useMemo } from 'react';

// PROJECT IMPORTS
import config from 'config';
import useLocalStorage from 'hooks/useLocalStorage';

// initial state
const initialState = {
  ...config,
  onChangeContainer: () => {},
  onChangeLocalization: () => {},
  onChangeMode: () => {},
  onChangePresetColor: () => {},
  onChangeDirection: () => {},
  onChangeMiniDrawer: () => {},
  onChangeMenuOrientation: () => {},
  onChangeMenuCaption: () => {},
  onChangeFontFamily: () => {},
  onChangeContrast: () => {}
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ThemeConfigContext = createContext(initialState);
const LayoutConfigContext = createContext(initialState);
const LocaleConfigContext = createContext(initialState);

function ConfigProvider({ children }) {
  const [config, setConfig] = useLocalStorage('able-pro-material-next-ts-config', initialState);

  const onChangeContainer = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      container: !currentConfig.container
    }));
  }, [setConfig]);

  const onChangeLocalization = useCallback((lang) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      i18n: lang
    }));
  }, [setConfig]);

  const onChangeMode = useCallback((mode) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      mode
    }));
  }, [setConfig]);

  const onChangePresetColor = useCallback((theme) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      presetColor: theme
    }));
  }, [setConfig]);

  const onChangeDirection = useCallback((direction) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      themeDirection: direction
    }));
  }, [setConfig]);

  const onChangeMiniDrawer = useCallback((miniDrawer) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      miniDrawer
    }));
  }, [setConfig]);

  const onChangeContrast = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      themeContrast: !currentConfig.themeContrast
    }));
  }, [setConfig]);

  const onChangeMenuCaption = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      menuCaption: !currentConfig.menuCaption
    }));
  }, [setConfig]);

  const onChangeMenuOrientation = useCallback((layout) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      menuOrientation: layout
    }));
  }, [setConfig]);

  const onChangeFontFamily = useCallback((fontFamily) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      fontFamily
    }));
  }, [setConfig]);

  const themeConfigValue = useMemo(
    () => ({
      mode: config.mode,
      presetColor: config.presetColor,
      fontFamily: config.fontFamily,
      themeContrast: config.themeContrast,
      onChangeMode,
      onChangePresetColor,
      onChangeFontFamily,
      onChangeContrast
    }),
    [config.mode, config.presetColor, config.fontFamily, config.themeContrast, onChangeMode, onChangePresetColor, onChangeFontFamily, onChangeContrast]
  );

  const layoutConfigValue = useMemo(
    () => ({
      container: config.container,
      themeDirection: config.themeDirection,
      miniDrawer: config.miniDrawer,
      menuOrientation: config.menuOrientation,
      menuCaption: config.menuCaption,
      onChangeContainer,
      onChangeDirection,
      onChangeMiniDrawer,
      onChangeMenuOrientation,
      onChangeMenuCaption
    }),
    [
      config.container,
      config.themeDirection,
      config.miniDrawer,
      config.menuOrientation,
      config.menuCaption,
      onChangeContainer,
      onChangeDirection,
      onChangeMiniDrawer,
      onChangeMenuOrientation,
      onChangeMenuCaption
    ]
  );

  const localeConfigValue = useMemo(
    () => ({ i18n: config.i18n, onChangeLocalization }),
    [config.i18n, onChangeLocalization]
  );

  return (
    <ThemeConfigContext.Provider value={themeConfigValue}>
      <LayoutConfigContext.Provider value={layoutConfigValue}>
        <LocaleConfigContext.Provider value={localeConfigValue}>{children}</LocaleConfigContext.Provider>
      </LayoutConfigContext.Provider>
    </ThemeConfigContext.Provider>
  );
}

ConfigProvider.propTypes = {
  children: PropTypes.node
};

export { ConfigProvider, ThemeConfigContext, LayoutConfigContext, LocaleConfigContext };
