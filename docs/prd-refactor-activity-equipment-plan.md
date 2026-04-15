# PRD - Refactor Daily Equipment Activity Create Form (Load Data Terakhir)

## Latar Belakang
Halaman create `daily-equipment-activity` mengalami penurunan performa saat mode **Load Data Terakhir** memuat data dalam jumlah besar (contoh 100 baris). Saat ini setiap baris langsung me-render komponen form berat (autocomplete/select kompleks), sehingga initial render lambat dan UI terasa berat.

## Problem Statement
- Initial load lambat ketika `items` dari data terakhir berjumlah besar.
- Semua field interaktif dirender sekaligus meskipun user belum perlu mengedit semua baris.
- UX kurang responsif pada device dengan resource terbatas.

## Tujuan
- Mengurangi beban render awal pada mode **Load Data Terakhir**.
- Menampilkan data awal dalam format ringan (text-only preview).
- Tetap mempertahankan kemampuan edit detail saat dibutuhkan.

## Ruang Lingkup
Perubahan fokus di:
- `src/views/operational/daily-equipment-activity/CreateFormPage.js`

Mencakup:
- Perilaku tampilan `FieldArray` saat `loadMode === 'last'`.
- Menambahkan mode preview text per baris.
- Menambahkan aksi edit per baris dan edit semua baris.

Tidak mencakup:
- Perubahan endpoint API.
- Perubahan payload submit.
- Perubahan validasi bisnis utama.

## Solusi yang Diusulkan
1. Saat data terakhir selesai dimuat, default tampilan menjadi **text-only preview** untuk setiap row.
2. Sediakan tombol:
   - **Edit** per baris untuk membuka form detail baris tersebut.
   - **Edit Semua** untuk menampilkan seluruh form detail (opsional, on-demand).
3. Saat baris tidak dalam mode edit, komponen berat tidak dirender.
4. Pada mode manual, perilaku lama (form penuh + add/remove) tetap dipertahankan.

## User Flow
1. User pilih cabang/ctg/shift lalu klik **Load Data Terakhir**.
2. Sistem load data dan menampilkan daftar ringkas per row (text-only).
3. User bisa:
   - klik **Edit** di row tertentu jika perlu ubah sebagian,
   - klik **Edit Semua** jika ingin ubah massal.
4. User submit data seperti biasa.

## Acceptance Criteria
1. Pada `loadMode = last`, default row tampil sebagai preview text, bukan full form.
2. Render awal setelah load 100 row terasa lebih ringan dibanding sebelumnya.
3. Tombol **Edit** per row menampilkan full form untuk row tersebut.
4. Tombol **Edit Semua** menampilkan full form untuk seluruh row.
5. Mode manual tetap berfungsi seperti sebelumnya (add/remove row).
6. Submit tetap menggunakan payload yang sama dengan implementasi existing.

## Risiko dan Mitigasi
- Risiko: user bingung karena field tidak langsung terlihat.
  - Mitigasi: label tombol jelas (`Edit`, `Edit Semua`, `Sembunyikan`).
- Risiko: state edit row tidak sinkron saat mode berpindah.
  - Mitigasi: reset state preview/edit ketika mode berganti.

## Dampak Teknis
- Perubahan hanya di sisi UI rendering.
- Tidak ada migrasi data atau perubahan kontrak API.

## Todo List Implementasi
- [x] Tambahkan state UI untuk mengelola preview/edit row pada mode `last`.
- [x] Tambahkan UI ringkas (text-only) untuk setiap row di `FieldArray` saat mode `last`.
- [x] Tambahkan aksi `Edit` per row.
- [x] Tambahkan aksi `Edit Semua` dan toggle `Sembunyikan Detail`.
- [x] Pastikan mode `manual` tetap mempertahankan perilaku add/remove row.
- [x] Pastikan submit tetap berjalan pada kombinasi row preview dan row edit.
- [ ] Uji skenario data besar (>=100 row) untuk memastikan load awal lebih ringan.
