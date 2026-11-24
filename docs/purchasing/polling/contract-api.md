# Contract API — Pengiriman Purchase Order / Hermes

PRD handoff terpadu: [Hermes ERP WhatsApp Delivery](../PRD_Hermes_ERP_WhatsApp_Delivery.md).

Purchase Order dan Pengajuan Dana sama-sama hanya menyediakan **teks**, **teks + PDF**, dan **PDF saja**. Tidak ada native WhatsApp poll, voting, penerima hasil, atau rekomendasi keputusan. Pemantauan status dengan GET berkala tetap berjalan.

Nama folder/helper `polling`, event `purchase_order_poll.requested`, serta path legacy `/hooks/purchase-order-polls` dipertahankan untuk kompatibilitas kode/transport. Nama tersebut tidak mengaktifkan fitur voting.

## 1. Mode pengiriman

| `delivery.mode` | `pdf_documents` | `delivery.text` |
|---|---|---|
| `text` | Array kosong | Ringkasan teks nonkosong |
| `pdf_text` | Tepat satu PDF gabungan seluruh PO terpilih | Ringkasan teks nonkosong |
| `pdf` | Tepat satu PDF gabungan seluruh PO terpilih | `null` |

Semua mode memakai:

```json
{
  "sender_phone": null,
  "poll": null,
  "result_handling": {
    "send_result_to": null,
    "include_recommendation": false,
    "update_purchase_orders": false
  }
}
```

Mode `pdf_poll`, poll non-null, penerima hasil, dan rekomendasi ditolak. Backend tidak mengubah status PO melalui pengiriman ini.

Contoh lengkap: [teks + PDF](./request.example.json), [PDF saja](./request.pdf.example.json), [teks saja](./request.text.example.json). Skema [OpenAPI](./openapi.json) menjelaskan kontrak logis pengiriman ERP; dukungan Hermes deployed dijelaskan pada bagian 4.

## 2. Frontend dan API ERP

- `/purchasing-orders`: **Pilih Data** membuka checkbox dan **Preview (N)** membawa pilihan ke preview. Filter/pagination tidak menghapus pilihan; select-all hanya memengaruhi halaman aktif.
- `/purchasing-orders/preview`: memuat detail PO terbaru, maksimal empat request bersamaan. Seluruh PO harus termuat sebelum submit.
- Hanya input nomor penerima yang digunakan. `08…` dinormalisasi ke `+628…`, `628…` ke `+628…`; nomor internasional harus E.164.
- Pilihan disimpan pada key lokal `purchase-order-poll:v1:<user_id>`. Data lama dapat masih menyimpan sender, tetapi payload pengiriman selalu `sender_phone: null`.
- Reset hanya menghapus pilihan fitur ini untuk pengguna aktif.
- Dropdown mengirim mode yang dipilih ke backend; pilihan dokumen tidak dihapus otomatis.
- Browser tidak menerima token integrasi Hermes maupun token PDF service.

```text
POST /api/scm/purchase-orders/hermes-delivery
GET  /api/scm/purchase-orders/hermes-delivery/:request_id
```

Kedua endpoint memakai JWT pengguna. Submit memeriksa izin membaca; mode yang menyertakan PDF juga memerlukan izin mencetak. Status request hanya dapat dibaca pembuatnya.

POST menyertakan `Idempotency-Key` yang sama dengan `request_id`. Retry otomatis dan offline queue dinonaktifkan pada request browser untuk mencegah pengiriman ulang tak terkontrol.

## 3. Field utama payload ERP

| Field | Ketentuan |
|---|---|
| `schema_version` | `"1.1"` |
| `event` | `"purchase_order_poll.requested"`, nama legacy transport |
| `request_id` | UUID v4, sama dengan header idempotensi |
| `created_at` | Timestamp ISO 8601 |
| `recipient_phone` | E.164, satu-satunya nomor tujuan konten |
| `sender_phone`, `poll` | `null` |
| `delivery.mode` | Hanya `text`, `pdf_text`, `pdf` |
| `items` | Minimal satu PO, `po_id` numerik positif dan unik |
| `items[].request_date` | `YYYY-MM-DD` atau `null` |
| `items[].grand_total` | String nominal; frontend menggunakan presisi dua desimal |
| `items[].currency` | Kode tiga huruf kapital; frontend fallback ke IDR bila kosong |
| `items[].line_items` | Rincian item aktif; item `aktif === "N"` dikeluarkan |
| `summary.purchase_order_count` | Sama dengan jumlah PO |
| `summary.totals_by_currency` | Total masing-masing currency; frontend menggunakan integer sen |
| `result_handling.send_result_to` | `null` |
| `result_handling.include_recommendation` | `false` |
| `result_handling.update_purchase_orders` | `false` |

Teks memuat kode PO, organisasi, pemasok, tanggal, prioritas, narasi, rincian maksimal lima item per PO, dan total per currency. Item selebihnya ditandai secara eksplisit. Hermes harus meneruskan konten tersebut tanpa membuat pilihan voting atau merangkum ulang dengan AI.

## 4. Transport ke hook Hermes saat ini

```text
POST /hooks/purchase-order-polls
GET  /hooks/purchase-order-polls/:request_id
```

POST memakai Bearer `HERMES_HOOK_TOKEN`, JSON, dan header idempotensi. GET memakai token integrasi yang sama. Akun WhatsApp pengirim ditentukan konfigurasi bridge, bukan `sender_phone`.

Hermes deployed v1.1 belum mendukung `pdf_text` native. Adapter ERP:

- Meneruskan `text` sebagai satu POST teks.
- Meneruskan `pdf` sebagai satu POST PDF.
- Memecah `pdf_text` menjadi POST anak `pdf` dan `text` dengan UUID v4 deterministik berbeda, masing-masing sebagai idempotency key.
- Selalu meneruskan `poll: null`, `sender_phone: null`, serta result handling nonaktif.
- Menyimpan status anak pada request induk ERP. GET ke Hermes menggunakan UUID anak untuk mode gabungan, bukan UUID induk.

Urutan POST PDF lalu teks bukan jaminan urutan kedatangan karena eksekusi Hermes asinkron. Dukungan native gabungan harus dikoordinasikan agar adapter dan Hermes tidak sama-sama menggandakan pengiriman.

## 5. Pengambilan PDF

Backend ERP membuat satu PDF gabungan, menyimpannya pada `tmp/hermes-po-summary/<request_id>.pdf`, dan mengirim referensi berikut dengan ID PO pertama:

```json
{
  "po_id": "101",
  "file_name": "purchase-order-101.pdf",
  "mime_type": "application/pdf",
  "source": { "method": "GET", "path": "/scm/purchase-orders/101/print" }
}
```

Hermes mengunduh dari `PO_API_BASE_URL` yang memuat prefix `/api`, menggunakan Bearer token yang cocok dengan `HERMES_PDF_TOKEN` backend. JWT browser tetap digunakan untuk cetak manual detail per-PO.

**Batasan implementasi PO saat ini:** lookup service print memilih ringkasan terbaru berdasarkan ID PO, bukan UUID request, dan dapat fallback ke cetakan satu PO jika cache tidak ditemukan. Ini belum menjamin file yang benar untuk request bersamaan. Perbaikan yang dibutuhkan adalah endpoint PDF request-specific yang mengembalikan file milik request tersebut atau error eksplisit.

Hermes wajib membuat direktori scratch sebelum menulis file, memvalidasi unduhan PDF, menunggu konsumsi media bridge sebelum cleanup, dan melaporkan error seperti `ENOENT`/401/404. File gagal diunduh tidak boleh dianggap terkirim.

## 6. Respons dan pemantauan

```json
{
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "status": "queued",
  "message": "Permintaan pengiriman PO diterima Hermes."
}
```

- HTTP 202 berarti diterima, belum berarti sampai ke handset.
- `queued`: menunggu/masih diproses.
- `sent`: progres pengiriman; seluruh bagian belum selesai.
- `completed`: seluruh bagian sudah selesai menurut konfirmasi Hermes; bukti diterima handset tetap memerlukan receipt WhatsApp/konfirmasi penerima.
- `failed`: minimal satu bagian gagal, dengan detail error.
- Key sama dengan payload berbeda: HTTP 409.
- Validasi/penolakan kontrak: HTTP 422 dengan detail field.
- Kegagalan integrasi: HTTP 503 sesuai pemetaan backend.
- GET request terdaftar yang gagal tetap dapat mengembalikan HTTP 200 dengan `status: "failed"`.

GET backend menyegarkan status dari Hermes. Untuk gabungan: induk gagal bila satu anak gagal, selesai bila semua anak selesai, selain itu mengikuti progres anak.

**Batasan:** refresh berhenti ketika induk terminal; error GET upstream sementara diabaikan sehingga status lokal bisa tertinggal. Message ID/receipt dan status per bagian belum ditampilkan lengkap di frontend.

Idempotensi backend melindungi request dengan UUID/payload yang sama. Fingerprint browser masih menghitung teks yang memuat waktu saat ini; retry lintas menit pada mode teks dapat menghasilkan UUID baru. Pembuatan fingerprint stabil merupakan perbaikan tersendiri, bukan jaminan yang sudah tersedia.

## 7. Kriteria integrasi tanpa voting

1. Hanya tiga mode tersedia dan diterima: `text`, `pdf_text`, `pdf`.
2. Mode `pdf_poll`, poll, penerima hasil, atau rekomendasi ditolak; tidak ada pesan voting/feedback vote yang dijadwalkan oleh alur ini.
3. Kedua bagian mode gabungan dikirim ke `recipient_phone` yang sama; tidak ada penggantian ke nomor default.
4. Teks/PDF sesuai pilihan; PDF gabungan berisi seluruh dokumen yang diminta.
5. Request idempoten tidak menggandakan pengiriman; kegagalan parsial tidak mengirim ulang bagian sukses.
6. Kegagalan unduhan, bridge, atau penerima tidak dipresentasikan sebagai sukses.
7. Status dokumen PO tidak berubah akibat WhatsApp.
8. Nomor, message ID, receipt jika tersedia, dan isi di handset diverifikasi saat UAT.

Dokumen `vote.example.json` yang tersisa merupakan contoh historis dan tidak menjadi bagian kontrak pengiriman aktif. PRD Hermes workspace juga harus dibaca dengan penegasan bahwa PO dan Pengajuan Dana sama-sama tidak memakai voting.
