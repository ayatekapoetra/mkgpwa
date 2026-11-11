import { useEffect } from 'react';
import {
  createLocalStore,
  getCachedData,
  setCachedData,
  removeCachedData,
  clearCachedDataByPrefix
} from 'utils/localStorage';

export const useOfflineStorage = (storeName, key, data) => {
  useEffect(() => {
    if (data != null && key) {
      const store = createLocalStore(storeName);
      void setCachedData(store, key, data);
    }
  }, [data, storeName, key]);
};

export const getOfflineData = async (storeName, key) => {
  if (typeof window === 'undefined') return null;

  const store = createLocalStore(storeName);
  return getCachedData(store, key);
};

export const removeOfflineData = async (storeName, key) => {
  if (typeof window === 'undefined') return;

  const store = createLocalStore(storeName);
  await removeCachedData(store, key);
};

export const clearOfflineDataByPrefix = async (storeName, prefix) => {
  if (typeof window === 'undefined') return;

  const store = createLocalStore(storeName);
  await clearCachedDataByPrefix(store, prefix);
};
