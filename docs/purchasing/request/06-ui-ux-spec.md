# 06 — UI/UX Spec

## 1. Design System

Mengikuti theme MUI repository (`src/themes/`):

- Font: Poppins
- Border radius: 8px
- Breakpoints: sm 768, md 1024, lg 1266, xl 1440
- Light/Dark mode (auto/switch)
- Color preset

### Status Colors

| Status | Label | Color | Chip Variant |
|---|---|---|---|
| `draft` | Draft | `grey.500` | `default` |
| `active` | Menunggu Validasi | `warning.main` | `warning` |
| `approved` | Menunggu Approval | `info.main` | `info` |
| `finish` | Selesai | `success.main` | `success` |

### Prioritas Colors

| Prioritas | Label | Color |
|---|---|---|
| `P1` | Tinggi | `error.main` |
| `P2` | Sedang | `warning.main` |
| `P3` | Rendah | `success.main` |

## 2. List Page (`/purchasing-request`)

### Layout

```text
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: SCM / Purchasing Request               │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ MainCard                                        │ │
│ │ ┌──────────────────────────────────────────┐    │ │
│ │ │ Header: Title + Badge + [Filter] [Create]│    │ │
│ │ └──────────────────────────────────────────┘    │ │
│ │ ┌──────────────────────────────────────────┐    │ │
│ │ │ Table (desktop) / Cards (mobile)         │    │ │
│ │ │ ...                                      │    │ │
│ │ └──────────────────────────────────────────┘    │ │
│ │ ┌──────────────────────────────────────────┐    │ │
│ │ │ Pagination                               │    │ │
│ │ └──────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Header
- Title: "Purchasing Request"
- Badge: jumlah pending validation + pending approval
- Tombol "Create" (jika `can_insert`)
- Tombol "Filter" (jika `can_read`)

### Filter Drawer

Dibuka dari header. Field:

| Field | Komponen | Default |
|---|---|---|
| Bisnis | Autocomplete | User bisnis |
| Cabang | Autocomplete (dependent bisnis) | Semua |
| Gudang | Autocomplete (dependent cabang) | Semua |
| Requester | Autocomplete | Semua |
| Status | Multi-select chips | Semua |
| Prioritas | Multi-select chips | Semua |
| Periode | Date range picker | Bulan ini |
| Kode | Text input | — |
| Deskripsi | Text input | — |
| Search | Text input (global) | — |

Sticky footer: "Reset" | "Apply".

### Table Desktop

Kolom:

| # | Kolom | Sortable | Width | Content |
|---|---|---|---|---|
| 1 | Kode | ✓ | 160px | Link ke detail |
| 2 | Tanggal | ✓ | 120px | `date_ro` |
| 3 | Requester | ✗ | 140px | User name |
| 4 | Bisnis/Cabang/Gudang | ✗ | 200px | Stacked |
| 5 | Prioritas | ✓ | 100px | Chip |
| 6 | Status | ✓ | 140px | StatusChip + progress |
| 7 | Items | ✗ | 80px | `x/y` active |
| 8 | Total | ✓ | 120px | `total_ro` formatted |
| 9 | Attachment | ✗ | 60px | Icon if any |
| 10 | Aksi | ✗ | 120px | View, Edit, Delete |

Behavior:
- Horizontal scroll jika kolom melebihi viewport.
- Row click → navigasi ke detail.
- Aksi: View (always), Edit (if `can_update`), Delete (if `can_remove`).
- Sort indicator pada header.
- Striped rows.
- Sticky header.

### Card List Mobile

Setiap card:

```text
┌───────────────────────────────────────┐
│ [StatusChip]              [Prioritas] │
│ Kode PR                              │
│ Tanggal • Requester                  │
│ Bisnis / Cabang / Gudang              │
│ Items: x/y  •  Total: Rp 1.250.000  │
│ 📎 3 attachment                      │
│ ┌────────┐ ┌────────┐ ┌──────────┐  │
│ │ View   │ │ Edit   │ │ Delete   │  │
│ └────────┘ └────────┘ └──────────┘  │
└───────────────────────────────────────┘
```

### Empty State

- Illustration/icon.
- Message: "Belum ada Purchasing Request" / "Tidak ada hasil untuk filter ini".
- CTA: "Buat PR Pertama" (jika `can_insert`).

### Permission Error State

Jika `can_read = false`:
- Tampilkan info "Anda tidak memiliki akses ke modul ini".
- Jangan panggil list endpoint.

### Loading State

- Skeleton rows (desktop) atau skeleton cards (mobile).
- Filter drawer disabled saat loading.

## 3. Create Page (`/purchasing-request/create`)

### Layout

```text
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: SCM / PR / Create                      │
│                                                     │
│ ┌─────────────────────────────────────┬───────────┐ │
│ │ Form Card                           │ Summary   │ │
│ │                                     │ Sidebar   │ │
│ │ ┌─────────────────────────────────┐ │           │ │
│ │ │ Header Section                   │ │ Total:   │ │
│ │ │ Bisnis, Cabang, Gudang,          │ │ Rp 0     │ │
│ │ │ Tanggal, Prioritas, Deskripsi    │ │           │ │
│ │ └─────────────────────────────────┘ │ Items: 0 │ │
│ │                                     │           │ │
│ │ ┌─────────────────────────────────┐ │ [Draft]  │ │
│ │ │ Items Section                    │ │ [Submit] │ │
│ │ │ [+ Tambah Item]                  │ │           │ │
│ │ │ ┌─────────────────────────────┐  │ │           │ │
│ │ │ │ Item 1 (Accordion)          │  │ │           │ │
│ │ │ └─────────────────────────────┘  │ │           │ │
│ │ │ ┌─────────────────────────────┐  │ │           │ │
│ │ │ │ Item 2 (Accordion)          │  │ │           │ │
│ │ │ └─────────────────────────────┘  │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ │                                     │           │ │
│ │ ┌─────────────────────────────────┐ │           │ │
│ │ │ Attachment Section               │ │           │ │
│ │ │ [Drag & Drop / Browse]           │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ └─────────────────────────────────────┴───────────┘ │
└─────────────────────────────────────────────────────┘
```

### Header Fields

| Field | Komponen | Validasi |
|---|---|---|
| Bisnis | Autocomplete (disabled if user 1 bisnis) | Wajib |
| Cabang | Autocomplete (dependent bisnis) | Wajib |
| Gudang | Autocomplete (dependent cabang) | Wajib |
| Tanggal | DatePicker | Wajib, tidak di masa lalu |
| Prioritas | Select | Wajib, default `P3` |
| Deskripsi | TextField multiline | Opsional |

### Item Accordion

Setiap item berupa Accordion dengan summary:

```text
┌─────────────────────────────────────────────────────┐
│ ▼ Item 1: Filter Oli (2 PCS)           [Delete] [⋮] │
├─────────────────────────────────────────────────────┤
│ Barang: [Autocomplete barcode/name]                 │
│ Equipment: [Autocomplete] (opsional)               │
│ Qty Request: [Number] Satuan: [auto/read-only]      │
│ Deskripsi: [Text]                                   │
└─────────────────────────────────────────────────────┘
```

Validasi Yup per item:
- `barang_id` atau `coa_id` wajib.
- `qty_req` > 0, max 4 decimal.
- `stn` wajib (auto-filled dari master barang).

### Summary Sidebar (Sticky)

- Total nilai (preview, 0 jika belum divalidasi)
- Jumlah item
- Tombol "Simpan Draft" (jika `can_insert`)
- Tombol "Submit" (jika `can_insert`)
- Tombol "Cancel" (kembali ke list)

### Attachment

- `DropZoneFormik`
- Format: JPG, PNG, PDF, DOCX, XLSX
- Maks 10 MB per file
- Maks 10 file
- Preview thumbnail (untuk image) atau icon (untuk PDF/Office)
- Remove button per file

### Form Behavior

- Autosave draft setiap 30 detik jika ada perubahan (opsional, fase lanjutan).
- Tombol "Simpan Draft": create dengan `status='draft'`.
- Tombol "Submit": create dengan `status='active'` langsung.
- Konfirmasi sebelum submit: "Submit PR? Dokumen akan masuk antrean validasi purchasing."
- Disable double-submit (loading state).
- Setelah sukses: redirect ke detail page.
- Setelah error: tampilkan error per field dan toast.

## 4. Detail Page (`/purchasing-request/[id]`)

Detail adalah pusat aksi dokumen. Semua workflow terjadi di sini.

### Layout

```text
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: SCM / PR / {kode}                       │
│                                                     │
│ ┌─────────────────────────────────────┬───────────┐ │
│ │ Main Card                           │ Action     │ │
│ │                                     │ Panel     │ │
│ │ ┌─────────────────────────────────┐ │ (Sticky)  │ │
│ │ │ Header                          │ │           │ │
│ │ │ Kode, Status, Prioritas         │ │ [Edit]    │ │
│ │ │ Requester, Tanggal              │ │ [Print]   │ │
│ │ │ Bisnis/Cabang/Gudang            │ │ [Export]  │ │
│ │ │ Deskripsi                        │ │ [Delete]  │ │
│ │ └─────────────────────────────────┘ │           │ │
│ │                                     │ [Validate]│ │
│ │ ┌─────────────────────────────────┐ │ [Approve]│ │
│ │ │ Progress                         │ │ [Rollback]│ │
│ │ │ Validated: 2/5  Approved: 0/5   │ │           │ │
│ │ │ ████████░░░░░░░░░░░░             │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ │                                     │           │ │
│ │ ┌─────────────────────────────────┐ │           │ │
│ │ │ Items Table/List                 │ │           │ │
│ │ │ ┌─────────────────────────────┐  │ │           │ │
│ │ │ │ Item 1: Filter Oli          │  │ │           │ │
│ │ │ │ Qty: 2 PCS (req)            │  │ │           │ │
│ │ │ │ Supplier: PT ABC            │  │ │           │ │
│ │ │ │ Harga: Rp 500.000           │  │ │           │ │
│ │ │ │ Status: ✓ Validated          │  │ │           │ │
│ │ │ │ [Validate] [Approve]         │  │ │           │ │
│ │ │ └─────────────────────────────┘  │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ │                                     │           │ │
│ │ ┌─────────────────────────────────┐ │           │ │
│ │ │ Attachments                     │ │           │ │
│ │ │ [file1.pdf] [file2.jpg]         │ │           │ │
│ │ │ [Upload]                        │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ │                                     │           │ │
│ │ ┌─────────────────────────────────┐ │           │ │
│ │ │ Purchase Orders                  │ │           │ │
│ │ │ PO #1: CBMTK-2608123            │ │           │ │
│ │ │ PO #2: CBMTK-2608124            │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ │                                     │           │ │
│ │ ┌─────────────────────────────────┐ │           │ │
│ │ │ Audit Timeline                   │ │           │ │
│ │ │ ● Created by Budi (10:00)       │ │           │ │
│ │ │ ● Submitted (10:05)              │ │           │ │
│ │ │ ● Validated by Purchasing (11:00)│ │           │ │
│ │ │ ● Approved by Manager (14:00)   │ │           │ │
│ │ └─────────────────────────────────┘ │           │ │
│ └─────────────────────────────────────┴───────────┘ │
└─────────────────────────────────────────────────────┘
```

### Header Section
- Kode PR (large, bold)
- StatusChip + prioritas chip
- Requester, tanggal, bisnis/cabang/gudang (stacked)
- Deskripsi

### Progress Section
- Bar 1: Validated `x/y`
- Bar 2: Approved `x/y`
- Color: validated=warning, approved=info, finish=success

### Items Section

#### Mode View (default)
- List item dengan:
  - Nama barang, kode, equipment
  - Qty req → qty acc (dengan panah jika berbeda)
  - Supplier (jika sudah divalidasi)
  - Harga, PPN, subtotal (jika punya permission)
  - Status item: Not Validated / Validated / Approved
  - Validator & approver name + timestamp
- Aksi per item sesuai permission:
  - `[Validate]` (jika `can_validate` dan item belum tervalidasi)
  - `[Approve]` (jika `can_approve` dan item sudah divalidasi belum di-approve)

#### Mode Validate (toggle)
- Default selection kosong agar tidak ada item yang diproses tanpa keputusan user.
- Toolbar menampilkan jumlah item terpilih, tombol "Pilih Semua", dan "Kosongkan".
- Setiap item yang belum divalidasi memiliki checkbox "Validasi".
- Hanya item terpilih yang berubah menjadi form editable:
  - Supplier autocomplete
  - Qty approved (number)
  - Currency select (IDR/USD)
  - Kurs (if USD)
  - Harga satuan
  - Diskon
  - PPN select (0/11)
  - Metode (tunai/kredit)
  - Catatan
  - Preview subtotal (real-time)
- Item yang sudah divalidasi tetap read-only.
- Bulk apply: pilih multiple item, apply supplier/PPN/metode yang sama.
- Item tidak terpilih tetap read-only dan tidak dikirim ke backend.
- Tombol aksi menampilkan "Validasi {n} Item" dan disabled jika selection kosong.

#### Mode Approve (toggle)
- Hanya item yang sudah divalidasi dan belum di-approve yang tampil.
- Default selection kosong.
- Checkbox multi-select per item, dilengkapi "Pilih Semua" dan "Kosongkan".
- Item yang tidak dipilih tidak diubah dan tidak menghasilkan PO.
- Preview PO grouping:
  ```text
  ┌─────────────────────────────────────┐
  │ Preview Purchase Order              │
  │                                     │
  │ Group 1: PT ABC (PPN 11%, IDR,      │
  │          Kredit)                    │
  │   - Filter Oli × 2 = Rp 1.000.000  │
  │   - PPN 11% = Rp 110.000            │
  │   - Total = Rp 1.110.000            │
  │                                     │
  │ Group 2: PT XYZ (PPN 0%, IDR, Tunai)│
  │   - Filter Bahan Bakar × 1 = ...    │
  │   - Total = Rp 500.000              │
  │                                     │
  │ Akan dibuat 2 Purchase Order        │
  │                                     │
  │ [Cancel] [Confirm & Approve]        │
  └─────────────────────────────────────┘
  ```
- Konfirmasi: "Approve {x} dari {y} item? PO hanya dibuat untuk item terpilih. Tindakan ini tidak dapat dibatalkan tanpa rollback admin."
- Disable double-click.

### Action Panel (Sticky Right)

Tombol ditampilkan berdasarkan `documentPermissions`:

| Tombol | Kondisi | Aksi |
|---|---|---|
| Edit | `can_update` | Redirect ke edit page |
| Print | `can_print` | Download PDF |
| Export | `can_export` | Download Excel (item-level) |
| Delete | `can_remove` | Confirm dialog → delete |
| Validate | `can_validate` | Toggle validate mode |
| Approve | `can_approve` | Toggle approve mode |
| Rollback | `can_rollback` (admin) | Rollback dialog |

### Rollback Dialog

```text
┌─────────────────────────────────────────┐
│ Rollback Purchasing Request            │
│                                         │
│ Target Status:                          │
│ ( ) Reset ke Active (reset validasi)    │
│ ( ) Reset ke Approved (reset approval)  │
│                                         │
│ Item yang direset:                       │
│ [✓] Item 1: Filter Oli                  │
│ [✓] Item 2: Filter Bahan Bakar         │
│ [ ] Item 3: Oli Mesin (sudah di-approve)│
│                                         │
│ Alasan (wajib):                          │
│ [Textarea]                              │
│                                         │
│ ⚠ PO yang akan dibatalkan:               │
│ - CBMTK-2608123                         │
│                                         │
│ [Cancel] [Confirm Rollback]             │
└─────────────────────────────────────────┘
```

### Audit Timeline

- Vertical timeline dengan icon per event.
- Event: create, submit, validate, approve, rollback, delete, attach.
- Actor, role, timestamp, reason (jika rollback).
- Expandable untuk lihat before/after snapshot.

## 5. Edit Page (`/purchasing-request/[id]/edit`)

Hanya untuk draft atau active (belum ada item tervalidasi).

- Layout sama dengan create, tapi pre-filled.
- Item yang sudah divalidasi tidak dapat diedit (read-only).
- Hanya item yang belum divalidasi yang dapat ditambah/dihapus/ubah.
- Tombol "Simpan" (update) dan "Submit" (jika draft).

## 6. Print PDF

- Dari halaman detail → tombol Print.
- Backend generate PDF, frontend download/buka di tab baru.
- Layout PDF:
  - Header: logo perusahaan, "PURCHASING REQUEST", kode, tanggal.
  - Info block: requester, bisnis, cabang, gudang, prioritas, status.
  - Tabel item: no, kode barang, nama, equipment, qty req, qty acc, satuan, supplier, harga, PPN, subtotal.
  - Footer: total, validator, approver, signature blocks.
  - Kolom harga hanya jika user punya permission `validate`/`approve`/admin.
  - Watermark status (Draft/Active/etc) jika perlu.

## 7. Export Excel

- Dari halaman list → tombol Export (menggunakan filter saat ini).
- Backend generate Excel, frontend download.
- Format: item-level (1 row per item PR).
- Streaming untuk dataset besar.
- Progress indicator jika background job.

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| < 768 (xs/sm) | Card list, single column form, no sticky sidebar (sticky bottom bar) |
| 768–1024 (md) | Table with horizontal scroll, 2-column form, sticky sidebar |
| > 1024 (lg+) | Full table, 2-column form, sticky sidebar |

### Mobile Form

```text
┌─────────────────────────────┐
│ Header (stacked)            │
│ Bisnis                      │
│ Cabang                      │
│ Gudang                      │
│ Tanggal                     │
│ Prioritas                   │
│ Deskripsi                   │
│                             │
│ Items (accordion)           │
│ [+ Tambah Item]            │
│                             │
│ Attachment                  │
│ [Drop zone]                 │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Simpan Draft] [Submit] │ │ (sticky bottom)
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Mobile Detail

- Action panel menjadi sticky bottom bar dengan icon buttons.
- Items menjadi card list.
- POPreview menjadi full-screen dialog.
- Audit timeline tetap vertical.

## 9. Micro-Interactions

- Hover row table → highlight + cursor pointer.
- Click row → navigate ke detail.
- StatusChip dengan dot indicator + pulse untuk pending.
- Progress bar dengan smooth transition.
- Toast notification setelah mutation sukses/error.
- Loading skeleton untuk detail (bukan spinner penuh).
- Confirmation dialog dengan destructive button merah untuk delete/rollback.
- Disable tombol selama mutation (loading + opacity).

## 10. Accessibility

- Semua tombol punya `aria-label`.
- Color bukan satu-satunya indikator status (selalu ada teks).
- Keyboard navigation: Tab antar item, Enter untuk submit.
- Focus visible pada interactive elements.
- Dialog trap focus.
- Screen reader: status chip dibaca sebagai "Status: Menunggu Validasi".
