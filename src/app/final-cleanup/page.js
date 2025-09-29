'use client';

import { useEffect, useState } from 'react';

export default function FinalCleanupPage() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting cleanup...');

  useEffect(() => {
    const finalCleanup = async () => {
      try {
        setStatus('🔍 Checking for service workers...');
        setProgress(10);

        // 1. Check and unregister service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length > 0) {
            setStatus(`🗑️ Unregistering ${registrations.length} service workers...`);
            for (const registration of registrations) {
              await registration.unregister();
              console.log(`✅ Unregistered: ${registration.scope}`);
            }
          }
        }

        setProgress(30);
        setStatus('🗂️ Checking caches...');

        // 2. Clear PWA-related caches only
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const pwaCaches = cacheNames.filter(
            (name) => name.includes('workbox') || name.includes('pwa') || name.includes('sw-') || name.includes('next-pwa')
          );

          if (pwaCaches.length > 0) {
            setStatus(`🗑️ Deleting ${pwaCaches.length} PWA caches...`);
            for (const cacheName of pwaCaches) {
              await caches.delete(cacheName);
              console.log(`✅ Deleted cache: ${cacheName}`);
            }
          }
        }

        setProgress(60);
        setStatus('🧹 Cleaning local storage...');

        // 3. Clean PWA-related localStorage keys only
        const pwaKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('workbox') || key.includes('pwa') || key.includes('sw-') || key.startsWith('next-pwa'))) {
            pwaKeys.push(key);
          }
        }

        pwaKeys.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`✅ Removed localStorage: ${key}`);
        });

        setProgress(80);
        setStatus('✅ Cleanup completed!');

        // 4. Mark cleanup as done in sessionStorage
        sessionStorage.setItem('pwa_cleanup_done', 'true');

        setProgress(100);

        // 5. Redirect to timesheet after 2 seconds
        setTimeout(() => {
          window.location.href = '/timesheet';
        }, 2000);
      } catch (error) {
        console.error('❌ Cleanup error:', error);
        setStatus('❌ Cleanup failed, but continuing...');

        // Still redirect even if cleanup fails
        setTimeout(() => {
          window.location.href = '/timesheet';
        }, 2000);
      }
    };

    finalCleanup();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f8ff',
        color: '#333'
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧹</div>
      <h1 style={{ marginBottom: '20px', color: '#2e7d32' }}>FINAL CLEANUP</h1>
      <p style={{ marginBottom: '30px', textAlign: 'center', maxWidth: '400px' }}>{status}</p>

      {/* Progress Bar */}
      <div
        style={{
          width: '300px',
          height: '20px',
          backgroundColor: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#4caf50',
            transition: 'width 0.3s ease',
            borderRadius: '10px'
          }}
        ></div>
      </div>

      <p style={{ fontSize: '14px', color: '#666' }}>{progress}% complete</p>

      {progress === 100 && (
        <p
          style={{
            marginTop: '20px',
            color: '#2e7d32',
            fontWeight: 'bold'
          }}
        >
          ✅ Redirecting to /timesheet in 2 seconds...
        </p>
      )}
    </div>
  );
}
