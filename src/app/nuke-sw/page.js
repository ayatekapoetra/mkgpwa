'use client';

import { useEffect } from 'react';

export default function NukeServiceWorkerPage() {
  useEffect(() => {
    const nukeServiceWorkers = async () => {
      console.log('🚀 STARTING NUCLEAR SERVICE WORKER CLEANUP 🚀');

      // 1. Multiple attempts to unregister service workers
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`🔥 Attempt ${attempt} to nuke service workers...`);

        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Found ${registrations.length} service worker registrations`);

            for (const registration of registrations) {
              try {
                await registration.unregister();
                console.log(`💥 NUKED Service Worker: ${registration.scope}`);
              } catch (error) {
                console.error(`❌ Failed to unregister ${registration.scope}:`, error);
              }
            }
          } catch (error) {
            console.error(`❌ Error getting registrations (attempt ${attempt}):`, error);
          }
        }

        // Wait between attempts
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 2. Nuke all caches multiple times
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`🔥 Attempt ${attempt} to nuke caches...`);

        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            console.log(`Found ${cacheNames.length} caches to nuke`);

            for (const cacheName of cacheNames) {
              try {
                await caches.delete(cacheName);
                console.log(`💥 NUKED Cache: ${cacheName}`);
              } catch (error) {
                console.error(`❌ Failed to delete cache ${cacheName}:`, error);
              }
            }
          } catch (error) {
            console.error(`❌ Error getting cache names (attempt ${attempt}):`, error);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 3. Nuke localStorage
      try {
        console.log('🔥 Nuking localStorage...');
        const keysToNuke = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.toLowerCase().includes('sw') ||
              key.toLowerCase().includes('cache') ||
              key.toLowerCase().includes('pwa') ||
              key.toLowerCase().includes('workbox') ||
              key.toLowerCase().includes('manifest') ||
              key.toLowerCase().includes('next-auth') ||
              key.toLowerCase().includes('token'))
          ) {
            keysToNuke.push(key);
          }
        }

        keysToNuke.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`💥 NUKED localStorage key: ${key}`);
        });

        console.log(`Nuked ${keysToNuke.length} localStorage keys`);
      } catch (error) {
        console.error('❌ Error nuking localStorage:', error);
      }

      // 4. Nuke sessionStorage
      try {
        console.log('🔥 Nuking sessionStorage...');
        sessionStorage.clear();
        console.log('💥 SessionStorage nuked');
      } catch (error) {
        console.error('❌ Error nuking sessionStorage:', error);
      }

      // 5. Nuke IndexedDB
      try {
        console.log('🔥 Nuking IndexedDB...');
        const databases = await indexedDB.databases();
        for (const database of databases) {
          if (database.name) {
            indexedDB.deleteDatabase(database.name);
            console.log(`💥 NUKED IndexedDB: ${database.name}`);
          }
        }
      } catch (error) {
        console.error('❌ Error nuking IndexedDB:', error);
      }

      // 6. Force reload with extreme prejudice
      console.log('🚀 NUKING COMPLETE! Forcing extreme reload...');

      // Add anti-cache parameters
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);

      // Force reload to home with cache busting
      window.location.href = `/home?_t=${timestamp}&_r=${random}&_nuke=true`;
    };

    nukeServiceWorkers();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>☢️</div>
      <h1 style={{ color: '#ff4444', marginBottom: '20px' }}>NUCLEAR SERVICE WORKER CLEANUP</h1>
      <p style={{ marginBottom: '10px' }}>🔥 Aggressively destroying all service workers and caches</p>
      <p style={{ marginBottom: '10px' }}>💥 Eliminating all PWA remnants</p>
      <p style={{ marginBottom: '20px' }}>🚀 Preparing for extreme reload</p>

      <div style={{ marginTop: '30px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '6px solid #333',
            borderTop: '6px solid #ff4444',
            borderRadius: '50%',
            animation: 'spin 0.5s linear infinite'
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
