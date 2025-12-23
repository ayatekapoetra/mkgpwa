// Force Clear All Cache and Service Workers
// Usage: Open browser console and run this script, or visit this file directly

(async function forceClearCache() {
  console.log('🧹 Starting force cache clear...');
  
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${registrations.length} service worker(s)`);
      
      for (const registration of registrations) {
        const success = await registration.unregister();
        console.log(`Service Worker unregistered:`, success ? '✅' : '❌', registration.scope);
      }
    }
    
    // 2. Delete all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} cache(s):`, cacheNames);
      
      for (const cacheName of cacheNames) {
        const success = await caches.delete(cacheName);
        console.log(`Cache deleted:`, success ? '✅' : '❌', cacheName);
      }
    }
    
    // 3. Clear localStorage
    try {
      localStorage.clear();
      console.log('✅ localStorage cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear localStorage:', e.message);
    }
    
    // 4. Clear sessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear sessionStorage:', e.message);
    }
    
    // 5. Clear IndexedDB (offline queue)
    if ('indexedDB' in window) {
      try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log('✅ IndexedDB deleted:', db.name);
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not clear IndexedDB:', e.message);
      }
    }
    
    console.log('');
    console.log('✅ ✅ ✅ CACHE CLEAR COMPLETE ✅ ✅ ✅');
    console.log('');
    console.log('⚠️  IMPORTANT: Please close ALL browser tabs for this site, then reopen.');
    console.log('⚠️  Or press Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac) to hard refresh.');
    console.log('');
    
    // Show alert to user
    alert('✅ Cache cleared successfully!\n\n⚠️ Please close ALL tabs for this site and reopen, or press Ctrl+Shift+R to hard refresh.');
    
  } catch (error) {
    console.error('❌ Error during cache clear:', error);
    alert('❌ Error clearing cache. Check console for details.');
  }
})();
