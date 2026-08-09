'use client';

import { useEffect } from 'react';

import PropTypes from 'prop-types';

// NEXT
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// PROJECT IMPORTS
import Loader from 'components/Loader';

// ==============================|| GUEST GUARD ||============================== //

const GuestGuard = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }

    // eslint-disable-next-line
  }, [session, status, router]);

  if (status === 'loading' || session?.user) return <Loader />;

  return <>{children}</>;
};

GuestGuard.propTypes = {
  children: PropTypes.node
};

export default GuestGuard;
