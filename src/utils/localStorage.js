import localforage from 'localforage';

const stores = new Map();
let pendingOperation = Promise.resolve();

// Stores share one IndexedDB database. Serialize initialization and access so
// a schema upgrade cannot close a connection while another store is in use.
const runStorageOperation = (operation) => {
  const result = pendingOperation.then(operation);
  pendingOperation = result.catch(() => {});
  return result;
};

export const createLocalStore = (storeName) => {
  if (!stores.has(storeName)) {
    stores.set(
      storeName,
      localforage.createInstance({
        name: 'master-data',
        storeName
      })
    );
  }

  return stores.get(storeName);
};

export const getCachedData = async (store, key) => {
  if (typeof window === 'undefined') return null;

  try {
    return await runStorageOperation(() => store.getItem(key));
  } catch (err) {
    console.error(`Error loading local ${key}:`, err);
    return null;
  }
};

export const setCachedData = async (store, key, data) => {
  if (typeof window === 'undefined') return;

  try {
    await runStorageOperation(() => store.setItem(key, data));
  } catch (err) {
    console.error(`Error saving local ${key}:`, err);
  }
};
