'use client';

import PropTypes from 'prop-types';
import { Fragment, useEffect } from 'react';

// NEXT
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// PROJECT IMPORTS
import Loader from 'components/Loader';

// ==============================|| AUTH GUARD ||============================== //

const AuthGuard = ({ children }) => {
  const { data: session, status } = useSession();
  // console.log('SESSION-AUTH', session);
  // console.log('SESSION-STATUS', status);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/protected', { cache: 'no-store' });
        // console.log('FETCH-RESP', res);
        const json = await res?.json();
        if (!json?.protected) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        router.push('/login');
      }
    };

    fetchData();
  }, [session, router]);

  if (status == 'loading' || !session?.user) {
    return (
      <Fragment>
        <Loader />
      </Fragment>
    );
  }

  return <Fragment>{children}</Fragment>;
};

AuthGuard.propTypes = {
  children: PropTypes.node
};

export default AuthGuard;
