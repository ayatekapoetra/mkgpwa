'use client';

import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';

// NEXT
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// PROJECT IMPORTS
import Loader from 'components/Loader';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';

// ==============================|| AUTH GUARD ||============================== //

const AuthGuard = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Auth state
  const [authState, setAuthState] = useState('loading'); // loading, authenticated, error
  const [error, setError] = useState(null);

  // Handle authentication state changes
  useEffect(() => {
    if (status === 'loading') {
      setAuthState('loading');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      setAuthState('authenticated');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: bypassing authentication check');
      setAuthState('authenticated');
      return;
    }

    router.push('/login');
  }, [session, status, router]);

  

  const handleRetry = () => {
    setError(null);
    setAuthState('authenticated');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  // Render different states
  if (authState === 'loading' || status === 'loading') {
    return (
      <LoadingScreen
        message="Memeriksa autentikasi..."
        submessage="Mohon tunggu sebentar"
        variant="circular"
        fullScreen={true}
      />
    );
  }

  

  if (authState === 'error') {
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
  }

  // If authenticated, show children
  return <Fragment>{children}</Fragment>;
};

AuthGuard.propTypes = {
  children: PropTypes.node
};

export default AuthGuard;