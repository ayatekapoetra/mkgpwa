# 01 — Roles & Permissions

## 1. Model Hak Akses

Hak akses menggunakan tabel **`sys_accesspermission`** dengan submenu canonical `/purchasing-request`. Tidak ada lagi role hard-coded di controller.

### Tabel terkait

| Tabel | Model | Fungsi |
|---|---|---|
| `sys_accesspermission` | `App/Models/Setting/SysAccessPermission` | Matrix user × submenu × action |
| `sys_submenupermission` | `App/Models/Setting/SysSubMenuPermission` | Daftar submenu (URL, name, aktif) |
| `sys_menupermission` | `App/Models/Setting/SysMenuPermission` | Daftar menu utama |

### Kolom `sys_accesspermission`

| Kolom | Tipe | Fungsi |
|---|---|---|
| `user_id` | int | User yang diberi akses |
| `menu_id` | int | Menu utama |
| `submenu_id` | int | Submenu (link ke `sys_submenupermission.id`) |
| `nmuser` | string | Denormalized nama user |
| `nmsubmenu` | string | Denormalized nama submenu |
| `read` | enum `Y`/`N` | Bisa melihat |
| `insert` | enum `Y`/`N` | Bisa membuat |
| `update` | enum `Y`/`N` | Bisa mengubah |
| `remove` | enum `Y`/`N` | Bisa menghapus |
| `accept` | enum `Y`/`N` | Reserved (workflow berikutnya) |
| `validate` | enum `Y`/`N` | Bisa validasi/check purchasing |
| `approve` | enum `Y`/`N` | Bisa approval final |
| `aktif` | enum `Y`/`N` | Record aktif |

### Aksi yang dipetakan

```text
read, insert, update, remove, validate, approve, accept
```

## 2. Sumber Kebenaran Permission

`sys_accesspermission` adalah satu-satunya sumber permission. Tidak ada override berdasarkan `usertype`, termasuk untuk administrator dan developer.

Aturan deny-by-default:

- Submenu tidak ditemukan → seluruh aksi ditolak (`source='missing_submenu'`).
- Access row user tidak ditemukan atau tidak aktif → seluruh aksi ditolak (`source='missing_access'`).
- Access row ditemukan → setiap aksi mengikuti nilai kolom `Y`/`N` (`source='access_row'`).
- Tidak ada fallback role legacy.

## 3. Permission Service

Buat `PurchaseRequestPermissionService` mengikuti `PengajuanDanaPermissionService`.

### `resolve(user)` → access object

```js
{
  permissions: {
    read: true,
    insert: true,
    update: true,
    remove: true,
    validate: true,
    approve: true,
    accept: false
  },
  override: true,
  source: 'access_row' | 'missing_access' | 'missing_submenu',
  submenu_id: 123,
  access_id: 456
}
```

### Algoritma

1. Cari `sys_submenupermission` dengan URL/name Purchasing Request dan `aktif='Y'`.
2. Cari `sys_accesspermission` dengan `user_id=user.id`, `submenu_id`, `aktif='Y'`.
3. Jika ditemukan → return nilai setiap kolom akses, `source='access_row'`.
4. Jika tidak ditemukan → return seluruh permission false.

### `normalize(value)`

```text
true / 1 / 'Y' / 'true' → true
false / 0 / 'N' / 'false' / null / undefined / '' → false
```

## 4. Feature Permissions (Level Modul)

Digunakan untuk menampilkan/menyembunyikan elemen UI global (menu, tombol create).

```js
{
  can_read: permissions.read,
  can_insert: permissions.insert,
  can_update: permissions.update,
  can_remove: permissions.remove,
  can_validate: permissions.validate,
  can_approve: permissions.approve,
  can_rollback: permissions.validate || permissions.approve,
  can_upload_attachment: permissions.update || permissions.insert,
  can_print: permissions.read,
  can_export: permissions.read
}
```

## 5. Document Permissions (Level Dokumen)

Dihitung per PR berdasarkan status, ownership, dan scope organisasi.

```js
{
  can_read: permissions.read,
  can_update: permissions.update && canEditStatus(status, isOwner, override),
  can_remove: permissions.remove && canDeleteStatus(status, isOwner, override),
  can_validate: permissions.validate && status === 'active',
  can_approve: permissions.approve && status === 'approved',
  can_rollback_validation: permissions.validate && ['active', 'approved'].includes(status),
  can_rollback_approval: permissions.approve && ['approved', 'finish'].includes(status),
  can_upload_attachment: (permissions.update || permissions.insert) && canAttachStatus(status, isOwner, override),
  can_print: permissions.read,
  can_export: permissions.read
}
```

### Aturan status × action

| Status | update | remove | validate | approve | rollback | attachment |
|---|---|---|---|---|---|---|
| `draft` | owner/admin | owner/admin | — | — | — | owner/admin |
| `active` | owner/admin (jika belum ada item tervalidasi) | owner/admin (jika belum ada item tervalidasi) | `validate` permission | — | admin | owner/admin |
| `approved` | — | — | — | `approve` permission | admin | — |
| `finish` | — | — | — | — | admin | — |

### Ownership rule

- `isOwner = Number(document.createdby) === Number(user.id)`
- Ownership tidak menggantikan permission pada access row.
- Jika pembatasan owner diperlukan, aturan tersebut diterapkan setelah permission tabel dan tidak berdasarkan role.

## 6. Multi-Business Scoping

Selain permission, akses data dibatasi berdasarkan organisasi user:

### Bisnis
- User hanya dapat melihat PR pada `bisnis_id` yang diizinkan.
- List default ke `user.bisnis_id` jika client tidak mengirim filter.
- Akses lintas bisnis adalah grant organisasi terpisah dan tidak berasal dari `usertype`.

### Cabang
- User hanya dapat melihat PR pada `cabang_id` yang diizinkan.
- Jika user tidak punya cabang assignment, batasi ke cabang PR yang dibuat oleh user yang sama bisnis.

### Gudang
- Pilihan gudang saat create/edit dibatasi berdasarkan cabang yang dipilih.
- Master barang autocomplete dibatasi berdasarkan bisnis.
- Master supplier autocomplete dibatasi berdasarkan bisnis.
- Master equipment autocomplete dibatasi berdasarkan cabang.

### Implementasi

Backend wajib memfilter:

```sql
WHERE ro.bisnis_id IN (SELECT bisnis_id FROM user_business_grants WHERE user_id = ?)
AND ro.cabang_id IN (SELECT cabang_id FROM user_cabang_grants WHERE user_id = ?)
```

Jika tabel grant belum ada, gunakan `user.bisnis_id` dan `user.cabang_id` langsung dari `VUser`.

## 7. Matriks Permission × Persona

| Aksi | Requester | Purchasing | Approver | Administrator | Viewer |
|---|---|---|---|---|---|
| Lihat list | ✓ (miliknya) | ✓ (active) | ✓ (approved) | ✓ (semua) | ✓ (sesuai scope) |
| Lihat detail | ✓ (miliknya) | ✓ | ✓ | ✓ | ✓ |
| Create draft | ✓ | ✓ | — | ✓ | — |
| Submit draft | ✓ (miliknya) | ✓ | — | ✓ | — |
| Edit draft | ✓ (miliknya) | — | — | ✓ | — |
| Edit active (sebelum validasi) | ✓ (miliknya) | — | — | ✓ | — |
| Tambah/hapus item draft | ✓ (miliknya) | — | — | ✓ | — |
| Validasi item | — | ✓ | — | ✓ | — |
| Approve + create PO | — | — | ✓ | ✓ | — |
| Upload attachment | ✓ (miliknya, draft/active) | ✓ (active) | — | ✓ | — |
| Delete attachment | ✓ (miliknya, draft) | ✓ (active) | — | ✓ | — |
| Rollback | — | — | — | ✓ | — |
| Delete PR | ✓ (draft/active belum validasi) | — | — | ✓ | — |
| Print PDF | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export Excel | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lihat audit trail | ✓ (miliknya) | ✓ | ✓ | ✓ | ✓ |

## 8. API Endpoint Permission

Backend mengembalikan permission pada:

```text
GET /api/scm/purchase-requests/permissions       (feature-level)
GET /api/scm/purchase-requests/:prId/permissions (document-level)
```

Response:

```json
{
  "diagnostic": {
    "ver": "3.1",
    "error": false
  },
  "data": {
    "can_read": true,
    "can_insert": true,
    "can_update": true,
    "can_remove": false,
    "can_validate": false,
    "can_approve": false,
    "can_rollback": false,
    "can_upload_attachment": true,
    "can_print": true,
    "can_export": true,
    "override": false,
    "source": "access_row"
  }
}
```

## 9. Menu & Submenu Setup

Backend harus menambahkan record:

```sql
-- sys_menupermission
INSERT INTO sys_menupermission (name, url, icon, aktif, urut)
VALUES ('SCM', '/scm', 'shopping', 'Y', 10);

-- sys_submenupermission
INSERT INTO sys_submenupermission (menu_id, name, url, icon, aktif, urut)
VALUES (:menu_id, 'Purchasing Request', '/purchasing-request', 'shopping', 'Y', 11);
```

Frontend menu diambil dari `/api/menu/user-menu` (dinamis), bukan static menu. Lihat `nextjs/src/api/menu.js`.

## 10. Keputusan yang Sudah Ditetapkan

- Tidak ada fallback role legacy. Jika record `sys_accesspermission` tidak ada, akses ditolak.
- Rollback validasi mengikuti kolom `validate`; rollback approval mengikuti kolom `approve`.
- Administrator/developer juga wajib mempunyai access row aktif.
- `accept` dicadangkan, tidak digunakan di MVP.
- Frontend hanya menggunakan permission untuk menampilkan/menyembunyikan UI; backend tetap memvalidasi setiap request.
