'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || status === 'loading') return;

    console.log('HomePage - Session status:', status);
    console.log('HomePage - Session data:', session);

    // Check if running in Tauri environment
    const isTauri = typeof window !== 'undefined' && window.__TAURI__;
    console.log('Running in Tauri environment:', isTauri);

    if (session) {
      console.log('Session found, redirecting to /home');
      router.push('/home');
    } else {
      console.log('No session found, redirecting to /login');
      router.push('/login');
    }
  }, [session, status, router, mounted]);

  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Initializing...</h2>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h2>Loading... (Status: {status})</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          {status === 'loading' ? 'Checking session...' : 
           status === 'authenticated' ? 'Redirecting to home...' : 
           'Redirecting to login...'}
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
