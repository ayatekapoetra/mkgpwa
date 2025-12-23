# MIGRASI WEB - 09 UTILITIES & HELPERS

## 📋 Overview

Utility functions, helpers, and configuration used across the application.

**Priority:** 🟡 MEDIUM

---

## 🛠️ Utilities

### 1. Offline Fetch (lib/offlineFetch.js)
Request queue for offline support

**Functions:**
- `saveRequest(config)` - Save to IndexedDB
- `replayRequests()` - Replay all queued
- `getPendingRequests()` - Get queue status
- `clearQueue()` - Clear all

### 2. Offline Storage (lib/useOfflineStorage.js)
Data caching in IndexedDB

**Usage:**
```javascript
useOfflineStorage('key', 'storeName', data)
```

### 3. Date Formatter
Format dates consistently

### 4. Number Formatter
Format currency, decimals

### 5. File Upload Helper
AWS S3 upload wrapper

### 6. Export Helper
Excel/PDF export utilities

---

## 📋 Migration TODO

- [ ] Port offline fetch
- [ ] Port offline storage
- [ ] Create date formatter
- [ ] Create number formatter
- [ ] Create file upload helper
- [ ] Create export utilities
- [ ] Test all utilities

---

**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 10-15 hours
