# MIGRASI WEB - 06 SHARED COMPONENTS

## 📋 Overview

Critical shared components used across all features. These must be migrated first before any feature migration.

**Priority:** 🔴 CRITICAL (Foundation)

---

## 🧩 Component Categories

### 1. Form Components

#### OptionCabang (Branch Selector)
**Location:** `src/components/OptionCabang.js`

```typescript
interface Props {
  value: string | number
  name: string
  label: string
  error?: string
  touched?: boolean
  startAdornment?: ReactNode
  setFieldValue: (name: string, value: any) => void
}
```

**Features:**
- Autocomplete dropdown
- Fetch from `/api/master/cabang/list`
- Safe array handling: `Array.isArray(data?.rows) ? data.rows : []`
- Display: `${kode} - ${nama}`
- Returns: `cabang_id`

---

#### OptionPenyewa (Tenant Selector)
**Location:** `src/components/OptionPenyewa.js`

**Features:**
- Similar to OptionCabang
- Fetch from `/api/master/penyewa/list`
- Safe array handling
- Display: `${kode} - ${nama}`
- Returns: `penyewa_id`

---

#### OptionEquipment (Equipment Selector)
**Location:** `src/components/OptionEquipment.js`

**Features:**
- Autocomplete for equipment
- Fetch from `/api/master/equipment/list`
- Optional filter by kategori (DT/HE)
- Display: `${kode} - ${nama} (${no_lambung})`
- Returns: `equipment_id`

---

#### OptionLokasiPit (Single Location Selector)
**Location:** `src/components/OptionLokasiPit.js`

**Features:**
- Single select dropdown
- Fetch from `/api/master/lokasi-kerja/list`
- Optional filter by cabang/penyewa/kegiatan
- Display: `${nama} - ${nama_pit}`
- Returns: `lokasi_kerja_id`

---

#### OptionLokasiPitMulti (Multiple Location Selector)
**Location:** `src/components/OptionLokasiPitMulti.js`

**Features:**
- Multi-select checkbox list
- Defensive null checks in filters
- Returns: `number[]` of IDs
- Used in timesheet-tag feature

**Critical Fix Applied (v1.4.18):**
```javascript
// Before
.filter(item => item?.cabang_id === values.cabang_id)

// After  
.filter(item => item && item.cabang_id === values.cabang_id)
```

---

#### OptionKaryawanMulti (Multiple Employee Selector)
**Location:** `src/components/OptionKaryawanMulti.js`

**Features:**
- Multi-select for employees
- Fetch from `/api/master/karyawan`
- Defensive null checks
- Returns: `number[]` of employee IDs

---

#### OptionKegiatanKerja (Activity Selector)
**Location:** `src/components/OptionKegiatanKerja.js`

**Features:**
- Select work activity
- Fetch from `/api/master/kegiatan-kerja/list`
- Safe array handling (v1.4.19)
- Filter by jenis_kegiatan
- Returns: `kegiatan_kerja_id`

---

### 2. Layout Components

#### MainCard
**Location:** `src/components/MainCard.js`

**Features:**
- Card wrapper with header
- Secondary actions slot
- Content area
- Consistent padding/spacing

```typescript
interface Props {
  title?: ReactNode
  secondary?: ReactNode
  content?: boolean
  children: ReactNode
}
```

---

#### BtnBack
**Location:** `src/components/BtnBack.js`

**Features:**
- Back button with icon
- Router navigation
- Consistent styling

```typescript
interface Props {
  href: string
  label?: string
}
```

---

#### Breadcrumbs
**Location:** `src/components/@extended/Breadcrumbs.js`

**Features:**
- Dynamic breadcrumb navigation
- Custom links support
- Current page indicator

```typescript
interface Props {
  custom?: boolean
  heading?: string
  links?: BreadcrumbLink[]
}

interface BreadcrumbLink {
  title: string
  to?: string
}
```

---

### 3. Data Display Components

#### List Desktop/Mobile
Pattern used across all modules

**Desktop:** Table with columns
**Mobile:** Card list

Common features:
- Pagination
- Sorting
- Filtering
- Action buttons
- Status badges
- Responsive

---

### 4. Utility Components

#### Notification System
**Location:** `src/api/notification.js`

```javascript
openNotification({
  open: true,
  title: 'success',
  message: 'Data berhasil disimpan',
  alert: { color: 'success' }
})
```

**Supported Colors:**
- success (green)
- error (red)
- warning (yellow)
- info (blue)

---

## 📋 Migration TODO - Components

### Phase 1: Core Components
- [ ] MainCard
- [ ] BtnBack
- [ ] Breadcrumbs
- [ ] Notification system

### Phase 2: Form Selectors (Priority Order)
1. [ ] OptionCabang (used by most modules)
2. [ ] OptionPenyewa (used by most modules)
3. [ ] OptionEquipment
4. [ ] OptionKegiatanKerja
5. [ ] OptionLokasiPit
6. [ ] OptionLokasiPitMulti
7. [ ] OptionKaryawanMulti

### Phase 3: Data Display
- [ ] Create base table component (desktop)
- [ ] Create base card list component (mobile)
- [ ] Create pagination component
- [ ] Create filter panel component
- [ ] Create sort header component

### Phase 4: Form Components
- [ ] Text input
- [ ] Textarea
- [ ] Select/dropdown
- [ ] Autocomplete
- [ ] Date picker
- [ ] Time picker
- [ ] Number input
- [ ] Image upload
- [ ] Multi-file upload
- [ ] Signature pad

### Phase 5: Testing
- [ ] Test all option components with API
- [ ] Test safe array handling
- [ ] Test null checks
- [ ] Test error states
- [ ] Test loading states
- [ ] Test empty states
- [ ] Test mobile responsiveness

---

## ✅ Critical Fixes Reference

### Filter Issues (v1.4.15-v1.4.19)
All option components had `TypeError: Cannot read properties of undefined (reading 'filter')` errors.

**Root Cause:** API hooks returning `undefined` instead of `[]`

**Solution Pattern:**
```javascript
// In API hook
const data = Array.isArray(apiData?.rows) ? apiData.rows : []

// In component
const options = Array.isArray(array) ? array : []

// In filter callbacks
.filter(item => item && item.property === value)
```

**Files Fixed:**
- `src/api/penyewa.js`
- `src/api/cabang.js`
- `src/api/lokasi-mining.js`
- `src/api/karyawan.js`
- `src/components/OptionPenyewa.js`
- `src/components/OptionCabang.js`
- `src/components/OptionLokasiPit.js`
- `src/components/OptionLokasiPitMulti.js`
- `src/components/OptionKaryawanMulti.js`
- `src/components/OptionEquipment.js`
- `src/components/OptionKegiatanKerja.js`

---

## 🎯 Success Criteria

- [ ] All components render without errors
- [ ] All API integrations working
- [ ] All safe array handling in place
- [ ] All null checks implemented
- [ ] No filter errors
- [ ] No undefined errors
- [ ] Mobile responsive
- [ ] Consistent styling
- [ ] Accessible
- [ ] Performance optimized

---

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 20-25 hours  
**Dependencies:** None (Foundation)  
**Risk Level:** High (affects all features)
