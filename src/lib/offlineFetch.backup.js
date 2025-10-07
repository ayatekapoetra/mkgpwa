import { checkIsTauri } from 'utils/tauriHelper';

let offlineModule = null;

async function getOfflineModule() {
  if (offlineModule) return offlineModule;
  
  const isTauri = checkIsTauri();
  
  if (isTauri) {
    try {
      offlineModule = await import('./offlineFetchTauri');
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('🚀 Using Tauri offline mode');
      }
    } catch (err) {
      console.warn('Tauri offline mode failed, falling back to browser mode:', err);
      offlineModule = await import('./offlineFetchBrowser');
    }
  } else {
    offlineModule = await import('./offlineFetchBrowser');
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('🌐 Using Browser offline mode');
    }
  }
  
  return offlineModule;
}

export async function saveRequest(config) {
  const offlineLib = await getOfflineModule();
  return offlineLib.saveRequest(config);
}

export async function getAllRequests() {
  const offlineLib = await getOfflineModule();
  return offlineLib.getAllRequests();
}

export async function deleteRequest(key) {
  const offlineLib = await getOfflineModule();
  return offlineLib.deleteRequest(key);
}

export const removeRequest = deleteRequest;

export async function replayRequests(onProgress = null, onConflict = null) {
  const offlineLib = await getOfflineModule();
  return offlineLib.replayRequests(onProgress, onConflict);
}

export async function offlineFetch(config) {
  const offlineLib = await getOfflineModule();
  return offlineLib.offlineFetch(config);
}
