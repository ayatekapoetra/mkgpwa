# PRD Checker PIT (Next.js)

## Ringkasan
Implementasi fitur **Checker PIT** di web Next.js dengan parity terhadap flow mobile: list group, create ritase, hitung rit (counter), detail group, edit ritase, serta sync online-first dengan fallback lokal.

Target halaman web:
- URL: `http://localhost:3005/daily-checker-pit`
- Route file: `src/app/(dashboard)/(mining)/daily-checker-pit/page.js`
- View root: `src/views/operational/mining/daily-checker-pit/index.js`

Tujuan utama:
- Menjaga konsistensi data ritase PIT lintas perangkat.
- Menyediakan pengalaman operasional yang tetap berjalan saat jaringan tidak stabil.
- Menstandarkan grouping scope, status sinkronisasi, dan lifecycle data.

## Scope Fitur
Dalam scope:
- Halaman list group ritase PIT.
- Halaman create ritase PIT.
- Halaman hitung rit per group.
- Halaman detail group + daftar ritase.
- Halaman edit ritase.
- Mekanisme sync from server dan sync to server.

## Standar Layout dan Komponen Existing
Gunakan pola existing dashboard agar konsisten dengan halaman operasional lain:
- `Breadcrumbs` dari `src/components/@extended/Breadcrumbs.js` dengan mode `custom`.
- `MainCard` sebagai wrapper konten utama (header action + body list).
- `filter.js` model `SwipeableDrawer` seperti pola `src/views/operational/daily-equipment-activity/filter.js`.
- Tombol aksi utama di header card: `Filter`, `Sync`, `Tambah`, dan aksi kontekstual lain.
- Struktur page shell: route `page.js` tipis yang hanya me-render view index.

Di luar scope:
- Refactor besar endpoint backend di luar kontrak ritase PIT.
- Perubahan bisnis rule sampling stockpile.

## Persona dan Kebutuhan
- **Checker lapangan**: input cepat, minim hambatan, tetap bisa kerja saat offline.
- **Pengawas**: melihat status pending/synced per group untuk keputusan operasional.

## Grouping Scope (Final)
Key group PIT harus konsisten di list/detail/hitung-rit:

`date_ops + shift_id + excavator_id + startpit_id + material_id`

Catatan:
- `date_ops` distandarkan ke `YYYY-MM-DD`.
- Semua ID dibandingkan sebagai string di sisi frontend.

## User Flow
1. User membuka list Checker PIT dan melihat group berdasarkan key final.
2. User create ritase baru (termasuk `seq`) dari form create.
3. User masuk ke hitung-rit untuk group tertentu lalu increment/decrement ritase per dumptruck.
4. User membuka detail group untuk melihat daftar ritase dan status sync.
5. User edit data ritase saat diperlukan.
6. User melakukan sync dari server atau kirim pending ke server.

## Functional Requirements
1. List menampilkan group ritase PIT berdasarkan key final.
2. Create menyimpan ritase baru dengan field penting: `date_ops`, `shift_id`, `excavator_id`, `dumptruck_id`, `material_id`, `startdriver_id`, `startpit_id`, `seq`, `starttime`, `status`.
3. Hitung-rit hanya memproses ritase dalam scope group aktif.
4. Increment membuat ritase baru dari template ritase terakhir dumptruck (dengan `starttime` terbaru).
5. Decrement menghapus ritase terbaru dalam group dumptruck (aturan minimum mengikuti implementasi PIT: tidak kurang dari 1 entry seed per dumptruck di group).
6. Detail menampilkan statistik `total`, `pending`, `synced`.
7. Edit ritase menandai data lokal `PENDING` untuk disinkronkan ulang.

## Non-Functional Requirements
- UI responsif desktop/tablet minimum 1280px dan fallback mobile web.
- Error handling aman untuk HTTP 5xx tanpa kehilangan data lokal.
- Semua operasi tulis punya feedback status (`SYNCED`, `PENDING`, `CONFLICT`).

## Sync State Machine
Status data lokal:
- `PENDING`: belum berhasil dikirim ke server.
- `SYNCED`: sudah tersinkron.
- `CONFLICT`: terdeteksi konflik (server/duplikasi) dan perlu resolusi.

Transisi utama:
- Create/Update/Delete saat online sukses -> `SYNCED`.
- Create/Update/Delete saat offline/gagal jaringan -> simpan lokal `PENDING`.
- Bulk sync berhasil -> `PENDING -> SYNCED`.
- Bulk sync konflik -> `PENDING -> CONFLICT` atau `SYNCED + conflict flag` sesuai respons backend.

## API Contract (Backend)
Endpoint utama:
- `GET /ritase/pit`
- `POST /ritase/pit`
- `PUT /ritase/pit/:id`
- `DELETE /ritase/pit/:id`
- `POST /ritase/pit/bulk-sync`
- `GET /ritase/pit/by-ritase-pit-id/:ritase_pit_id`
- `GET /ritase/pit/unmatched` (untuk kebutuhan lintas fitur)

Kontrak penting:
- PIT create/update menerima field `seq`.
- Filter list server mendukung minimal: `date_ops`, `shift_id`, `cabang_id`, `excavator_id`, `startpit_id`, `material_id`, `aktif`.
- Delete by `ritase_pit_id` UUID harus stabil untuk online-first flow.

## UX Notes
- Tampilkan badge status sync di list group dan detail.
- Tampilkan info scope aktif di hitung-rit: tanggal, shift, excavator, pit, material.
- Sediakan aksi cepat: `Sync from Server`, `Sync Pending`, `Unsync Shift` (opsional mengikuti policy tim).

## Acceptance Criteria
1. Grouping list/detail/hitung-rit konsisten dengan key PIT final.
2. Create ritase PIT di web menyimpan `seq` dan field inti dengan benar.
3. Increment/decrement di hitung-rit hanya mempengaruhi group aktif.
4. Saat offline, create/update/delete tetap tersimpan sebagai `PENDING`.
5. Setelah bulk sync sukses, status pending berubah ke synced.
6. Detail menampilkan angka `total/pending/synced` yang sesuai data lokal terbaru.
