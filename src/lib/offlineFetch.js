import * as offlineLib from './offlineFetchBrowser';

export async function saveRequest(config) {
  return offlineLib.saveRequest(config);
}

export async function getAllRequests() {
  return offlineLib.getAllRequests();
}

export async function deleteRequest(key) {
  return offlineLib.deleteRequest(key);
}

export const removeRequest = deleteRequest;

export async function replayRequests(onProgress = null, onConflict = null) {
  return offlineLib.replayRequests(onProgress, onConflict);
}

export async function offlineFetch(config) {
  return offlineLib.offlineFetch(config);
}
