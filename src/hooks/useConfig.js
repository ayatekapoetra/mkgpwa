import { useContext } from 'react';
import { LayoutConfigContext, LocaleConfigContext, ThemeConfigContext } from 'contexts/ConfigContext';

// ==============================|| HOOKS - CONFIG  ||============================== //

export const useThemeConfig = () => useContext(ThemeConfigContext);
export const useLayoutConfig = () => useContext(LayoutConfigContext);
export const useLocaleConfig = () => useContext(LocaleConfigContext);
