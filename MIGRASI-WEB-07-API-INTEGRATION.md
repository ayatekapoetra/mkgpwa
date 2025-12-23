# MIGRASI WEB - 07 API INTEGRATION

## 📋 Overview

Complete API integration architecture, patterns, and all endpoint documentation.

**Priority:** 🔴 CRITICAL

---

## 🔗 API Architecture

### Base Configuration
**File:** `src/utils/axios.js`

```javascript
const axiosServices = axios.create({
  baseURL: process.env.NEXT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
})
```

### Interceptors
1. **Request Interceptor:**
   - Add Bearer token from NextAuth session
   - Log requests (dev only)

2. **Response Interceptor:**
   - Handle 401 → redirect to login
   - Handle offline → queue request
   - Log responses (dev only)

---

## 📚 API Hooks Pattern

### Standard Pattern (SWR)
```javascript
export const useGetData = (params) => {
  const url = params 
    ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}`
    : `${endpoints.key}${endpoints.list}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  // CRITICAL: Safe array handling
  const rows = Array.isArray(data?.rows) ? data.rows : []

  return useMemo(() => ({
    data: rows,
    dataLoading: isLoading,
    dataError: error,
    dataEmpty: !isLoading && !rows.length,
    dataMutate: mutate
  }), [data, error, isLoading, mutate])
}
```

---

## 📁 All API Files

### Master Data APIs

#### 1. Barang (src/api/barang.js)
```javascript
endpoints = {
  key: '/api/master/barang',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 2. Bisnis Unit (src/api/bisnis-unit.js)
```javascript
endpoints = {
  key: '/api/master/bisnis-unit',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 3. Cabang (src/api/cabang.js)
**Fixed:** v1.4.17 - Safe array handling
```javascript
endpoints = {
  key: '/api/master/cabang',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 4. DOM (src/api/dom.js)
```javascript
endpoints = {
  key: '/api/master/dom',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 5. Equipment (src/api/equipment.js)
```javascript
endpoints = {
  key: '/api/master/equipment',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy',
  byKategori: '/kategori/:kategori_id'
}
```

#### 6. Kegiatan Kerja (src/api/kegiatan-kerja.js)
```javascript
endpoints = {
  key: '/api/master/kegiatan-kerja',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 7. Lokasi Kerja (src/api/lokasi-kerja.js)
**Fixed:** v1.4.17 - Safe array handling
```javascript
endpoints = {
  key: '/api/master/lokasi-kerja',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 8. Material (src/api/material.js)
```javascript
endpoints = {
  key: '/api/master/material',
  list: '/list'
}
```

#### 9. Penyewa (src/api/penyewa.js)
**Fixed:** v1.4.17 - Safe array handling
```javascript
endpoints = {
  key: '/api/master/penyewa',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 10. Kategori Equipment (src/api/kategori-equipment.js)
```javascript
endpoints = {
  key: '/api/master/kategori-equipment',
  list: '/list'
}
```

#### 11. Karyawan (src/api/karyawan.js)
**Fixed:** v1.4.17 - Safe array handling
```javascript
endpoints = {
  key: '/api/master/karyawan',
  list: '/list',
  oprdrv: '/oprdrv', // Operator driver only
  show: '/:id'
}
```

---

### Operational APIs

#### 12. Daily Timesheet (src/api/daily-timesheet.js)
```javascript
endpoints = {
  key: '/api/operational/timesheet',
  list: '/list',
  create: '/create',
  show: '/:id',
  showDT: '/:id/dump-truck',
  showHE: '/:id/heavy-equipment',
  update: '/:id/update',
  delete: '/:id/destroy',
  byEmployee: '/karyawan/:karyawan_id',
  byEquipment: '/equipment/:equipment_id',
  byDate: '/tanggal/:tanggal'
}
```

#### 13. Kegiatan Mining (src/api/kegiatan-mining.js)
```javascript
endpoints = {
  key: '/api/operational/daily-equipment-activity',
  list: '/list',
  byDate: '/tanggal/:tanggal',
  byEquipment: '/equipment/:equipment_id',
  summary: '/summary'
}
```

#### 14. Mining Produksi (src/api/mining-produksi.js)
```javascript
endpoints = {
  key: '/api/operational/mining-ritase',
  list: '/list',
  byDate: '/tanggal/:tanggal',
  byLocation: '/lokasi/:lokasi_id',
  summary: '/summary',
  hourly: '/hourly'
}
```

#### 15. Lokasi Mining (src/api/lokasi-mining.js)
**Fixed:** v1.4.17 - Safe array handling

#### 16. Shift Kerja (src/api/shiftkerja.js)
```javascript
endpoints = {
  key: '/api/master/shift',
  list: '/list'
}
```

---

### SCM APIs

#### 17. Delivery Order (src/api/delivery-order.js)
```javascript
endpoints = {
  key: '/api/scm/delivery-order',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy',
  byStatus: '/status/:status',
  print: '/:id/print'
}
```

#### 18. Pickup Order (src/api/pickup-order.js)
```javascript
endpoints = {
  key: '/api/scm/pickup-order',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

---

### Setting APIs

#### 19. Users (src/api/users.js)
```javascript
endpoints = {
  key: '/api/setting/users',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy',
  resetPassword: '/:id/reset-password'
}
```

#### 20. Group Tag Timesheet (src/api/grouptag-timesheet.js)
**Fixed:** v1.5.2 - Correct POST endpoints
```javascript
endpoints = {
  key: '/api/master/grouptag-timesheet',
  list: '/list',
  create: '/create', // POST
  show: '/:id',
  update: '/:id/update', // POST (not PUT)
  delete: '/:id/destroy' // POST (not DELETE)
}
```

---

### Other APIs

#### 21. Penugasan Kerja (src/api/penugasan-kerja.js)
```javascript
endpoints = {
  key: '/api/operational/penugasan-kerja',
  list: '/list',
  create: '/create',
  show: '/:id',
  update: '/:id/update',
  delete: '/:id/destroy'
}
```

#### 22. Pemakaian Barang (src/api/pemakaian-barang.js)
```javascript
endpoints = {
  key: '/api/laporan/pemakaian-barang',
  list: '/list',
  summary: '/summary',
  export: '/export'
}
```

#### 23. Mitra Bisnis (src/api/mitra-bisnis.js)
```javascript
endpoints = {
  key: '/api/master/mitra-bisnis',
  list: '/list'
}
```

#### 24. Pemasok (src/api/pemasok.js)
```javascript
endpoints = {
  key: '/api/master/pemasok',
  list: '/list'
}
```

---

### System APIs

#### 25. Auth (src/api/auth.js)
```javascript
endpoints = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  refresh: '/api/auth/refresh'
}
```

#### 26. Menu (src/api/menu.js)
**Fixed:** Returns full data object for grouptag
```javascript
endpoints = {
  key: '/api/menu',
  user: '/user-menu',
  listMenu: '/list-menu'
}
```

#### 27. Signages (src/api/signages.js)
```javascript
endpoints = {
  key: '/api/signages',
  list: '/list'
}
```

#### 28. System Options (src/api/sysoptions.js)
```javascript
endpoints = {
  key: '/api/system/options',
  get: '/:key',
  update: '/:key'
}
```

#### 29. Notification (src/api/notification.js)
```javascript
// Not an API call - uses SWR for global state
```

#### 30. Snackbar (src/api/snackbar.js)
```javascript
// Not an API call - uses SWR for global state
```

---

## 🔧 Offline Support

### Offline Queue
**File:** `lib/offlineFetch.js`

```javascript
// Save request to IndexedDB
await saveRequest(config)

// Replay all queued requests
await replayRequests()

// Get queue status
const pending = await getPendingRequests()
```

### Offline Storage
**File:** `lib/useOfflineStorage.js`

```javascript
useOfflineStorage(key, storeName, data)
```

**Stored Data:**
- Master: cabang, penyewa, lokasi-kerja, equipment, karyawan
- Lookups: kegiatan-kerja, material, shift
- User: menu, profile

---

## 📋 Migration TODO

### Phase 1: Core Setup
- [ ] Set up axios instance
- [ ] Configure base URL from env
- [ ] Set up request interceptor (auth token)
- [ ] Set up response interceptor (401, offline)
- [ ] Test connectivity

### Phase 2: API Hook Pattern
- [ ] Create base SWR hook template
- [ ] Implement safe array handling pattern
- [ ] Create mutation hook template
- [ ] Add offline queue support
- [ ] Add error handling

### Phase 3: Migrate All Hooks (Priority Order)
1. [ ] Auth API
2. [ ] Menu API
3. [ ] Cabang API
4. [ ] Penyewa API
5. [ ] Lokasi Kerja API
6. [ ] Equipment API
7. [ ] Karyawan API
8. [ ] Kegiatan Kerja API
9. [ ] [... continue for all 30 APIs]

### Phase 4: Offline Support
- [ ] Set up IndexedDB
- [ ] Implement request queue
- [ ] Implement offline storage
- [ ] Create sync mechanism
- [ ] Add online/offline detection
- [ ] Test offline mode

### Phase 5: Testing
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test error handling
- [ ] Test offline queue
- [ ] Test data persistence
- [ ] Load testing
- [ ] Security testing

---

## ✅ Critical Patterns

### Safe Array Handling
```javascript
// ALWAYS use this pattern
const data = Array.isArray(apiData?.rows) ? apiData.rows : []
```

### Nested Data Structure
```javascript
// Some APIs return nested: data.rows.data
const rows = data?.rows?.data || data?.rows || []
```

### Error Handling
```javascript
try {
  const resp = await axiosServices(config)
  // success
} catch (err) {
  if (!navigator.onLine) {
    await saveRequest(config)
  }
  // error handling
}
```

---

## 🎯 Success Criteria

- [ ] All 30 API hooks working
- [ ] All endpoints tested
- [ ] Safe array handling everywhere
- [ ] Offline queue functional
- [ ] No undefined errors
- [ ] Auth flow complete
- [ ] Performance acceptable

---

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 30-40 hours  
**Dependencies:** None (Foundation)  
**Risk Level:** High
