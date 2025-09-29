import { useEffect } from 'react';
import localforage from 'localforage';

export const useOfflineStorage = (storeName, key, data) => {
  const store = localforage.createInstance({
    name: 'master-data',
    storeName
  });

  useEffect(() => {
    if (data) {
      store.setItem(key, data);
    }
  }, [data, store, key]);
};

export const getOfflineData = async (storeName, key) => {
  const store = localforage.createInstance({
    name: 'master-data',
    storeName
  });
  return await store.getItem(key);
};
