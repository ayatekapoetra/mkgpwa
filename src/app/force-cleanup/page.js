'use client';

import { useEffect } from 'react';

export default function ForceCleanupPage() {
  useEffect(() => {
    const forceCleanup = async () => {
      console.log('Starting FORCE cleanup...');

      // 1. Force unregister all service workers with multiple attempts
      if ('serviceWorker' in navigator) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log(`Service Worker unregistered (attempt ${attempt + 1}):`, registration.scope);
            }
          } catch (error) {
            console.error(`Error unregistering service workers (attempt ${attempt + 1}):`, error);
          }
          await new Promise((resolve) => setTimeout(resolve, 500)); // Wait between attempts
        }
      }

      // 2. Clear all caches with multiple attempts
      if ('caches' in window) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log(`Cache deleted (attempt ${attempt + 1}):`, cacheName);
            }
          } catch (error) {
            console.error(`Error clearing caches (attempt ${attempt + 1}):`, error);
          }
          await new Promise((resolve) => setTimeout(resolve, 500)); // Wait between attempts
        }
      }

      // 3. Force clear localStorage
      try {
        localStorage.clear();
        console.log('LocalStorage cleared');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }

      // 4. Force clear sessionStorage
      try {
        sessionStorage.clear();
        console.log('SessionStorage cleared');
      } catch (error) {
        console.error('Error clearing sessionStorage:', error);
      }

      // 5. Clear IndexedDB
      try {
        const databases = await indexedDB.databases();
        for (const database of databases) {
          if (database.name) {
            indexedDB.deleteDatabase(database.name);
            console.log('IndexedDB deleted:', database.name);
          }
        }
      } catch (error) {
        console.error('Error clearing IndexedDB:', error);
      }

      // 6. Clear application cache (if available)
      if ('applicationCache' in window) {
        try {
          window.applicationCache.swapCache();
          console.log('Application cache swapped');
        } catch (error) {
          console.log('Application cache not available');
        }
      }

      // 7. Force reload with cache bypass
      console.log('Force cleanup completed! Reloading page...');

      // Force reload with timestamp to bypass cache
      const timestamp = new Date().getTime();
      window.location.href = `/login?_t=${timestamp}`;
    };

    forceCleanup();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5'
      }}
    >
      <h1>FORCE CLEANUP IN PROGRESS...</h1>
      <p>Menghapus semua service worker, cache, dan data lokal secara agresif</p>
      <p>Halaman akan di-reload dan diarahkan ke login</p>
      <div style={{ marginTop: '20px' }}>
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
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
