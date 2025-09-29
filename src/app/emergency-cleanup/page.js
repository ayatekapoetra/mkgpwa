'use client';

import { useEffect, useState } from 'react';

export default function EmergencyCleanupPage() {
  const [status, setStatus] = useState('EMERGENCY CLEANUP ACTIVATED');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const emergencyCleanup = async () => {
      console.log('🚨 EMERGENCY CLEANUP STARTED');

      // 1. Immediate service worker destruction
      setStatus('DESTROYING SERVICE WORKERS...');
      setProgress(10);

      if ('serviceWorker' in navigator) {
        // Multiple aggressive attempts
        for (let attempt = 1; attempt <= 20; attempt++) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Attempt ${attempt}: Found ${registrations.length} service workers`);

            for (const registration of registrations) {
              await registration.unregister();
              console.log(`💥 DESTROYED: ${registration.scope}`);
            }

            // Also try to get registration by scope
            try {
              const reg = await navigator.serviceWorker.getRegistration('/');
              if (reg) {
                await reg.unregister();
                console.log('💥 DESTROYED root registration');
              }
            } catch (e) {
              // Ignore errors
            }
          } catch (error) {
            console.error(`Destruction attempt ${attempt} failed:`, error);
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setProgress(30);
      setStatus('ERASING ALL CACHES...');

      // 2. Nuclear cache destruction
      if ('caches' in window) {
        for (let attempt = 1; attempt <= 10; attempt++) {
          try {
            const cacheNames = await caches.keys();
            console.log(`Cache destruction ${attempt}: Found ${cacheNames.length} caches`);

            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log(`💥 ERASED cache: ${cacheName}`);
            }
          } catch (error) {
            console.error(`Cache destruction ${attempt} failed:`, error);
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setProgress(60);
      setStatus('PURGING STORAGE...');

      // 3. Storage annihilation
      try {
        // Clear all localStorage
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`💥 PURGED localStorage: ${key}`);
        });

        // Clear all sessionStorage
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorageKeys.forEach((key) => {
          sessionStorage.removeItem(key);
          console.log(`💥 PURGED sessionStorage: ${key}`);
        });

        console.log('💥 STORAGE PURGED');
      } catch (error) {
        console.error('Storage purge failed:', error);
      }

      setProgress(80);
      setStatus('FINALIZING...');

      // 4. Clear any remaining service worker data
      try {
        if ('serviceWorker' in navigator) {
          // Force clear all service worker data
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((reg) => {
              if (reg.active) {
                reg.active.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        }
      } catch (error) {
        console.error('Final cleanup failed:', error);
      }

      setProgress(100);
      setStatus('EMERGENCY CLEANUP COMPLETE - RELOADING...');

      // Force reload with cache busting
      setTimeout(() => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        window.location.href = `/timesheet/create?_emergency=${timestamp}&_r=${random}`;
      }, 1000);
    };

    emergencyCleanup();
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
        backgroundColor: '#000',
        color: '#ff0000',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚨</div>
      <h1 style={{ marginBottom: '20px', textShadow: '2px 2px 4px #000' }}>EMERGENCY CLEANUP</h1>
      <p style={{ marginBottom: '30px', fontSize: '18px' }}>{status}</p>

      {/* Progress Bar */}
      <div
        style={{
          width: '400px',
          height: '30px',
          backgroundColor: '#333',
          borderRadius: '15px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '2px solid #ff0000'
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#ff0000',
            transition: 'width 0.3s ease',
            borderRadius: '15px'
          }}
        ></div>
      </div>

      <p style={{ fontSize: '16px', color: '#ccc' }}>{progress}% complete</p>

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#111',
          borderRadius: '10px',
          border: '1px solid #ff0000'
        }}
      >
        <p style={{ margin: '0', fontSize: '14px', color: '#ff6666' }}>
          ⚠️ This will destroy all service workers and caches
          <br />
          🔄 Page will reload automatically when complete
        </p>
      </div>
    </div>
  );
}
