# MIGRASI WEB - 05 OTHERS & UTILITIES

## 📋 Module Overview

Additional features including work assignments, OCR processing, reports, and utility pages.

**Total Features:** 4  
**Priority:** 🟢 LOW-MEDIUM

---

## 🗂️ Features List

### 1. Penugasan Kerja (Work Assignment)
**Route:** `/penugasan-kerja`  
**API:** `src/api/penugasan-kerja.js`  
**Views:** `src/views/other/penugasan-kerja/`

#### Pages
- List, Create, Show

#### Features
- Assign employees to work locations
- Set assignment period
- Track assignment status
- Link to timesheet

#### Data Structure
```typescript
interface PenugasanKerja {
  id: number
  tanggal_mulai: string
  tanggal_selesai?: string
  karyawan_id: number
  lokasi_kerja_id: number
  equipment_id?: number
  posisi: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}
```

---

### 2. Timesheet OCR
**Routes:** `/timesheet-ocr-ab`, `/timesheet-ocr-dt`  
**Views:** `src/views/other/upload-ocr/`

#### Features
- Upload screenshot from mobile app
- OCR processing with Tesseract.js
- Extract timesheet data
- Auto-fill timesheet form
- Manual correction

#### Supported Formats
- Android app screenshot
- iOS app screenshot
- Specific layout patterns

---

### 3. Laporan Pemakaian Barang
**Route:** `/laporan/pemakaian-barang`  
**API:** `src/api/pemakaian-barang.js`  
**Views:** `src/views/laporan/pemakaian-barang/`

#### Features
- Item usage report
- Filter by date range
- Filter by item/location
- Export to Excel/PDF
- Summary statistics

#### Data Display
- Item name
- Quantity used
- Date of usage
- Location
- Used by (employee)
- Total by item

---

### 4. Manual Download (Offline Data)
**Route:** `/manual-download`

#### Features
- Download master data for offline use
- Select data types to download
- Store in IndexedDB
- Manual sync trigger
- Data size indicator

#### Downloadable Data
- Karyawan
- Equipment
- Lokasi Kerja
- Kegiatan Kerja
- Cabang
- Penyewa
- Barang

---

### 5. Home Dashboard
**Route:** `/home`

#### Features
- Summary widgets
- Quick links
- Recent activities
- Notifications
- Statistics

---

### 6. Server Test
**Route:** `/server-test`

#### Features
- Test API connectivity
- Test endpoints status
- Response time monitoring
- Debug information

---

## 📋 Migration TODO

### Penugasan Kerja
- [ ] Create API hooks
- [ ] Create list page
- [ ] Create form page
- [ ] Add employee autocomplete
- [ ] Add location selector
- [ ] Add equipment selector
- [ ] Implement date range picker
- [ ] Test CRUD operations

### Timesheet OCR
- [ ] Set up Tesseract.js
- [ ] Create upload page
- [ ] Implement image processing
- [ ] Create OCR extraction logic
- [ ] Handle Android format
- [ ] Handle iOS format
- [ ] Create auto-fill mechanism
- [ ] Add manual correction UI
- [ ] Test OCR accuracy

### Laporan Pemakaian Barang
- [ ] Create API hooks
- [ ] Create report page
- [ ] Add filter panel
- [ ] Implement date range filter
- [ ] Create data table
- [ ] Add summary section
- [ ] Implement Excel export
- [ ] Implement PDF export
- [ ] Test with large datasets

### Manual Download
- [ ] Create download UI
- [ ] Implement data selection
- [ ] Add IndexedDB storage
- [ ] Create download logic
- [ ] Add progress indicator
- [ ] Implement data sync
- [ ] Test offline access
- [ ] Add storage management

### Home Dashboard
- [ ] Create dashboard layout
- [ ] Create widget system
- [ ] Add summary cards
- [ ] Add quick action buttons
- [ ] Add recent activities list
- [ ] Implement notifications
- [ ] Test responsiveness

### Server Test
- [ ] Create test page
- [ ] Add connectivity tests
- [ ] Add endpoint status checks
- [ ] Display response times
- [ ] Show debug info
- [ ] Add refresh button

---

## 🎯 Success Criteria

- [ ] All features functional
- [ ] OCR accuracy >80%
- [ ] Reports generating correctly
- [ ] Offline download working
- [ ] Dashboard displaying real data
- [ ] Server test accurate

---

**Priority:** 🟢 LOW-MEDIUM  
**Estimated Effort:** 25-30 hours  
**Dependencies:** Various master data modules
