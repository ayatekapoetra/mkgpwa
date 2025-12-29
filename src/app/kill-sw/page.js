'use client';

import { useEffect } from 'react';

export default function KillServiceWorkerPage() {
  useEffect(() => {
    const killAllServiceWorkers = async () => {
      console.log('🔪 STARTING SERVICE WORKER ASSASSINATION...');

      // Override fetch to block all PWA requests
      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        const url = args[0];
        if (
          typeof url === 'string' &&
          (url.includes('manifest.json') ||
            url.includes('sw.js') ||
            url.includes('workbox') ||
            url.includes('fallback') ||
            url.includes('precache') ||
            url.includes('service-worker'))
        ) {
          console.log('🔪 ASSASSINATED PWA request:', url);
          return Promise.reject(new Error('PWA request assassinated'));
        }
        return originalFetch.apply(this, args);
      };

      // Assassinate all service workers
      for (let attempt = 1; attempt <= 20; attempt++) {
        console.log(`🔪 Assassination attempt ${attempt}...`);

        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Found ${registrations.length} service workers to assassinate`);

            for (const registration of registrations) {
              try {
                await registration.unregister();
                console.log(`🔪 ASSASSINATED: ${registration.scope}`);
              } catch (error) {
                console.error(`❌ Failed to assassinate ${registration.scope}:`, error);
              }
            }
          } catch (error) {
            console.error(`❌ Error during assassination attempt ${attempt}:`, error);
          }
        }

        // Assassinate all caches
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              try {
                await caches.delete(cacheName);
                console.log(`🔪 ASSASSINATED Cache: ${cacheName}`);
              } catch (error) {
                console.error(`❌ Failed to assassinate cache ${cacheName}:`, error);
              }
            }
          } catch (error) {
            console.error('❌ Error assassinating caches:', error);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Final assassination - clear everything
      console.log('🔪 FINAL ASSASSINATION - Clearing all storage...');

      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🔪 Storage assassinated');
      } catch (error) {
        console.error('❌ Error assassinating storage:', error);
      }

      // Assassinate IndexedDB
      try {
        const databases = await indexedDB.databases();
        for (const database of databases) {
          if (database.name) {
            indexedDB.deleteDatabase(database.name);
            console.log(`🔪 ASSASSINATED IndexedDB: ${database.name}`);
          }
        }
      } catch (error) {
        console.error('❌ Error assassinating IndexedDB:', error);
      }

      console.log('🔪 ASSASSINATION COMPLETE! Reloading with extreme prejudice...');

      // Force reload with maximum cache busting
      const timestamp = Date.now();
      const random1 = Math.random().toString(36).substring(7);
      const random2 = Math.random().toString(36).substring(7);
      const random3 = Math.random().toString(36).substring(7);

      window.location.href = `/timesheet?_t=${timestamp}&_r1=${random1}&_r2=${random2}&_r3=${random3}&_assassinated=true`;
    };

    killAllServiceWorkers();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#000',
        color: '#ff0000',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '72px', marginBottom: '20px' }}>🔪</div>
      <h1 style={{ marginBottom: '20px', textShadow: '2px 2px 4px #000' }}>SERVICE WORKER ASSASSINATION</h1>
      <p style={{ marginBottom: '10px', fontSize: '18px' }}>🔪 Assassinating all service workers...</p>
      <p style={{ marginBottom: '10px', fontSize: '18px' }}>💀 Destroying all caches...</p>
      <p style={{ marginBottom: '10px', fontSize: '18px' }}>☠️ Eliminating all PWA remnants...</p>
      <p style={{ marginBottom: '20px', fontSize: '16px' }}>⚡ Force reloading to /timesheet...</p>

      <div style={{ marginTop: '30px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            border: '8px solid #333',
            borderTop: '8px solid #ff0000',
            borderRadius: '50%',
            animation: 'spin 0.3s linear infinite'
          }}
        ></div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
