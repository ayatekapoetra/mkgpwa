import PropTypes from 'prop-types';

// THIRD - PARTY
import { IntlProvider } from 'react-intl';

// PROJECT IMPORTS
import { useLocaleConfig } from 'hooks/useConfig';

// load locales files (static import for better performance)
import en from 'utils/locales/en.json';
import fr from 'utils/locales/fr.json';
import ro from 'utils/locales/ro.json';
import zh from 'utils/locales/zh.json';

const localeMap = {
  en,
  fr,
  ro,
  zh
};

// ==============================|| LOCALIZATION ||============================== //

const Locales = ({ children }) => {
  const { i18n } = useLocaleConfig();
  const messages = localeMap[i18n] || en;

  return (
    <IntlProvider locale={i18n} defaultLocale="en" messages={messages}>
      {children}
    </IntlProvider>
  );
};

Locales.propTypes = {
  children: PropTypes.node
};

export default Locales;
