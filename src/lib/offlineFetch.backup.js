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
  const module = await getOfflineModule();
  return module.saveRequest(config);
}

export async function getAllRequests() {
  const module = await getOfflineModule();
  return module.getAllRequests();
}

export async function deleteRequest(key) {
  const module = await getOfflineModule();
  return module.deleteRequest(key);
}

export const removeRequest = deleteRequest;

export async function replayRequests(onProgress = null, onConflict = null) {
  const module = await getOfflineModule();
  return module.replayRequests(onProgress, onConflict);
}

export async function offlineFetch(config) {
  const module = await getOfflineModule();
  return module.offlineFetch(config);
}
