'use client';

import PropTypes from 'prop-types';

// PROJECT IMPORTS
import DashboardLayout from 'layout/DashboardLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';
import { useEffect } from 'react';
import { replayRequests } from 'lib/offlineFetch';
// import { useGetKegiatanKerja } from 'api/kegiatan-mining';
// import { useMaterialMining } from 'api/material';
// import { useGetLokasiKerja } from 'api/lokasi-mining';

// ==============================|| DASHBOARD LAYOUT ||============================== //

export default function Layout({ children }) {
  // const { data: kegiatan } = useGetKegiatanKerja();
  // const { data: material } = useMaterialMining();
  // const { data: lokasi } = useGetLokasiKerja();

  useEffect(() => {
    // fungsi handler untuk online event
    const handleOnline = async () => {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('✅ Back online → replay queue...');
      }
      await replayRequests();
    };

    // cek langsung kalau sudah online saat load
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      handleOnline();
    }

    // pasang listener
    window.addEventListener('online', handleOnline);

    // cleanup listener saat unmount
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}

Layout.propTypes = {
  children: PropTypes.node
};
