import localforage from 'localforage';
import axios from 'axios';
import axiosServices from 'utils/axios';

const requestStore = localforage.createInstance({
  name: 'offline-queue',
  storeName: 'lf_requests'
});

let replayPromise = null;

export async function saveRequest(config) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const payload = {
    url: config.url,
    method: (config.method || 'get').toUpperCase(),
    data: config.data ?? null,
    headers: config.headers ?? null,
    timestamp: Date.now(),
    status: config.status,
    pesan: config.pesan ?? 'Request pending offline'
  };
  await requestStore.setItem(String(id), payload);
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('✅ Disimpan ke queue:', id, payload.url);
  }
  return id;
}

export async function getAllRequests() {
  const requests = [];
  await requestStore.iterate((value, key) => {
    requests.push({ key: String(key), ...value });
  });
  requests.sort((a, b) => b.timestamp - a.timestamp);
  return requests;
}

export async function deleteRequest(key) {
  await requestStore.removeItem(String(key));
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🗑️ Dihapus dari queue:', key);
  }
}

export const removeRequest = deleteRequest;

export async function offlineFetch(config) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const id = await saveRequest(config);
    return { status: 0, message: 'Disimpan ke offline queue', _offlineId: id };
  }
  try {
    return await axios(config);
  } catch (err) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const id = await saveRequest(config);
      return { status: 0, message: 'Disimpan ke offline queue', _offlineId: id };
    }
    throw err;
  }
}

export async function replayRequests(onProgress = null, onConflict = null) {
  if (replayPromise) return replayPromise;

  const replay = () => replayPendingRequests(onProgress, onConflict);
  replayPromise = typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('offline-request-replay', { mode: 'exclusive' }, replay)
    : replay();
  try {
    return await replayPromise;
  } finally {
    replayPromise = null;
  }
}

async function replayPendingRequests(onProgress = null, onConflict = null) {
  const requests = await getAllRequests();
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('▶️ Mulai replay, total:', requests.length);
  }

  let synced = 0;
  let failed = 0;

  for (const req of requests) {
    if (req.status === 'terkirim') {
      await deleteRequest(req.key);
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

      const resp = await axiosServices({
        url: req.url,
        method: req.method,
        data: req.data,
        headers: req.headers,
        skipOfflineQueue: true
      });

      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`✅ Replay sukses [${req.key}] → ${req.url}`, resp.status);
      }

      await deleteRequest(req.key);

      synced++;
      window.dispatchEvent(new Event('queue-updated'));
    } catch (err) {
      failed++;
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error(`❌ Replay gagal [${req.key}] → ${req.url}`, err);
      }
    }
  }

  return { synced, failed, total: requests.length };
}
