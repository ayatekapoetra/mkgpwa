# 05 — Frontend Architecture

## 1. Stack Frontend

| Teknologi | Versi | Penggunaan |
|---|---|---|
| Next.js (App Router) | ^14.0.4 | Framework utama |
| React | ^18.2.0 | UI library |
| MUI | ^5.15 | Design system |
| Formik | ^2.4.5 | Form state |
| Yup | ^1.3.3 | Validasi schema |
| SWR | ^2.2.4 | Data fetching (utama) |
| Axios | ^1.6.2 | HTTP client |
| Notistack | | Notification toast |
| JavaScript | | Bukan TypeScript |

Referensi: `nextjs/package.json`

## 2. Struktur File

```text
src/
├── api/
│   └── purchasing-request.js          # API client module
├── app/
│   └── (dashboard)/
│       └── (scm)/
│           └── purchasing-request/
│               ├── page.js             # List
│               ├── create/
│               │   └── page.js         # Create form
│               └── [id]/
│                   ├── page.js         # Detail (pusat aksi)
│                   └── edit/
│                       └── page.js     # Edit form
└── views/
    └── scm/
        └── purchasing-request/
            ├── index.js               # List view container
            ├── filter.js               # Filter drawer
            ├── list.js                 # Switch desktop/mobile
            ├── list-desktop.js         # Table desktop
            ├── list-mobile.js          # Card list mobile
            ├── form-page.js            # Create/edit wrapper
            ├── form.js                 # Formik form
            ├── detail.js              # Detail + workflow
            └── components/
                ├── RequestItemForm.js  # Item accordion
                ├── CheckItemForm.js     # Validate item
                ├── ActionDialog.js     # Confirm/rollback dialog
                ├── StatusChip.js       # Status badge
                ├── ProgressIndicator.js # Validated/approved progress
                ├── POPreview.js         # Preview grouping PO
                ├── AttachmentList.js    # File list
                └── AuditTimeline.js     # Audit trail display
```

## 3. Routing

| Route | View | Fungsi |
|---|---|---|
| `/purchasing-request` | `index.js` | List + filter |
| `/purchasing-request/create` | `form-page.js` | Create draft/submit |
| `/purchasing-request/[id]` | `detail.js` | Detail, validate, approve, rollback |
| `/purchasing-request/[id]/edit` | `form-page.js` | Edit header/item |

Pattern mengikuti `pengajuan-dana`:

```text
src/app/(dashboard)/(accounting)/pengajuan-dana/page.js
src/app/(dashboard)/(accounting)/pengajuan-dana/create/page.js
src/app/(dashboard)/(accounting)/pengajuan-dana/[id]/page.js
src/app/(dashboard)/(accounting)/pengajuan-dana/[id]/edit/page.js
```

App Router page hanya wrapper yang merender view dari `src/views`:

```js
// src/app/(dashboard)/(scm)/purchasing-request/page.js
import View from '@/views/scm/purchasing-request'

export const metadata = { title: 'Purchasing Request' }

export default function Page() {
  return <View />
}
```

## 4. API Client Module

`src/api/purchasing-request.js` mengikuti pola `src/api/pengajuan-dana.js`.

### Endpoint Object

```js
const ENDPOINTS = {
  list: '/scm/purchase-requests',
  create: '/scm/purchase-requests',
  show: (id) => `/scm/purchase-requests/${id}`,
  update: (id) => `/scm/purchase-requests/${id}`,
  delete: (id) => `/scm/purchase-requests/${id}`,
  submit: (id) => `/scm/purchase-requests/${id}/submit`,
  validate: (id) => `/scm/purchase-requests/${id}/validate`,
  approve: (id) => `/scm/purchase-requests/${id}/approve`,
  rollback: (id) => `/scm/purchase-requests/${id}/rollback`,
  items: {
    add: (id) => `/scm/purchase-requests/${id}/items`,
    update: (id, itemId) => `/scm/purchase-requests/${id}/items/${itemId}`,
    delete: (id, itemId) => `/scm/purchase-requests/${id}/items/${itemId}`,
  },
  attachments: {
    upload: (id) => `/scm/purchase-requests/${id}/attachments`,
    delete: (id, attId) => `/scm/purchase-requests/${id}/attachments/${attId}`,
  },
  permissions: '/scm/purchase-requests/permissions',
  documentPermissions: (id) => `/scm/purchase-requests/${id}/permissions`,
  auditTrail: (id) => `/scm/purchase-requests/${id}/audit-trail`,
  purchaseOrders: (id) => `/scm/purchase-requests/${id}/purchase-orders`,
  print: (id) => `/scm/purchase-requests/${id}/print`,
  export: '/scm/purchase-requests/export',
  pendingCount: '/scm/purchase-requests/pending-count',
  options: {
    barang: '/scm/purchase-requests/options/barang',
    pemasok: '/scm/purchase-requests/options/pemasok',
    equipment: '/scm/purchase-requests/options/equipment',
    gudang: '/scm/purchase-requests/options/gudang',
    cabang: '/scm/purchase-requests/options/cabang',
  },
}
```

### Hooks

```js
// Feature-level permission
usePurchasingRequestAccess()

// List dengan SWR
useGetPurchasingRequests(params, enabled)

// Detail dengan SWR
useShowPurchasingRequest(id, enabled)

// Document-level permission
usePurchasingRequestPermissions(id, enabled)

// Pending count (badge)
usePurchasingRequestPendingCount(enabled)

// Audit trail
usePurchasingRequestAuditTrail(id, enabled)

// Purchase orders
usePurchasingRequestPOs(id, enabled)

// Master options (debounced)
useOptionBarang(search, bisnisId)
useOptionPemasok(search, bisnisId)
useOptionEquipment(search, cabangId)
```

### Mutations

```js
createPurchasingRequest(payload)
savePurchasingRequestDraft(payload)
updatePurchasingRequest(id, payload)
submitPurchasingRequest(id)
addPurchasingRequestItem(prId, payload)
updatePurchasingRequestItem(prId, itemId, payload)
deletePurchasingRequestItem(prId, itemId)
validatePurchasingRequest(prId, payload)
approvePurchasingRequest(prId, payload)
rollbackPurchasingRequest(prId, payload)
deletePurchasingRequest(prId)
uploadPurchasingRequestAttachments(prId, files)
deletePurchasingRequestAttachment(prId, attId)
exportPurchasingRequestExcel(params)
printPurchasingRequest(id)
```

### Mutation Options

Semua mutation status dan upload wajib:

```js
{ skipOfflineQueue: true }
```

### Normalisasi Response

Mengikuti `pengajuan-dana.js:45-68`:

```js
function normalizeList(res) {
  return {
    rows: res.data || [],
    page: res.meta?.page || 1,
    perPage: res.meta?.per_page || 25,
    total: res.meta?.total || 0,
    lastPage: res.meta?.last_page || 1,
  }
}
```

### Parameter Cleaning

```js
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined
    )
  )
}
```

## 5. State Management

### Server State
- SWR untuk list, detail, permission, audit trail, PO, pending count.
- `mutate()` setelah mutation berhasil.
- Revalidate keys terkait: list, detail, permission, pending count, home KPI, signage.

### Local State
- `useState` untuk filter, dialog open, form mode, loading.
- `useMemo` untuk derived state (progress, total preview).
- Tidak ada Redux/Zustand.

### Form State
- Formik dengan `FieldArray` untuk items.
- Yup validation schema.
- `initialValues` dari detail response atau default.

## 6. SWR Keys

```text
pr:list:{JSON.stringify(params)}
pr:detail:{id}
pr:permissions:{id}
pr:audit:{id}
pr:po:{id}
pr:pending-count
pr:access
home:kpi
signage:pr:status
signage:pr:trend
```

Setelah mutation berhasil, revalidate:

```js
mutate('pr:list:...')
mutate(`pr:detail:${id}`)
mutate(`pr:permissions:${id}`)
mutate('pr:pending-count')
mutate('home:kpi')
mutate('signage:pr:status')
```

## 7. Permission Hook

Mengikuti `pengajuan-dana.js:71-88`:

```js
export function usePurchasingRequestAccess() {
  const { data, error, isLoading } = useSWR(
    'pr:access',
    () => api.get(ENDPOINTS.permissions).then(normalize),
    { revalidateOnFocus: false }
  )
  return {
    permissions: data || DEFAULT_PERMISSIONS,
    isLoading,
    error,
  }
}
```

Document-level:

```js
export function usePurchasingRequestPermissions(id, enabled = true) {
  const { data, error } = useSWR(
    enabled ? `pr:permissions:${id}` : null,
    () => api.get(ENDPOINTS.documentPermissions(id)).then(normalize),
    { revalidateOnFocus: false }
  )
  return {
    permissions: data || DEFAULT_DOC_PERMISSIONS,
    isLoading: !data && !error,
  }
}
```

## 8. Reusable Components

Komponen yang sudah ada dan dapat dipakai:

| Komponen | Path | Penggunaan PR |
|---|---|---|
| `MainCard` | `src/components/MainCard.js` | Wrapper halaman |
| `Paginate` | `src/components/Paginate.js` | Pagination server-side |
| `ConfirmDialog` | `src/components/ConfirmDialog.js` | Dialog konfirmasi umum |
| `DropZoneFormik` | `src/components/DropZoneFormik.js` | Upload attachment |
| `OptionBarang` | `src/components/OptionBarang.js` | Autocomplete barang |
| `OptionGudang` | `src/components/OptionGudang.js` | Autocomplete gudang |
| `OptionPemasokDelor` | `src/components/OptionPemasokDelor.js` | Autocomplete supplier |
| `OptionEquipment` | (perlu buat/adapter) | Autocomplete equipment |
| `OptionCabang` | (perlu buat/adapter) | Autocomplete cabang |
| `Breadcrumbs` | `src/components/@extended/Breadcrumbs.js` | Navigation |
| `Loader` | `src/components/Loader.js` | Loading state |
| `InputSkeleton` | `src/components/InputSkeleton.js` | Form loading |
| `OfflineIndicator` | `src/components/OfflineIndicator.js` | Status offline |

Komponen baru yang perlu dibuat:

- `StatusChip` — badge status PR dengan warna.
- `ProgressIndicator` — progress validated x/y, approved x/y.
- `POPreview` — preview grouping PO sebelum approval.
- `ActionDialog` — dialog dengan loading, reason input, destructive label.
- `AuditTimeline` — timeline audit trail.
- `AttachmentList` — list attachment dengan preview/delete.
- `RequestItemForm` — accordion per item untuk create/edit.
- `CheckItemForm` — form validasi per item.
- `FilterDrawer` — drawer filter list.

## 9. Notification

Menggunakan `openNotification` dari `src/api/notification.js` untuk konsistensi:

```js
import { openNotification } from '@/api/notification'

// Sukses
openNotification({ message: 'PR berhasil dibuat', variant: 'success' })

// Error
openNotification({ message: error.message, variant: 'error' })
```

Notistack juga tersedia global, tetapi `openNotification` lebih sesuai pola repository.

## 10. Auth & Middleware

### NextAuth
- Credentials provider → `${NEXT_APP_API_URL}/auth/login`
- Access token backend disimpan di JWT/session.
- Session strategy JWT, default 24 jam.

Referensi: `src/utils/authOptions.js`

### Axios Client
- Base URL: `NEXT_APP_API_URL` atau `NEXT_PUBLIC_API_URL`
- Token dari session, `Authorization: Bearer`
- 401 → redirect ke login
- Timeout 30s (default), 300s (export/download)

Referensi: `src/utils/axios.js`

### Middleware
- Route selain public route wajib token.
- Root redirect ke `/home` atau `/login`.

Referensi: `nextjs/middleware.js`

### AuthGuard
- Saat ini **dinonaktifkan** di `DashboardLayout`.
- Proteksi route bergantung pada middleware + backend permission.
- PRD merekomendasikan mengaktifkan kembali AuthGuard untuk route transaksi.

## 11. Offline Behavior

- PWA/service worker **dinonaktifkan** (`middleware.js:7-25`).
- Generic offline request queue tersedia (`src/utils/axios.js:72-92`).
- PR mutation **wajib** `skipOfflineQueue: true`.
- Draft autosave lokal dapat menjadi fase lanjutan (terpisah dari generic queue).
- List/detail boleh membaca cache jika diperlukan.

## 12. Electron

- Aplikasi juga berjalan di Electron (desktop).
- Next.js server dijalankan di dalam Electron.
- PR wajib diuji pada browser dan Electron.
- Perhatian: upload/download/print/attachment preview.

Referensi: `nextjs/electron/main.js`, `nextjs/build-electron.js`

## 13. Build & Deploy

- Dev: port 3005
- Build: `next build` (standalone)
- Deploy: GitHub Actions → AWS EC2 → PM2
- Lint: `next lint`

PRD menambahkan:
- Test runner (Vitest/Playwright) sebagai dependency baru.
- CI wajib jalankan lint + test sebelum deploy.