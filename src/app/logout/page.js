'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      console.log('Starting logout process...');

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

      // Sign out from NextAuth
      try {
        await signOut({ redirect: false });
        console.log('NextAuth sign out completed');
      } catch (error) {
        console.error('Error during NextAuth sign out:', error);
      }

      console.log('Logout completed!');

      // Redirect to login page after logout
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    };

    logout();
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
      <h1>Proses Logout...</h1>
      <p>Menghapus service worker, cache, data lokal, dan sesi login</p>
      <p>Anda akan diarahkan ke halaman login dalam 2 detik</p>
    </div>
  );
}
