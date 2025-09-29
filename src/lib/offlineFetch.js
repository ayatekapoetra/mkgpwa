// lib/offlineFetch.js
import localforage from 'localforage';
import axios from 'axios';
import axiosServices from 'utils/axios';

const requestStore = localforage.createInstance({
  name: 'offline-queue',
  storeName: 'lf_requests'
});

export async function saveRequest(config) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const payload = {
    url: config.url,
    method: (config.method || 'get').toUpperCase(),
    data: config.data ?? null,
    headers: config.headers ?? null,
    timestamp: Date.now(),
    status: config.status,
    pesan: config.pesan ?? 'Request pending offline' // ✅ default message
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

export async function replayRequests() {
  const requests = await getAllRequests();
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('▶️ Mulai replay, total:', requests.length);
  }

  for (const req of requests) {
    if (req.status === 'terkirim') continue;

    try {
      const resp = await axiosServices({
        url: req.url,
        method: req.method,
        data: req.data,
        headers: req.headers
      });

      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`✅ Replay sukses [${req.key}] → ${req.url}`, resp.status);
      }

      await requestStore.setItem(req.key, {
        ...req,
        status: 'terkirim'
      });

      // 🔔 Trigger event agar UI refresh
      window.dispatchEvent(new Event('queue-updated'));
    } catch (err) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error(`❌ Replay gagal [${req.key}] → ${req.url}`, err);
      }
    }
  }
}
