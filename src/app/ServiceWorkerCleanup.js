'use client';

import { useEffect, useRef } from 'react';

export default function ServiceWorkerCleanup() {
  const cleanupDoneRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // If cleanup already done, skip everything
    if (cleanupDoneRef.current) {
      return;
    }

    // Light blocking of PWA registration (not aggressive)
    const originalRegister = navigator.serviceWorker?.register;
    if (originalRegister) {
      navigator.serviceWorker.register = () => {
        console.log('🚫 PWA registration blocked (light mode)');
        return Promise.reject(new Error('PWA disabled'));
      };
    }

    // Aggressive cleanup function - ensures complete destruction
    const aggressiveCleanup = async () => {
      try {
        console.log('🔥 Running aggressive cleanup...');

        // 1. Destroy all service workers with multiple attempts
        if ('serviceWorker' in navigator) {
          for (let attempt = 1; attempt <= 5; attempt++) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              if (registrations.length > 0) {
                console.log(`Attempt ${attempt}: Destroying ${registrations.length} service workers`);

                for (const registration of registrations) {
                  try {
                    await registration.unregister();
                    console.log(`💥 Destroyed SW: ${registration.scope}`);
                  } catch (error) {
                    console.error(`❌ Failed to destroy SW: ${registration.scope}`, error);
                  }
                }
              }
            } catch (error) {
              console.error(`SW cleanup attempt ${attempt} failed:`, error);
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // 2. Destroy all suspicious caches
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            const suspiciousCaches = cacheNames.filter(
              (name) =>
                name.includes('workbox') ||
                name.includes('pwa') ||
                name.includes('sw-') ||
                name.includes('next-pwa') ||
                name.includes('precache') ||
                name.includes('runtime')
            );

            if (suspiciousCaches.length > 0) {
              console.log(`Destroying ${suspiciousCaches.length} suspicious caches`);

              for (const cacheName of suspiciousCaches) {
                try {
                  await caches.delete(cacheName);
                  console.log(`💥 Destroyed cache: ${cacheName}`);
                } catch (error) {
                  console.error(`❌ Failed to destroy cache: ${cacheName}`, error);
                }
              }
            }
          } catch (error) {
            console.error('Cache cleanup failed:', error);
          }
        }

        // 3. Clean PWA-related localStorage keys
        try {
          const keysToClean = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('workbox') || key.includes('pwa') || key.includes('sw-') || key.startsWith('next-pwa'))) {
              keysToClean.push(key);
            }
          }

          keysToClean.forEach((key) => {
            localStorage.removeItem(key);
            console.log(`🧹 Cleaned localStorage: ${key}`);
          });
        } catch (error) {
          console.error('localStorage cleanup failed:', error);
        }

        console.log('🔥 Aggressive cleanup cycle completed');

        // Mark as done after first successful run
        if (!cleanupDoneRef.current) {
          cleanupDoneRef.current = true;
          console.log('✅ Initial cleanup completed - switching to maintenance mode');
        }
      } catch (error) {
        console.error('❌ Error during aggressive cleanup:', error);
      }
    };

    // Run aggressive cleanup immediately
    aggressiveCleanup();

    // Run aggressive cleanup every 10 seconds for first minute, then every 30 seconds
    let runCount = 0;
    intervalRef.current = setInterval(() => {
      runCount++;
      aggressiveCleanup();

      // After 6 runs (1 minute), slow down to every 30 seconds
      if (runCount >= 6 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(aggressiveCleanup, 30000);
        console.log('🔄 Cleanup frequency reduced to every 30 seconds');
      }
    }, 10000);

    // Run on page load only
    const handleLoad = () => {
      if (!cleanupDoneRef.current) {
        aggressiveCleanup();
      }
    };
    window.addEventListener('load', handleLoad);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('load', handleLoad);

      // Restore original register function
      if (originalRegister) {
        navigator.serviceWorker.register = originalRegister;
      }
    };
  }, []);

  return null; // tidak render UI
}
