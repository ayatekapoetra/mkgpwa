import axiosServices from 'utils/axios';
import { prepareFormDataForOffline, reconstructFormData } from './offlineFileHandler';

let requestStore = null;
let Store = null;
let sendNotification = null;

async function loadTauriModules() {
  if (!Store) {
    const storeModule = await import('@tauri-apps/plugin-store');
    Store = storeModule.Store;
  }
  if (!sendNotification) {
    try {
      const notificationModule = await import('@tauri-apps/plugin-notification');
      sendNotification = notificationModule.sendNotification;
    } catch (e) {
      sendNotification = async () => {}; // Fallback no-op
    }
  }
}

async function getStore() {
  if (!requestStore) {
    await loadTauriModules();
    requestStore = new Store('offline-queue.json');
  }
  return requestStore;
}

export async function saveRequest(config) {
  const store = await getStore();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  const requests = (await store.get('requests')) || {};
  
  let requestData = config.data;
  
  if (config.data instanceof FormData) {
    requestData = await prepareFormDataForOffline(config.data);
  }
  
  requests[id] = {
    url: config.url,
    method: (config.method || 'GET').toUpperCase(),
    data: requestData ?? null,
    headers: config.headers ?? null,
    timestamp: Date.now(),
    status: config.status || 'pending',
    pesan: config.pesan ?? 'Request pending offline',
    retryCount: 0,
    isFormData: config.data instanceof FormData
  };
  
  await store.set('requests', requests);
  await store.save();
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('✅ Disimpan ke queue:', id, config.url);
  }
  
  return id;
}

export async function getAllRequests() {
  const store = await getStore();
  const requests = (await store.get('requests')) || {};
  
  const requestArray = Object.keys(requests).map((key) => ({
    key,
    ...requests[key]
  }));
  
  requestArray.sort((a, b) => b.timestamp - a.timestamp);
  return requestArray;
}

export async function deleteRequest(key) {
  const store = await getStore();
  const requests = (await store.get('requests')) || {};
  
  delete requests[key];
  await store.set('requests', requests);
  await store.save();
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🗑️ Dihapus dari queue:', key);
  }
}

export const removeRequest = deleteRequest;

export async function updateRequestStatus(key, status, retryCount = 0) {
  const store = await getStore();
  const requests = (await store.get('requests')) || {};
  
  if (requests[key]) {
    requests[key].status = status;
    requests[key].retryCount = retryCount;
    await store.set('requests', requests);
    await store.save();
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function replayWithRetry(req, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axiosServices({
        url: req.url,
        method: req.method,
        data: req.data,
        headers: req.headers
      });
      return response;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      
      const delay = Math.pow(2, i) * 1000;
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`⏳ Retry ${i + 1}/${maxRetries} setelah ${delay}ms...`);
      }
      await sleep(delay);
    }
  }
}

export async function replayRequests(onProgress = null, onConflict = null) {
  const requests = await getAllRequests();
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('▶️ Mulai replay, total:', requests.length);
  }
  
  let synced = 0;
  let failed = 0;
  
  for (const req of requests) {
    if (req.status === 'terkirim') {
      synced++;
      continue;
    }
    
    try {
      if (onProgress) {
        onProgress({
          synced,
          failed,
          total: requests.length,
          current: req.pesan || req.url
        });
      }
      
      let requestData = req.data;
      
      if (req.isFormData && req.data) {
        requestData = await reconstructFormData(req.data);
      }
      
      const resp = await replayWithRetry({ ...req, data: requestData }, 3);
      
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`✅ Replay sukses [${req.key}] → ${req.url}`, resp?.status);
      }
      
      await updateRequestStatus(req.key, 'terkirim');
      synced++;
      
      window.dispatchEvent(new Event('queue-updated'));
    } catch (err) {
      if (err.response?.status === 409 && onConflict) {
        const resolution = await onConflict({
          localData: req.data,
          serverData: err.response?.data,
          pesan: req.pesan
        });
        
        if (resolution === 'overwrite') {
          try {
            const resp = await replayWithRetry({ ...req, data: requestData, params: { force: true } }, 1);
            await updateRequestStatus(req.key, 'terkirim');
            synced++;
            window.dispatchEvent(new Event('queue-updated'));
            continue;
          } catch (retryErr) {
            failed++;
            await updateRequestStatus(req.key, 'error', req.retryCount + 1);
          }
        } else {
          await updateRequestStatus(req.key, 'skipped');
        }
      } else {
        failed++;
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.error(`❌ Replay gagal [${req.key}] → ${req.url}`, err);
        }
        
        await updateRequestStatus(req.key, 'error', req.retryCount + 1);
      }
    }
  }
  
  if (sendNotification) {
    try {
      await sendNotification({
        title: 'Sync Selesai',
        body: `Berhasil: ${synced}, Gagal: ${failed}`
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }
  
  return { synced, failed, total: requests.length };
}

export async function offlineFetch(config) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const id = await saveRequest(config);
    return { status: 0, message: 'Disimpan ke offline queue', _offlineId: id };
  }
  
  try {
    return await axiosServices(config);
  } catch (err) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const id = await saveRequest(config);
      return { status: 0, message: 'Disimpan ke offline queue', _offlineId: id };
    }
    throw err;
  }
}
