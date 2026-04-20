# PRD Checker Stockpile (Next.js)

## Ringkasan
Implementasi fitur **Checker Stockpile** di web Next.js dengan parity terhadap flow mobile terbaru: create sebagai setup scope, hitung-rit sebagai owner counter, lifecycle unmatched (accept/delete), serta sync online-first dengan fallback lokal.

Target halaman web:
- URL: `http://localhost:3005/daily-checker-stockpile`
- Route file: `src/app/(dashboard)/(mining)/daily-checker-stockpile/page.js`
- View root: `src/views/operational/mining/daily-checker-stockpile/index.js`

Tujuan utama:
- Menjaga konsistensi group ritase stockpile lintas halaman.
- Menjamin proses operasional tetap berjalan saat offline.
- Menyatukan lifecycle unmatched dari PIT ke Stockpile.

## Scope Fitur
Dalam scope:
- List group stockpile.
- Create setup scope + seed dumptruck.
- Hitung-rit untuk increment/decrement per dumptruck.
- Detail group + statistik sync.
- Edit ritase stockpile.
- Unmatched list + accept/delete lifecycle.
- Sync from server + bulk sync pending.

## Standar Layout dan Komponen Existing
Ikuti pola UI dashboard existing agar familiar dan maintainable:
- `Breadcrumbs` (`src/components/@extended/Breadcrumbs.js`) dengan links custom.
- `MainCard` untuk container konten utama.
- Panel filter menggunakan `SwipeableDrawer` (pola file `filter.js` existing).
- Header action konsisten: `Filter`, `Sync`, `Tambah` serta action khusus unmatched.
- Route `page.js` tetap tipis dan delegasi ke view `index.js`.

Di luar scope:
- Perubahan desain bisnis DOM di backend.
- Refactor endpoint di luar ritase stockpile/pit unmatched.

## Grouping Scope (Final)
Key group stockpile final:

`date_ops + shift_id + material_id + stockpile_id + dom_id`

Aturan:
- Semua halaman (`list/detail/hitung-rit`) wajib menggunakan key yang sama.
- ID diperlakukan sebagai string di frontend.
- `date_ops` distandarkan `YYYY-MM-DD`.

## User Flow
1. User membuka list Checker Stockpile (group card by key final).
2. User membuka create untuk setup scope (`date_ops`, `shift`, `material`, `stockpile`, `dom`, `dumptruck`, `driver`).
3. Submit create menyimpan seed dumptruck pada scope, lalu tampil opsi:
   - `Tambah Dumptruck Lagi`
   - `Selesai` -> masuk hitung-rit.
4. Di hitung-rit, user increment/decrement ritase per dumptruck pada scope aktif.
5. User membuka detail untuk monitor data dan status sync.
6. Jika ada unmatched PIT, user membuka unmatch list lalu accept via modal atau hapus (soft cancel flow).

## Functional Requirements
1. Create tidak langsung menambah ritase; create berfungsi sebagai setup scope + seed dumptruck.
2. Hitung-rit adalah satu-satunya halaman yang menambah/mengurangi counter ritase.
3. Seed dumptruck tetap tampil di hitung-rit walaupun counter masih 0.
4. Decrement harus menghapus ritase terbaru menggunakan `ritase_stockpile_id` (UUID).
5. Detail menampilkan statistik `total/pending/synced` per scope group.
6. Unmatch list mendukung:
   - Accept unmatched PIT ke stockpile (dengan driver opsional).
   - Delete/Cancel unmatched (online-first, offline fallback).
7. Edit ritase menandai data lokal sebagai `PENDING`.

## Unmatched Lifecycle
Accept unmatched:
- Input minimum: `ritase_pit_id`, `stockpile_id`, `dumptruck_id`, `dom_id`.
- `enddriver_id` opsional.
- Backend membuat ritase stockpile dan update status match pit terkait.

Delete unmatched:
- Jika online: kirim delete/cancel ke backend.
- Jika offline/gagal: tandai lokal sebagai pending cancel untuk sinkronisasi berikutnya.

## Sync State Machine
Status minimum:
- `PENDING`
- `SYNCED`
- `CONFLICT`

Transisi:
- Create/update/delete online sukses -> `SYNCED`.
- Online gagal/offline -> simpan `PENDING`.
- Bulk sync berhasil -> `PENDING -> SYNCED`.
- Konflik server -> tandai `CONFLICT` (atau `SYNCED` + conflict flag sesuai backend).

## API Contract (Backend)
Endpoint utama stockpile:
- `GET /ritase/stockpile`
- `POST /ritase/stockpile`
- `PUT /ritase/stockpile/:id`
- `DELETE /ritase/stockpile/:id`
- `POST /ritase/stockpile/bulk-sync`
- `GET /ritase/stockpile/unmatched`
- `POST /ritase/stockpile/accept-unmatched`
- `GET /ritase/stockpile/by-ritase-stockpile-id/:ritase_stockpile_id`

Endpoint pendukung:
- `GET /ritase/unmatched` (list unmatched lintas ritase)
- `GET /ritase/dom` (open DOM)

Kontrak penting backend:
- Delete stockpile harus bisa resolve by UUID `ritase_stockpile_id`.
- Accept unmatched harus toleran `enddriver_id` null.
- Handler sample backend sudah mendukung variasi schema `sample_ids`/`sample_id`.

## Data Model Frontend (Minimum)
- `ritase_stockpile_id`, `server_id`
- `date_ops`, `shift_id`, `cabang_id`, `area`
- `stockpile_id`, `dumptruck_id`, `material_id`, `truck_type`, `enddriver_id`, `dom_id`
- `sample_ids[]`, `finishtime`, `status`, `kondisi_material`
- `sync_status`, `conflict`, `synced_at`, `matched_ritase_pit_id`

## Acceptance Criteria
1. List/detail/hitung-rit stockpile konsisten dengan grouping key final.
2. Create bertindak sebagai setup scope + seed dumptruck (bukan create ritase langsung).
3. Hitung-rit dapat increment/decrement ritase per dumptruck dalam scope aktif.
4. Offline create/update/delete tersimpan lokal `PENDING` tanpa kehilangan data.
5. Accept unmatched melalui modal berjalan normal dengan driver opsional.
6. Delete unmatched mendukung online delete dan offline pending cancel.
7. Bulk sync mengubah status pending sesuai hasil server dan menampilkan feedback ringkas.
