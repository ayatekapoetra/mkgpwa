import localforage from 'localforage';

export const createLocalStore = (storeName) => {
  return localforage.createInstance({
    name: 'master-data',
    storeName
  });
};

export const getCachedData = async (store, key) => {
  try {
    return await store.getItem(key);
  } catch (err) {
    console.error(`Error loading local ${key}:`, err);
    return null;
  }
};

export const setCachedData = async (store, key, data) => {
  try {
    await store.setItem(key, data);
  } catch (err) {
    console.error(`Error saving local ${key}:`, err);
  }
};
