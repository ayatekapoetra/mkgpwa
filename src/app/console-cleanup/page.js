'use client';

export default function ConsoleCleanupPage() {
  const runConsoleCleanup = () => {
    const script = `
      // BROWSER CONSOLE EMERGENCY CLEANUP SCRIPT
      console.log('🚨 CONSOLE EMERGENCY CLEANUP STARTED');

      // 1. Block all service worker registrations
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register = () => {
          console.log('🚫 SW registration blocked');
          return Promise.reject(new Error('SW disabled'));
        };
      }

      // 2. Destroy all service workers aggressively
      async function destroySW() {
        if ('serviceWorker' in navigator) {
          for (let i = 0; i < 50; i++) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const reg of registrations) {
                await reg.unregister();
                console.log('💥 SW destroyed:', reg.scope);
              }
            } catch (e) {
              console.log('SW destroy error:', e);
            }
            await new Promise(r => setTimeout(r, 10));
          }
        }
      }

      // 3. Destroy all caches
      async function destroyCaches() {
        if ('caches' in window) {
          for (let i = 0; i < 20; i++) {
            try {
              const cacheNames = await caches.keys();
              for (const name of cacheNames) {
                await caches.delete(name);
                console.log('💥 Cache destroyed:', name);
              }
            } catch (e) {
              console.log('Cache destroy error:', e);
            }
            await new Promise(r => setTimeout(r, 50));
          }
        }
      }

      // 4. Clear all storage
      function clearStorage() {
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('💥 Storage cleared');
        } catch (e) {
          console.log('Storage clear error:', e);
        }
      }

      // Execute everything
      destroySW();
      destroyCaches();
      clearStorage();

      console.log('🚨 CONSOLE CLEANUP COMPLETE - RELOAD PAGE NOW');
      console.log('Type: location.reload() to reload the page');
    `;

    // Copy to clipboard
    navigator.clipboard
      .writeText(script)
      .then(() => {
        alert('Script copied to clipboard! Open browser console (F12), paste and run the script, then reload the page.');
      })
      .catch(() => {
        alert('Copy failed. Please manually copy the script below and run it in browser console:\n\n' + script);
      });
  };

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>🚨 CONSOLE EMERGENCY CLEANUP</h1>

      <div
        style={{
          padding: '20px',
          backgroundColor: '#ffebee',
          border: '2px solid #d32f2f',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        <h2>⚠️ EMERGENCY: JavaScript Loading Failed</h2>
        <p>
          If you&apos;re seeing &quot;Unexpected token &apos;&lt;&apos;&quot; errors, service workers are still active and blocking
          JavaScript files.
        </p>
      </div>

      <div
        style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          border: '2px solid #1976d2',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        <h3>🔧 SOLUTION: Run Console Script</h3>
        <p>Click the button below to copy an emergency cleanup script. Then:</p>
        <ol>
          <li>
            Press <strong>F12</strong> to open browser console
          </li>
          <li>
            Paste the script and press <strong>Enter</strong>
          </li>
          <li>
            Type <code>location.reload()</code> and press Enter
          </li>
          <li>The page should load without JavaScript errors</li>
        </ol>
      </div>

      <button
        onClick={runConsoleCleanup}
        style={{
          padding: '15px 30px',
          backgroundColor: '#d32f2f',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        📋 COPY EMERGENCY CLEANUP SCRIPT
      </button>

      <div
        style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        <h4>Alternative Solutions:</h4>
        <ul>
          <li>
            <a href="/emergency-cleanup" style={{ color: '#1976d2' }}>
              Run Emergency Cleanup Page
            </a>
          </li>
          <li>
            <a href="/check-status" style={{ color: '#1976d2' }}>
              Check System Status
            </a>
          </li>
          <li>
            Hard refresh: <code>Ctrl+Shift+R</code> (or <code>Cmd+Shift+R</code> on Mac)
          </li>
          <li>Clear browser data for this site</li>
        </ul>
      </div>
    </div>
  );
}
