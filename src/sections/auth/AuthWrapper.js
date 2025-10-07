'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSession } from 'next-auth/react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

// PROJECT IMPORTS
import AuthCard from './AuthCard';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';

// ASSETS
import AuthBackground from '../../../public/assets/images/auth/AuthBackground';

// ==============================|| AUTHENTICATION - WRAPPER ||============================== //

const AuthWrapper = ({ children }) => {
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState('loading'); // loading, authenticated, error
  const [error, setError] = useState(null);

  // Handle authentication state changes
  useEffect(() => {
    if (status === 'loading') {
      setAuthState('loading');
      return;
    }

    if (status === 'authenticated') {
      // User is authenticated, go directly to app
      setAuthState('authenticated');
    } else {
      // User is not authenticated, show login form
      setAuthState('unauthenticated');
    }
  }, [status, session]);

  const handleRetry = () => {
    setError(null);
    setAuthState('authenticated');
  };

  const handleBackToLogin = () => {
    setAuthState('unauthenticated');
    setError(null);
  };

  // Render different states
  const renderContent = () => {
    switch (authState) {
      case 'loading':
        return (
          <LoadingScreen
            message="Memeriksa autentikasi..."
            submessage="Mohon tunggu sebentar"
            variant="circular"
            fullScreen={false}
          />
        );

      

      case 'error':
        return (
          <ErrorScreen
            error={error}
            onRetry={handleRetry}
            onBack={handleBackToLogin}
            showDetails={true}
            variant={error?.type || 'data'}
            actions={['retry', 'back']}
          />
        );

      case 'authenticated':
        // Show the actual children (main app content)
        return children;

      case 'unauthenticated':
      default:
        // Show login form
        return children;
    }
  };

  // If we're showing login form or main app, use the original AuthWrapper layout
  if (authState === 'unauthenticated' || authState === 'authenticated') {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <AuthBackground />
        <Grid container direction="column" justifyContent="center" sx={{ minHeight: '100vh' }}>
          <Grid item xs={12}>
            <Grid
              item
              xs={12}
              container
              justifyContent="center"
              alignItems="center"
              sx={{ minHeight: { xs: 'calc(100vh - 210px)', sm: 'calc(100vh - 134px)', md: 'calc(100vh - 112px)' } }}
            >
              <Grid item>
                <AuthCard>{renderContent()}</AuthCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // For loading and error states, show full screen without AuthCard
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AuthBackground />
      <Grid container direction="column" justifyContent="center" sx={{ minHeight: '100vh' }}>
        <Grid item xs={12}>
          <Grid
            item
            xs={12}
            container
            justifyContent="center"
            alignItems="center"
            sx={{ minHeight: { xs: 'calc(100vh - 210px)', sm: 'calc(100vh - 134px)', md: 'calc(100vh - 112px)' } }}
          >
            {renderContent()}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

AuthWrapper.propTypes = {
  children: PropTypes.node
};

export default AuthWrapper;