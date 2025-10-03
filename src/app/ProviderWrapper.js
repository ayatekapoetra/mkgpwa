'use client';

import PropTypes from 'prop-types';

// NEXT
import { SessionProvider } from 'next-auth/react';

// REACT QUERY
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// PROJECT IMPORT
import ThemeCustomization from 'themes';
import { ConfigProvider } from 'contexts/ConfigContext';
import RTLLayout from 'components/RTLLayout';
import Locales from 'components/Locales';
import ScrollTop from 'components/ScrollTop';

import Notistack from 'components/third-party/Notistack';
import Snackbar from 'components/@extended/Snackbar';
import Customization from 'components/customization/index';
import AlertNotification from 'components/@extended/AlertNotification';

// Buat client React Query
const queryClient = new QueryClient();

const ProviderWrapper = ({ children }) => {
  console.log('ProviderWrapper rendering');
  
  return (
    <ConfigProvider>
      <ThemeCustomization>
        <RTLLayout>
          <Locales>
            <ScrollTop>
              <QueryClientProvider client={queryClient}>
                <SessionProvider refetchInterval={0}>
                  <Notistack>
                    <Snackbar />
                    <AlertNotification />
                    {children}
                    <Customization />
                  </Notistack>
                </SessionProvider>
              </QueryClientProvider>
            </ScrollTop>
          </Locales>
        </RTLLayout>
      </ThemeCustomization>
    </ConfigProvider>
  );
};

ProviderWrapper.propTypes = {
  children: PropTypes.node
};

export default ProviderWrapper;
