'use client';

import { useEffect } from 'react';

export default function CleanupPage() {
  useEffect(() => {
    const cleanup = async () => {
      console.log('Starting cleanup...');

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Service Worker unregistered:', registration.scope);
          }
        } catch (error) {
          console.error('Error unregistering service workers:', error);
        }
      }

      // Clear caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('Cache deleted:', cacheName);
          }
        } catch (error) {
          console.error('Error clearing caches:', error);
        }
      }

      // Clear localStorage
      try {
        localStorage.clear();
        console.log('LocalStorage cleared');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }

      // Clear sessionStorage
      try {
        sessionStorage.clear();
        console.log('SessionStorage cleared');
      } catch (error) {
        console.error('Error clearing sessionStorage:', error);
      }

      console.log('Cleanup completed!');

      // Redirect to home after cleanup
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
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
        flexDirection: 'column'
      }}
    >
      <h1>Membersihkan Cache...</h1>
      <p>Menghapus service worker, cache, dan data lokal</p>
      <p>Anda akan diarahkan ke halaman utama dalam 2 detik</p>
    </div>
  );
}
