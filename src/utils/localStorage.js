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

export const removeCachedData = async (store, key) => {
  if (typeof window === 'undefined') return;

  try {
    await runStorageOperation(() => store.removeItem(key));
  } catch (err) {
    console.error(`Error removing local ${key}:`, err);
  }
};

export const clearCachedDataByPrefix = async (store, prefix) => {
  if (typeof window === 'undefined') return;

  try {
    // Each store call goes through runStorageOperation so IndexedDB access
    // stays serialized (same contract as get/set/remove helpers).
    const keys = await runStorageOperation(() => store.keys());
    const matched = (keys || []).filter(
      (key) => typeof key === 'string' && key.startsWith(prefix)
    );
    for (const key of matched) {
      await runStorageOperation(() => store.removeItem(key));
    }
  } catch (err) {
    console.error(`Error clearing local keys with prefix ${prefix}:`, err);
  }
};
