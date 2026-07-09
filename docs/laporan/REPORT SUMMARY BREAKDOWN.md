# Report Summary Breakdown

## Ringkasan
Halaman `nextjs` pada URL `/laporan/summary-breakdown` menampilkan laporan ringkas breakdown equipment dalam format tabel dengan filter interaktif dan download PDF.

Halaman ini hanya untuk kebutuhan reporting dan tidak menyediakan aksi edit data.

## Tujuan UX
- Memudahkan user melihat breakdown berdasarkan rentang waktu tertentu.
- Menyediakan ringkasan yang lebih sederhana daripada detail breakdown dan work order.
- Memastikan hasil layar dan hasil PDF konsisten terhadap filter aktif.

## Lokasi Implementasi
- Route page: `nextjs/src/app/(dashboard)/laporan/summary-breakdown/page.js`
- Screen utama: `nextjs/src/views/laporan/summary-breakdown/index.js`
- Komponen filter: `nextjs/src/views/laporan/summary-breakdown/filter.js`
- Komponen tabel/list: `nextjs/src/views/laporan/summary-breakdown/list.js`
- API helper: `nextjs/src/api/summary-breakdown.js`

## Sumber Data
Data diambil dari backend melalui endpoint laporan khusus:
- `GET /laporan/summary-breakdown/list`
- `GET /laporan/summary-breakdown/download`

## Struktur Halaman
Halaman mengikuti pola view laporan existing:
1. `MainCard` sebagai container utama.
2. Action kanan atas:
   - tombol filter
   - tombol download PDF
3. Filter ditampilkan dalam `SwipeableDrawer`.
4. Tabel tampil di area utama card.

## Filter UI
Field filter:
1. `Date Range`
   - `startdate`
   - `enddate`
   - tipe input date
2. `Lokasi Kerja`
   - multi select
   - label option: nama lokasi, dengan keterangan cabang
3. `Equipment`
   - multi select
   - label option: `kode - model`
4. `Status`
   - select option: `All`, `Open`, `Close`
5. `Problem Issue`
   - text input

## Kolom Tabel
1. `No`
2. `Location`
   - baris 1: nama lokasi
   - baris 2: nama cabang
3. `Breakdown`
4. `Ready`
5. `Durasi`
6. `HM/KM`
7. `Type`
8. `ID Unit`
9. `Problem`
10. `Status`

## Aturan Tampilan
1. `Location` tampil multi-line.
2. `Problem` tampil sebagai teks gabungan issue dengan separator koma.
3. `Status` tampil sebagai chip:
   - `Open`
   - `Close`
4. `Durasi` untuk data `open` ditampilkan `-`.
5. `Ready` untuk data yang belum selesai ditampilkan `-`.

## State dan Parameter Frontend
Parameter state minimum:

```js
{
  page: 1,
  perPage: 25,
  startdate: '',
  enddate: '',
  lokasi_ids: [],
  equipment_ids: [],
  status: '',
  problem_issue: ''
}
```

Serialisasi query:
- `lokasi_ids` dikirim sebagai comma-separated IDs.
- `equipment_ids` dikirim sebagai comma-separated IDs.

## Download PDF
Tombol download memanggil endpoint backend dengan query filter aktif.

Perilaku download:
1. menggunakan `axios` dengan `responseType: 'blob'`
2. membuka file PDF di tab baru atau mengunduh file
3. mengambil semua data sesuai filter, tidak mengikuti pagination tabel

## Perilaku Data
1. Tabel menggunakan pagination backend.
2. Reset filter mengembalikan seluruh filter ke nilai default.
3. Jika data kosong, tampilkan empty state sederhana.
4. Loading state mengikuti pola existing di project.

## Kesesuaian Desain
Halaman harus mengikuti komponen dan pola yang sudah ada di project:
- `MainCard`
- `SwipeableDrawer`
- komponen icon button existing
- MUI table / pagination

Tidak perlu membuat visual language baru. Gunakan tampilan yang konsisten dengan halaman laporan lain.

## Kriteria Penerimaan Frontend
1. Halaman dapat dibuka di `/laporan/summary-breakdown`.
2. Filter dapat diubah tanpa error.
3. Tabel menampilkan hasil sesuai filter.
4. Download PDF berhasil dan mengikuti filter aktif.
5. Label equipment pada filter tampil sebagai `kode - model`.
6. Layout tetap nyaman di desktop dan tetap bisa digunakan di layar kecil.

## Catatan Teknis
- Karena komponen equipment existing bersifat single-select, fitur ini boleh menggunakan komponen multi-select baru khusus untuk laporan summary breakdown.
- Query parameter harus dijaga tetap kompatibel dengan backend list dan download.
