import localforage from 'localforage';

// Create separate stores for different types of data
const masterDataStore = localforage.createInstance({
  name: 'master-data-store',
  storeName: 'lf_master_data',
  description: 'Master data for offline functionality'
});

const userPreferencesStore = localforage.createInstance({
  name: 'user-preferences-store',
  storeName: 'lf_user_preferences',
  description: 'User preferences and settings'
});

const appCacheStore = localforage.createInstance({
  name: 'app-cache-store',
  storeName: 'lf_app_cache',
  description: 'Application cache for frequently accessed data'
});

const offlineQueueStore = localforage.createInstance({
  name: 'offline-queue-store',
  storeName: 'lf_offline_queue',
  description: 'Queue for offline requests'
});

// Storage management utilities
export const storageUtils = {
  // Clear all storage
  clearAllStorage: async () => {
    try {
      await Promise.all([
        masterDataStore.clear(),
        userPreferencesStore.clear(),
        appCacheStore.clear(),
        offlineQueueStore.clear()
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing all storage:', error);
      return false;
    }
  },

  // Get storage usage info
  getStorageInfo: async () => {
    try {
      const [masterDataSize, userPrefsSize, appCacheSize, queueSize] = await Promise.all([
        getStoreSize(masterDataStore),
        getStoreSize(userPreferencesStore),
        getStoreSize(appCacheStore),
        getStoreSize(offlineQueueStore)
      ]);

      return {
        masterData: masterDataSize,
        userPreferences: userPrefsSize,
        appCache: appCacheSize,
        offlineQueue: queueSize,
        total: masterDataSize + userPrefsSize + appCacheSize + queueSize
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  },

  // Clear expired data
  clearExpiredData: async (maxAge = 7 * 24 * 60 * 60 * 1000) => { // 7 days default
    try {
      const now = Date.now();
      const cutoffTime = now - maxAge;

      // Clear expired master data
      await clearExpiredStoreData(masterDataStore, cutoffTime);
      
      // Clear expired app cache
      await clearExpiredStoreData(appCacheStore, cutoffTime);

      return true;
    } catch (error) {
      console.error('Error clearing expired data:', error);
      return false;
    }
  }
};

// Master data storage utilities
export const masterDataStorage = {
  // Save master data with metadata
  saveMasterData: async (key, data, metadata = {}) => {
    try {
      const payload = {
        data,
        metadata: {
          timestamp: Date.now(),
          version: metadata.version || '1.0',
          source: metadata.source || 'api',
          ...metadata
        }
      };
      
      await masterDataStore.setItem(key, payload);
      return true;
    } catch (error) {
      console.error(`Error saving master data for ${key}:`, error);
      return false;
    }
  },

  // Get master data with validation
  getMasterData: async (key, maxAge = 24 * 60 * 60 * 1000) => { // 24 hours default
    try {
      const payload = await masterDataStore.getItem(key);
      
      if (!payload) {
        return null;
      }

      // Check if data is expired
      const now = Date.now();
      const dataAge = now - payload.metadata.timestamp;
      
      if (dataAge > maxAge) {
        console.log(`Master data for ${key} is expired (${dataAge}ms old)`);
        return null;
      }

      return payload.data;
    } catch (error) {
      console.error(`Error getting master data for ${key}:`, error);
      return null;
    }
  },

  // Get all master data keys
  getMasterDataKeys: async () => {
    try {
      const keys = [];
      await masterDataStore.iterate((value, key) => {
        keys.push(key);
      });
      return keys;
    } catch (error) {
      console.error('Error getting master data keys:', error);
      return [];
    }
  },

  // Clear specific master data
  clearMasterData: async (key) => {
    try {
      await masterDataStore.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error clearing master data for ${key}:`, error);
      return false;
    }
  },

  // Clear all master data
  clearAllMasterData: async () => {
    try {
      await masterDataStore.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all master data:', error);
      return false;
    }
  }
};

// User preferences storage utilities
export const userPreferencesStorage = {
  // Save user preference
  savePreference: async (key, value) => {
    try {
      await userPreferencesStore.setItem(key, {
        value,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error(`Error saving preference for ${key}:`, error);
      return false;
    }
  },

  // Get user preference
  getPreference: async (key, defaultValue = null) => {
    try {
      const pref = await userPreferencesStore.getItem(key);
      return pref ? pref.value : defaultValue;
    } catch (error) {
      console.error(`Error getting preference for ${key}:`, error);
      return defaultValue;
    }
  },

  // Get all user preferences
  getAllPreferences: async () => {
    try {
      const preferences = {};
      await userPreferencesStore.iterate((value, key) => {
        preferences[key] = value.value;
      });
      return preferences;
    } catch (error) {
      console.error('Error getting all preferences:', error);
      return {};
    }
  },

  // Clear user preference
  clearPreference: async (key) => {
    try {
      await userPreferencesStore.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error clearing preference for ${key}:`, error);
      return false;
    }
  }
};

// App cache storage utilities
export const appCacheStorage = {
  // Cache data with TTL
  cacheData: async (key, data, ttl = 60 * 60 * 1000) => { // 1 hour default
    try {
      const payload = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      await appCacheStore.setItem(key, payload);
      return true;
    } catch (error) {
      console.error(`Error caching data for ${key}:`, error);
      return false;
    }
  },

  // Get cached data
  getCachedData: async (key) => {
    try {
      const payload = await appCacheStore.getItem(key);
      
      if (!payload) {
        return null;
      }

      // Check if cache is expired
      const now = Date.now();
      const age = now - payload.timestamp;
      
      if (age > payload.ttl) {
        console.log(`Cache for ${key} is expired (${age}ms old)`);
        await appCacheStore.removeItem(key);
        return null;
      }

      return payload.data;
    } catch (error) {
      console.error(`Error getting cached data for ${key}:`, error);
      return null;
    }
  },

  // Clear expired cache entries
  clearExpiredCache: async () => {
    try {
      const now = Date.now();
      const keysToRemove = [];

      await appCacheStore.iterate((payload, key) => {
        const age = now - payload.timestamp;
        if (age > payload.ttl) {
          keysToRemove.push(key);
        }
      });

      for (const key of keysToRemove) {
        await appCacheStore.removeItem(key);
      }

      return keysToRemove.length;
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      return 0;
    }
  },

  // Clear all cache
  clearAllCache: async () => {
    try {
      await appCacheStore.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all cache:', error);
      return false;
    }
  }
};

// Offline queue utilities (enhanced version of existing offlineFetchBrowser)
export const offlineQueueStorage = {
  // Add request to queue
  addToQueue: async (request) => {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const payload = {
        id,
        ...request,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };
      
      await offlineQueueStore.setItem(id, payload);
      return id;
    } catch (error) {
      console.error('Error adding request to queue:', error);
      return null;
    }
  },

  // Get all queued requests
  getQueuedRequests: async (status = null) => {
    try {
      const requests = [];
      await offlineQueueStore.iterate((value, key) => {
        if (!status || value.status === status) {
          requests.push({ key, ...value });
        }
      });
      
      // Sort by timestamp (oldest first)
      requests.sort((a, b) => a.timestamp - b.timestamp);
      return requests;
    } catch (error) {
      console.error('Error getting queued requests:', error);
      return [];
    }
  },

  // Update request status
  updateRequestStatus: async (key, status, additionalData = {}) => {
    try {
      const request = await offlineQueueStore.getItem(key);
      if (request) {
        const updatedRequest = {
          ...request,
          status,
          ...additionalData,
          lastUpdated: Date.now()
        };
        
        await offlineQueueStore.setItem(key, updatedRequest);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating request status for ${key}:`, error);
      return false;
    }
  },

  // Remove request from queue
  removeFromQueue: async (key) => {
    try {
      await offlineQueueStore.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing request from queue for ${key}:`, error);
      return false;
    }
  },

  // Clear completed requests
  clearCompletedRequests: async () => {
    try {
      const keysToRemove = [];
      
      await offlineQueueStore.iterate((value, key) => {
        if (value.status === 'completed' || value.status === 'failed') {
          keysToRemove.push(key);
        }
      });

      for (const key of keysToRemove) {
        await offlineQueueStore.removeItem(key);
      }

      return keysToRemove.length;
    } catch (error) {
      console.error('Error clearing completed requests:', error);
      return 0;
    }
  }
};

// Helper functions
const getStoreSize = async (store) => {
  try {
    let size = 0;
    await store.iterate((value, key) => {
      size += JSON.stringify(value).length;
    });
    return size;
  } catch (error) {
    console.error('Error getting store size:', error);
    return 0;
  }
};

const clearExpiredStoreData = async (store, cutoffTime) => {
  try {
    const keysToRemove = [];
    
    await store.iterate((value, key) => {
      if (value.metadata && value.metadata.timestamp < cutoffTime) {
        keysToRemove.push(key);
      }
    });

    for (const key of keysToRemove) {
      await store.removeItem(key);
    }

    return keysToRemove.length;
  } catch (error) {
    console.error('Error clearing expired store data:', error);
    return 0;
  }
};

// Export all stores for direct access if needed
export {
  masterDataStore,
  userPreferencesStore,
  appCacheStore,
  offlineQueueStore
};