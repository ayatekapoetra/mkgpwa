# MIGRASI WEB - OVERVIEW

## 📋 Project Information

**Project Name:** MKG PWA - Web Application  
**Current Version:** v1.5.2  
**Framework:** Next.js 14 (App Router)  
**Backend:** AdonisJS 4.1  
**Database:** MySQL  
**Deployment:** Production at https://pwa.makkuragatama.id  

---

## 🎯 Migration Objective

Migrate existing Next.js application to a new modern dashboard template while preserving ALL existing features, functionality, and business logic.

---

## 📊 Application Statistics

- **Total Routes:** 54 pages
- **Total API Endpoints:** 30 hooks
- **Total View Components:** 119 files
- **Main Modules:** 10 modules
- **Module Categories:** 6 categories

---

## 🗂️ Module Structure

### 1. **MASTER DATA** (10 features)
Core master data management for the application.

| Feature | Route | Status |
|---------|-------|--------|
| DOM | `/dom` | ✅ Active |
| Equipment | `/equipment` | ✅ Active |
| Barang/Sparepart | `/barang` | ✅ Active |
| Material | `/material` | ✅ Active |
| Lokasi Kerja | `/lokasi-kerja` | ✅ Active |
| Kegiatan Kerja | `/kegiatan-kerja` | ✅ Active |
| Penyewa | `/penyewa` | ✅ Active |
| Cabang | `/cabang` | ✅ Active |
| Bisnis Unit | `/bisnis-unit` | ✅ Active |

### 2. **OPERATIONAL MINING** (3 features)
Mining operations and daily activity tracking.

| Feature | Route | Status |
|---------|-------|--------|
| Timesheet | `/timesheet` | ✅ Active |
| Daily Equipment Activity | `/daily-equipment-activity` | ✅ Active |
| Daily Mining Ritase | `/daily-mining-ritase` | ✅ Active |

### 3. **SUPPLY CHAIN MANAGEMENT** (3 features)
Supply chain and logistics management.

| Feature | Route | Status |
|---------|-------|--------|
| Delivery Order | `/delivery-order` | ✅ Active |
| Pickup Order | `/pickup-order` | ✅ Active |
| Shipping Order | N/A | ⚠️ Menu only |

### 4. **SETTING** (2 features)
Application settings and configuration.

| Feature | Route | Status |
|---------|-------|--------|
| User Access | `/user-access` | ✅ Active |
| Timesheet Tag | `/timesheet-tag` | ✅ Active |

### 5. **OTHERS** (2 features)
Additional features and utilities.

| Feature | Route | Status |
|---------|-------|--------|
| Penugasan Kerja | `/penugasan-kerja` | ✅ Active |
| Timesheet OCR | `/timesheet-ocr-ab`, `/timesheet-ocr-dt` | ✅ Active |

### 6. **LAPORAN** (1 feature)
Reporting and analytics.

| Feature | Route | Status |
|---------|-------|--------|
| Pemakaian Barang | `/laporan/pemakaian-barang` | ✅ Active |

### 7. **UTILITIES**
System utilities and helpers.

| Feature | Route | Status |
|---------|-------|--------|
| Manual Download | `/manual-download` | ✅ Active |
| Home Dashboard | `/home` | ✅ Active |
| Server Test | `/server-test` | ✅ Active |

---

## 🔗 API Integration Summary

### Authentication
- `src/api/auth.js` - Login, logout, session management

### Master Data APIs
- `src/api/barang.js` - Sparepart management
- `src/api/bisnis-unit.js` - Business unit
- `src/api/cabang.js` - Branch management
- `src/api/dom.js` - DOM management
- `src/api/equipment.js` - Equipment management
- `src/api/kegiatan-kerja.js` - Work activity
- `src/api/lokasi-kerja.js` - Work location
- `src/api/material.js` - Material types
- `src/api/penyewa.js` - Tenant/client
- `src/api/kategori-equipment.js` - Equipment category

### Operational APIs
- `src/api/daily-timesheet.js` - Daily timesheet
- `src/api/kegiatan-mining.js` - Mining activity
- `src/api/mining-produksi.js` - Mining production
- `src/api/lokasi-mining.js` - Mining location
- `src/api/shiftkerja.js` - Work shift

### SCM APIs
- `src/api/delivery-order.js` - Delivery order
- `src/api/pickup-order.js` - Pickup order

### Other APIs
- `src/api/penugasan-kerja.js` - Work assignment
- `src/api/pemakaian-barang.js` - Item usage report
- `src/api/grouptag-timesheet.js` - Timesheet grouping
- `src/api/karyawan.js` - Employee data
- `src/api/users.js` - User management
- `src/api/menu.js` - Dynamic menu
- `src/api/mitra-bisnis.js` - Business partner
- `src/api/pemasok.js` - Supplier
- `src/api/signages.js` - Signage management
- `src/api/sysoptions.js` - System options
- `src/api/notification.js` - Notifications
- `src/api/snackbar.js` - Toast notifications

---

## 🎨 Current Tech Stack

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **UI Library:** Material-UI (MUI) v5
- **State Management:** SWR (React Hooks)
- **Form Management:** Formik + Yup
- **Icons:** Iconsax-react
- **HTTP Client:** Axios
- **Authentication:** NextAuth.js
- **Maps:** Google Maps API
- **OCR:** Tesseract.js
- **File Upload:** AWS S3

### Backend Integration
- **Base URL:** https://apinext.makkuragatama.id
- **API Pattern:** RESTful
- **Auth:** Bearer Token (JWT)

---

## 📦 Key Features to Preserve

### 1. **Dynamic Menu System**
- Menu fetched from API (`/api/menu/user-menu`)
- Role-based menu visibility
- Dynamic icon mapping
- Hierarchical menu structure

### 2. **Offline Capability**
- Offline request queue (`lib/offlineFetch.js`)
- IndexedDB storage (`lib/useOfflineStorage.js`)
- Auto-retry when online
- Manual download feature

### 3. **Form Features**
- Multi-select dropdowns
- Autocomplete components
- Dynamic form validation
- Offline form submission queue

### 4. **Data Table Features**
- Pagination
- Filtering
- Sorting
- Desktop/Mobile responsive views
- Export functionality (some pages)

### 5. **OCR Integration**
- Timesheet OCR for Android/iOS screenshots
- Image processing with Tesseract.js
- Auto-fill form from OCR results

### 6. **File Upload**
- AWS S3 integration
- Image preview
- Multiple file upload
- Progress indicator

### 7. **Authentication**
- NextAuth.js integration
- JWT token management
- Session persistence
- Auto-logout on 401

---

## 🚨 Critical Components

### Shared Components
Located in `src/components/`:
- `OptionCabang.js` - Branch selector
- `OptionPenyewa.js` - Tenant selector
- `OptionLokasiPit.js` - Location selector (single)
- `OptionLokasiPitMulti.js` - Location selector (multiple)
- `OptionKaryawanMulti.js` - Employee selector (multiple)
- `OptionEquipment.js` - Equipment selector
- `OptionKegiatanKerja.js` - Activity selector
- `BtnBack.js` - Back button component
- `MainCard.js` - Main card wrapper

### Layout Components
- `src/app/(dashboard)/layout.js` - Main dashboard layout
- `src/components/@extended/Breadcrumbs.js` - Breadcrumb navigation

---

## 📋 Migration Checklist Categories

1. ✅ **MIGRASI-WEB-01-MASTER-DATA.md** - All master data features
2. ✅ **MIGRASI-WEB-02-OPERATIONAL.md** - Mining operations
3. ✅ **MIGRASI-WEB-03-SCM.md** - Supply chain management
4. ✅ **MIGRASI-WEB-04-SETTING.md** - Settings features
5. ✅ **MIGRASI-WEB-05-OTHERS.md** - Other features
6. ✅ **MIGRASI-WEB-06-COMPONENTS.md** - Shared components
7. ✅ **MIGRASI-WEB-07-API-INTEGRATION.md** - API hooks
8. ✅ **MIGRASI-WEB-08-AUTHENTICATION.md** - Auth flow
9. ✅ **MIGRASI-WEB-09-UTILITIES.md** - Utilities & helpers

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ All 54 routes working
- ✅ All CRUD operations functional
- ✅ All API integrations working
- ✅ Authentication flow complete
- ✅ Offline mode working
- ✅ File upload working
- ✅ OCR feature working

### Non-Functional Requirements
- ✅ Performance not degraded
- ✅ Mobile responsive
- ✅ Browser compatibility maintained
- ✅ SEO preserved
- ✅ Security not compromised

### User Experience
- ✅ Similar or better UX
- ✅ No broken workflows
- ✅ Consistent UI/UX patterns
- ✅ Accessibility maintained

---

## 📅 Next Steps

1. Review each detailed migration document (01-09)
2. Choose new dashboard template
3. Set up new project structure
4. Begin migration module by module
5. Test each module thoroughly
6. Deploy to staging
7. User acceptance testing
8. Production deployment

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-23  
**Author:** Migration Team
