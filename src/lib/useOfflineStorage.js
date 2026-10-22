import { useEffect } from 'react';
import { createLocalStore, getCachedData, setCachedData } from 'utils/localStorage';

export const useOfflineStorage = (storeName, key, data) => {
  useEffect(() => {
    if (data != null) {
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
