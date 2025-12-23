# MIGRASI WEB - 04 SETTING

## 📋 Module Overview

Setting module handles application configuration, user access management, and timesheet tag grouping.

**Total Features:** 2  
**Priority:** 🟡 MEDIUM

---

## 🗂️ Features List

### 1. User Access
**Route:** `/user-access`  
**API:** `src/api/users.js`  
**Views:** `src/views/setting/user-access/`

#### Pages
- List, Create, Show, Delete

#### Features
- User CRUD
- Role assignment
- Permission management
- Password reset
- Active/inactive status

#### Data Structure
```typescript
interface User {
  id: number
  username: string
  email: string
  nama: string
  role: 'admin' | 'supervisor' | 'user'
  karyawan_id?: number
  status: 'active' | 'inactive'
  last_login?: string
  created_at: string
}
```

---

### 2. Timesheet Tag (Group Tag)
**Route:** `/timesheet-tag`  
**API:** `src/api/grouptag-timesheet.js`  
**Views:** `src/views/setting/timesheet-tag/`

#### Pages
- List, Create, Edit

#### Features
- Group work locations by activity type
- Assign multiple locations to one tag
- Used for timesheet filtering
- Cabang and Penyewa based grouping

#### Data Structure
```typescript
interface GroupTagTimesheet {
  id: number
  kegiatan: 'rental' | 'barging' | 'mining' | 'explorasi'
  cabang_id: number
  penyewa_id: number
  pit_ids: number[] // Multiple location IDs
  created_at: string
}
```

#### API Endpoints (Fixed in v1.5.2)
- Create: POST `/api/master/grouptag-timesheet/create`
- Update: POST `/api/master/grouptag-timesheet/:id/update`
- Delete: POST `/api/master/grouptag-timesheet/:id/destroy`

---

## 📋 Migration TODO

### User Access
- [ ] Create user management API hooks
- [ ] Create list page with table
- [ ] Create user form (create/edit)
- [ ] Implement role selector
- [ ] Add password field (create only)
- [ ] Add reset password feature
- [ ] Link to karyawan (autocomplete)
- [ ] Test CRUD operations

### Timesheet Tag
- [ ] Create API hooks (already exists)
- [ ] Create list page (desktop/mobile)
- [ ] Create form page
- [ ] Add multi-select for locations
- [ ] Integrate OptionCabang
- [ ] Integrate OptionPenyewa
- [ ] Integrate OptionLokasiPitMulti
- [ ] Test create/update/delete
- [ ] Test nested data structure handling

---

## ✅ Validation Rules

### User
- Username: unique, alphanumeric, 4-20 chars
- Email: valid email, unique
- Password: min 8 chars (create only)
- Role: required
- Nama: required

### Timesheet Tag
- Kegiatan: required, one of ['rental','barging','mining','explorasi']
- Cabang: required
- Penyewa: required
- Locations: min 1 required

---

**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 15-20 hours  
**Dependencies:** Master Data (Cabang, Penyewa, Lokasi Kerja, Karyawan)
