'use client';

import { useEffect } from 'react';

export default function ConsoleFixPage() {
  useEffect(() => {
    // Inject script to run in browser console
    const script = document.createElement('script');
    script.textContent = `
      // BROWSER CONSOLE FIX SCRIPT
      console.log('🔧 BROWSER CONSOLE FIX ACTIVATED');

      // 1. Block all PWA fetch requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (
          url.includes('manifest.json') ||
          url.includes('sw.js') ||
          url.includes('workbox') ||
          url.includes('fallback') ||
          url.includes('precache') ||
          url.includes('service-worker')
        )) {
          console.log('🚫 BLOCKED PWA REQUEST:', url);
          return Promise.reject(new Error('PWA request blocked'));
        }
        return originalFetch.apply(this, args);
      };

      // 2. Assassinate all service workers
      async function assassinateSW() {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
            console.log('🔪 ASSASSINATED SW:', reg.scope);
          }
        }
      }

      // 3. Clear all caches
      async function clearAllCaches() {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
            console.log('💥 CLEARED CACHE:', name);
          }
        }
      }

      // 4. Clear all storage
      function clearAllStorage() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🗑️ CLEARED ALL STORAGE');
      }

      // Execute immediately
      assassinateSW();
      clearAllCaches();
      clearAllStorage();

      // Execute every second for 10 seconds
      let count = 0;
      const interval = setInterval(() => {
        count++;
        assassinateSW();
        clearAllCaches();
        if (count >= 10) {
          clearInterval(interval);
          console.log('🔧 CONSOLE FIX COMPLETE - Reloading...');
          window.location.reload();
        }
      }, 1000);

      console.log('🔧 CONSOLE FIX SCRIPT LOADED - Check console for progress');
    `;
    document.head.appendChild(script);

    // Also run cleanup in React
    const cleanup = async () => {
      console.log('🔧 Running React cleanup...');

      // Clear everything
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }

      localStorage.clear();
      sessionStorage.clear();

      // Force reload after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    cleanup();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#001122',
        color: '#00ff88',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔧</div>
      <h1 style={{ marginBottom: '20px' }}>BROWSER CONSOLE FIX</h1>
      <p style={{ marginBottom: '10px' }}>🔧 Injecting fix script into browser console...</p>
      <p style={{ marginBottom: '10px' }}>🚫 Blocking all PWA requests...</p>
      <p style={{ marginBottom: '10px' }}>🔪 Assassinating service workers...</p>
      <p style={{ marginBottom: '20px' }}>💥 Clearing all caches and storage...</p>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#888' }}>
        <p>Check browser console (F12) for detailed progress</p>
        <p>Page will reload automatically in 5 seconds</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '6px solid #333',
            borderTop: '6px solid #00ff88',
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
