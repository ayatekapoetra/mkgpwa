import { 
  masterDataStorage, 
  userPreferencesStorage, 
  appCacheStorage, 
  offlineQueueStorage,
  storageUtils 
} from '../offlineStorage';

// Mock localforage
jest.mock('localforage', () => {
  const mockStore = {
    data: {},
    setItem: jest.fn((key, value) => {
      mockStore.data[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => {
      return Promise.resolve(mockStore.data[key] || null);
    }),
    removeItem: jest.fn((key) => {
      delete mockStore.data[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      mockStore.data = {};
      return Promise.resolve();
    }),
    iterate: jest.fn((callback) => {
      Object.entries(mockStore.data).forEach(([key, value]) => {
        callback(value, key);
      });
      return Promise.resolve();
    })
  };

  const createInstance = jest.fn(() => mockStore);

  return {
    createInstance,
    // Mock the default export
    default: createInstance
  };
});

describe('Offline Storage Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('masterDataStorage', () => {
    test('should save master data with metadata', async () => {
      const testData = [{ id: 1, name: 'Test Data' }];
      const metadata = { version: '1.0', source: 'api' };

      const result = await masterDataStorage.saveMasterData('test_key', testData, metadata);

      expect(result).toBe(true);
    });

    test('should get master data with validation', async () => {
      const testData = [{ id: 1, name: 'Test Data' }];
      const metadata = { timestamp: Date.now() };

      // Mock the getItem to return test data
      const mockStore = require('localforage').createInstance();
      mockStore.getItem.mockResolvedValue({
        data: testData,
        metadata
      });

      const result = await masterDataStorage.getMasterData('test_key');

      expect(result).toEqual(testData);
    });

    test('should return null for expired data', async () => {
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const metadata = { timestamp: oldTimestamp };

      // Mock the getItem to return old data
      const mockStore = require('localforage').createInstance();
      mockStore.getItem.mockResolvedValue({
        data: [{ id: 1, name: 'Old Data' }],
        metadata
      });

      const result = await masterDataStorage.getMasterData('test_key', 24 * 60 * 60 * 1000);

      expect(result).toBeNull();
    });

    test('should clear specific master data', async () => {
      const result = await masterDataStorage.clearMasterData('test_key');

      expect(result).toBe(true);
    });
  });

  describe('userPreferencesStorage', () => {
    test('should save user preference', async () => {
      const result = await userPreferencesStorage.savePreference('theme', 'dark');

      expect(result).toBe(true);
    });

    test('should get user preference with default value', async () => {
      // Mock getItem to return null
      const mockStore = require('localforage').createInstance();
      mockStore.getItem.mockResolvedValue(null);

      const result = await userPreferencesStorage.getPreference('theme', 'light');

      expect(result).toBe('light');
    });

    test('should get all preferences', async () => {
      const mockPreferences = {
        theme: { value: 'dark' },
        language: { value: 'id' }
      };

      // Mock iterate to simulate preferences
      const mockStore = require('localforage').createInstance();
      mockStore.iterate.mockImplementation((callback) => {
        Object.entries(mockPreferences).forEach(([key, value]) => {
          callback(value, key);
        });
      });

      const result = await userPreferencesStorage.getAllPreferences();

      expect(result).toEqual({
        theme: 'dark',
        language: 'id'
      });
    });
  });

  describe('appCacheStorage', () => {
    test('should cache data with TTL', async () => {
      const testData = { message: 'Cached data' };
      const ttl = 60 * 60 * 1000; // 1 hour

      const result = await appCacheStorage.cacheData('test_cache', testData, ttl);

      expect(result).toBe(true);
    });

    test('should get cached data if not expired', async () => {
      const testData = { message: 'Cached data' };
      const recentTimestamp = Date.now() - (30 * 60 * 1000); // 30 minutes ago
      const ttl = 60 * 60 * 1000; // 1 hour

      // Mock getItem to return recent cached data
      const mockStore = require('localforage').createInstance();
      mockStore.getItem.mockResolvedValue({
        data: testData,
        timestamp: recentTimestamp,
        ttl
      });

      const result = await appCacheStorage.getCachedData('test_cache');

      expect(result).toEqual(testData);
    });

    test('should return null for expired cache', async () => {
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      const ttl = 60 * 60 * 1000; // 1 hour

      // Mock getItem to return expired cached data
      const mockStore = require('localforage').createInstance();
      mockStore.getItem.mockResolvedValue({
        data: { message: 'Expired data' },
        timestamp: oldTimestamp,
        ttl
      });

      const result = await appCacheStorage.getCachedData('test_cache');

      expect(result).toBeNull();
    });
  });

  describe('offlineQueueStorage', () => {
    test('should add request to queue', async () => {
      const request = {
        url: '/api/test',
        method: 'POST',
        data: { test: 'data' }
      };

      const result = await offlineQueueStorage.addToQueue(request);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should get queued requests', async () => {
      const mockRequests = [
        { key: '1', status: 'pending', timestamp: 1000 },
        { key: '2', status: 'pending', timestamp: 2000 }
      ];

      // Mock iterate to return queued requests
      const mockStore = require('localforage').createInstance();
      mockStore.iterate.mockImplementation((callback) => {
        mockRequests.forEach(request => {
          callback(request, request.key);
        });
      });

      const result = await offlineQueueStorage.getQueuedRequests();

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('1'); // Should be sorted by timestamp (oldest first)
    });

    test('should update request status', async () => {
      const mockRequest = {
        id: 'test-id',
        status: 'pending',
        timestamp: Date.now()
      };

      // Mock getItem to return existing request
      const mockStore = require('localforage').createInstance();
      mockStore.getItem.mockResolvedValue(mockRequest);

      const result = await offlineQueueStorage.updateRequestStatus('test-key', 'completed');

      expect(result).toBe(true);
    });
  });

  describe('storageUtils', () => {
    test('should clear all storage', async () => {
      const result = await storageUtils.clearAllStorage();

      expect(result).toBe(true);
    });

    test('should get storage info', async () => {
      // Mock getStoreSize to return different sizes
      const mockStore = require('localforage').createInstance();
      mockStore.iterate.mockImplementation((callback) => {
        callback({ data: 'test' }, 'key1');
        callback({ data: 'test2' }, 'key2');
      });

      const result = await storageUtils.getStorageInfo();

      expect(result).toHaveProperty('masterData');
      expect(result).toHaveProperty('userPreferences');
      expect(result).toHaveProperty('appCache');
      expect(result).toHaveProperty('offlineQueue');
      expect(result).toHaveProperty('total');
    });
  });
});

describe('Error Handling', () => {
  test('should handle storage errors gracefully', async () => {
    // Mock getItem to throw an error
    const mockStore = require('localforage').createInstance();
    mockStore.getItem.mockRejectedValue(new Error('Storage error'));

    const result = await masterDataStorage.getMasterData('test_key');

    expect(result).toBeNull();
  });

  test('should handle save errors gracefully', async () => {
    // Mock setItem to throw an error
    const mockStore = require('localforage').createInstance();
    mockStore.setItem.mockRejectedValue(new Error('Save error'));

    const result = await masterDataStorage.saveMasterData('test_key', { data: 'test' });

    expect(result).toBe(false);
  });
});