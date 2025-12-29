'use client';

import { useEffect, useState } from 'react';

export default function CheckStatusPage() {
  const [status, setStatus] = useState('Checking...');
  const [hasServiceWorkers, setHasServiceWorkers] = useState(false);
  const [hasPWACaches, setHasPWACaches] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const checkStatus = async () => {
      const recs = [];

      // Check service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          setHasServiceWorkers(registrations.length > 0);
          if (registrations.length > 0) {
            recs.push('Service workers detected - cleanup needed');
          }
        } catch (error) {
          console.error('Error checking service workers:', error);
        }
      }

      // Check PWA caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const pwaCaches = cacheNames.filter(
            (name) => name.includes('workbox') || name.includes('pwa') || name.includes('sw-') || name.includes('next-pwa')
          );
          setHasPWACaches(pwaCaches.length > 0);
          if (pwaCaches.length > 0) {
            recs.push(`${pwaCaches.length} PWA caches detected - cleanup needed`);
          }
        } catch (error) {
          console.error('Error checking caches:', error);
        }
      }

      // Check if cleanup was done
      const cleanupDone = sessionStorage.getItem('pwa_cleanup_done');
      if (!cleanupDone) {
        recs.push('No cleanup record found - run cleanup first');
      }

      setRecommendations(recs);

      if (recs.length === 0) {
        setStatus('✅ System is clean - no PWA issues detected');
      } else {
        setStatus('⚠️ PWA remnants detected - cleanup recommended');
      }
    };

    checkStatus();
  }, []);

  const runQuickCleanup = async () => {
    setStatus('Running quick cleanup...');

    // Quick cleanup
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const pwaCaches = cacheNames.filter((name) => name.includes('workbox') || name.includes('pwa') || name.includes('sw-'));
      for (const cache of pwaCaches) {
        await caches.delete(cache);
      }
    }

    sessionStorage.setItem('pwa_cleanup_done', 'true');
    setStatus('✅ Quick cleanup completed - refresh page to check status');
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>🔍 PWA Status Check</h1>

      <div
        style={{
          padding: '20px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: status.includes('✅') ? '#e8f5e8' : '#fff3e0'
        }}
      >
        <h2>Status: {status}</h2>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>System Check:</h3>
        <ul>
          <li>Service Workers: {hasServiceWorkers ? '❌ Detected' : '✅ None'}</li>
          <li>PWA Caches: {hasPWACaches ? '❌ Detected' : '✅ None'}</li>
        </ul>
      </div>

      {recommendations.length > 0 && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          <h3>⚠️ Recommendations:</h3>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Actions:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={runQuickCleanup}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧹 Run Quick Cleanup
          </button>

          <button
            onClick={() => (window.location.href = '/final-cleanup')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔧 Run Full Cleanup
          </button>

          <button
            onClick={() => (window.location.href = '/timesheet')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📊 Go to Timesheet
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        <h4>💡 Tips:</h4>
        <ul>
          <li>Run cleanup if you see JavaScript errors</li>
          <li>Check this page after cleanup to verify</li>
          <li>Quick cleanup is sufficient for most cases</li>
          <li>Full cleanup provides detailed progress</li>
        </ul>
      </div>
    </div>
  );
}
