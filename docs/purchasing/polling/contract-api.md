# Contract API — Pengiriman Purchase Order / Hermes

Versi request: **1.1**. Endpoint berikut merupakan kontrak untuk diimplementasikan di Hermes; **belum tersedia di aplikasi Next.js**. Path hook dan nama event lama dipertahankan; request sekarang membedakan tiga mode pengiriman. Event hasil vote tetap versi 1.0 karena strukturnya tidak berubah.

## 1. Status implementasi frontend

- List `/purchasing-orders`: **Pilih Data** membuka checkbox; **Preview (N)** muncul setelah ada pilihan. Select-all hanya berlaku pada halaman yang sedang ditampilkan. Filter/pagination tidak menghapus pilihan.
- Preview `/purchasing-orders/preview`: memuat detail terbaru dari endpoint PO yang sudah ada, maksimal empat request bersamaan. Semua PO harus berhasil dimuat sebelum JSON dapat dibuat.
- Input **penerima pesan** wajib untuk semua mode. **Penerima hasil polling** wajib hanya pada mode `pdf_poll`. `08…` dinormalisasi menjadi `+628…`, `62…` menjadi `+62…`; nomor internasional menggunakan E.164.
- Footer **Reset** hanya menghapus key fitur ini untuk pengguna aktif, lalu kembali ke list. Dropdown **Kirim Data** berisi **Kirim PDF**, **Kirim PDF dan Polling**, dan **Kirim Pesan Text Saja**. Memilih action menyiapkan dan mengunduh JSON, bukan mengirim WhatsApp. Pilihan tidak otomatis dihapus setelah JSON diunduh.
- Key localStorage: `purchase-order-poll:v1:<user_id>`. Menyimpan ID/kode PO, kedua nomor, dan metadata idempotensi; tidak menyimpan token, rekening, atau seluruh detail dokumen.
- Detail diambil ulang saat preview dibuka atau **Muat Ulang Data** ditekan. UI menampilkan data terbaru, bukan snapshot nominal dari localStorage.
- Hanya `pdf_poll` menyertakan **Setuju / Tolak / Perlu Revisi**; satu jawaban berlaku untuk **seluruh PO** dalam satu paket. Mode lainnya tidak membuat polling.

### Mode pengiriman

| `delivery.mode` | `pdf_documents` | `delivery.text` | `poll` | `sender_phone` |
| --- | --- | --- | --- | --- |
| `pdf` | Satu referensi PDF per PO | `null` | `null` | `null` |
| `pdf_poll` | Satu referensi PDF per PO | `null` | Satu polling kolektif | E.164 wajib |
| `text` | Array kosong | Ringkasan seluruh PO | `null` | `null` |

Contoh lengkap: [PDF saja](./request.pdf.example.json), [PDF dan polling](./request.example.json), [teks saja](./request.text.example.json).

### Pengambilan PDF oleh Hermes

Frontend tidak merender PDF baru atau memasukkan token/base64 ke JSON. Setiap `delivery.pdf_documents[]` menunjuk endpoint cetak yang sudah digunakan aplikasi:

```json
{
  "po_id": "101",
  "file_name": "purchase-order-101.pdf",
  "mime_type": "application/pdf",
  "source": { "method": "GET", "path": "/scm/purchase-orders/101/print" }
}
```

Hermes memerlukan **PO_API_BASE_URL dan credential backend** pada konfigurasi servernya untuk mengambil file ini. Gabungkan hanya base URL yang dikonfigurasi dengan path cetak yang tervalidasi; ID pada path harus sama dengan `po_id` dan tercantum pada `items`. Jangan mengambil URL bebas dari payload atau meneruskan credential ke host lain melalui redirect. Pastikan respons berhasil dan berupa PDF sebelum diteruskan sebagai dokumen WhatsApp. Satu pilihan PO menghasilkan satu PDF; mode `pdf_poll` menambahkan tepat satu polling setelah seluruh PDF dikirim. Jika pengambilan/pengiriman PDF gagal, tandai status kegagalan dan jangan melaporkan semua dokumen sudah terkirim.

Mode `text` meneruskan `delivery.text` tanpa melampirkan PDF atau polling. Jika melewati batas panjang provider, pecah menjadi beberapa pesan dengan urutan tetap; jangan menghilangkan PO secara diam-diam.

## 2. Istilah nomor telepon

| Field | Arti |
| --- | --- |
| `recipient_phone` | Nomor WhatsApp tujuan PDF/polling/teks. Wajib pada semua mode. |
| `sender_phone` | Pengaju/penerima hasil dan rekomendasi pada `pdf_poll`; `null` untuk mode lain. **Bukan** nomor akun WhatsApp Hermes. |

Akun/session WhatsApp pengirim pesan ditentukan oleh konfigurasi Hermes, bukan oleh JSON ini. Contoh menggunakan nomor fiktif.

## 3. Request hook Hermes

```http
POST /hooks/purchase-order-polls
Content-Type: application/json
Authorization: Bearer <HERMES_HOOK_TOKEN>
Idempotency-Key: b6ea9e86-2123-423f-9a93-9203952a390a
```

Body: lihat [`request.example.json`](./request.example.json). Definisi mesin: [`openapi.json`](./openapi.json), OpenAPI 3.1.

`Authorization` merupakan credential integrasi server ke Hermes. Credential tidak dimasukkan ke localStorage, file JSON, atau frontend. Ketika hook tersedia, server/proxy pengiriman dapat meneruskan file JSON yang sama dengan header di atas.

### Field request

| Field | Tipe / ketentuan |
| --- | --- |
| `schema_version` | Literal `"1.1"`. |
| `request_id` | UUID v4, sama dengan header `Idempotency-Key`. Korelasi seluruh siklus polling. |
| `created_at` | Timestamp UTC ISO 8601 saat paket pertama kali disiapkan. |
| `event` | Literal `"purchase_order_poll.requested"`. |
| `sender_phone`, `recipient_phone` | String E.164: `+` dan 8–15 digit; sender `null` pada mode tanpa polling. |
| `delivery.mode` | `pdf`, `pdf_poll`, atau `text`. |
| `delivery.pdf_documents` | Referensi file PDF untuk setiap PO pada dua mode PDF; kosong pada `text`. |
| `delivery.text` | Ringkasan siap diteruskan pada `text`; `null` pada dua mode PDF. |
| `poll` | Objek hanya pada `pdf_poll`; `null` pada mode lain. |
| `poll.question` | Pertanyaan untuk keputusan kolektif seluruh PO. |
| `poll.allow_multiple_answers` | Harus `false`; provider dikonfigurasi untuk satu pilihan. |
| `poll.scope` | Literal `"all_selected_purchase_orders"`. |
| `poll.options` | Tiga opsi dengan pasangan ID/label persis seperti contoh. ID stabil dipakai untuk laporan. |
| `items` | Minimal satu PO, `po_id` unik. Nilai ID dikirim sebagai string. |
| `items[].request_date` | `YYYY-MM-DD` atau `null` jika sumber tidak menyediakan tanggal tersebut. |
| `items[].business_unit` | Initial/nama bisnis; nilai yang tidak tersedia menjadi `null`. |
| `items[].grand_total` | Nominal header dari backend, string desimal dua digit, tanpa `Rp`/pemisah ribuan; tidak dihitung ulang dari line item. |
| `items[].currency` | Kode tiga huruf kapital. Fallback `IDR` jika header tidak memiliki currency. |
| `items[].line_items` | Rincian barang/non-part dari detail PO; item `aktif === "N"` dikeluarkan. Boleh array kosong. Qty berupa string desimal non-negatif. |
| `summary.purchase_order_count` | Harus sama dengan panjang `items`. |
| `summary.totals_by_currency` | Jumlah grand total per mata uang, satu entry per currency. Tidak menjumlahkan mata uang berbeda menjadi satu nominal. |
| `result_handling.send_result_to` | `"sender_phone"` pada `pdf_poll`; `null` pada mode lain. |
| `result_handling.include_recommendation` | `true` pada `pdf_poll`; `false` pada mode lain. |
| `result_handling.update_purchase_orders` | Harus `false`. Tidak ada proses verifikasi/perubahan status otomatis. |

Frontend menjumlahkan nominal menggunakan satuan sen/integer, bukan penjumlahan floating-point. Data dengan nominal tidak valid atau presisi pecahan non-nol melebihi dua digit tidak diekspor diam-diam menjadi nol/dibulatkan.

### Idempotensi

1. Hermes menyimpan `request_id` beserta payload dan status pemrosesan secara atomik **sebelum** menjadwalkan pengiriman WhatsApp.
2. Request dengan key dan payload sama mengembalikan resource yang sama, tanpa membuat polling baru.
3. Key sama dengan payload berbeda: `409 IDEMPOTENCY_CONFLICT`.
4. Frontend menyimpan SHA-256 dari isi bisnis paket (tanpa `request_id`/`created_at`) secara lokal. Unduhan ulang dengan data, mode, dan nomor yang sama menggunakan UUID/timestamp yang sama. Perubahan isi/mode/nomor membuat UUID baru. Fingerprint lokal tidak dikirim ke Hermes.
5. Berkas JSON belum berarti sudah diterima Hermes; request `202` belum berarti pesan telah terkirim.

## 4. Respons

### Diterima untuk diproses — `202 Accepted`

```json
{
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "status": "queued",
  "message": "Permintaan pengiriman PO diterima Hermes."
}
```

Request idempoten yang sudah ada dapat mengembalikan `200 OK` dengan `request_id` yang sama dan status terbaru: `queued`, `sent`, `failed`, atau `completed`.

Pada `pdf`/`text`, `completed` berarti seluruh dokumen/pesan telah berhasil diproses sesuai konfirmasi provider. Pada `pdf_poll`, laporan hasil polling juga diteruskan ke `sender_phone`; perubahan vote berikutnya tetap diperlakukan sebagai pembaruan hasil.

### Error

```json
{
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload polling tidak valid.",
    "fields": [
      { "path": "recipient_phone", "message": "Gunakan format E.164." }
    ]
  }
}
```

| HTTP | Contoh code | Arti |
| --- | --- | --- |
| 400 | `INVALID_JSON` | Body bukan JSON yang dapat dibaca. |
| 401 / 403 | `UNAUTHORIZED` / `FORBIDDEN` | Credential integrasi tidak valid/tidak memiliki akses. |
| 409 | `IDEMPOTENCY_CONFLICT` | Key sama dengan isi berbeda. |
| 422 | `VALIDATION_ERROR` / `UNSUPPORTED_SCHEMA_VERSION` | Struktur, nomor, ID, ringkasan, atau versi tidak valid. |
| 429 | `RATE_LIMITED` | Coba ulang mengikuti `Retry-After`, tetap dengan key yang sama. |
| 503 | `HERMES_UNAVAILABLE` | Belum dapat menerima pekerjaan; retry tidak boleh membuat duplikasi. |

Kegagalan pengiriman provider **setelah** `202` menjadi status `failed` pada resource Hermes; jangan membuat request baru dengan ID berbeda untuk retry resource yang sama.

## 5. Tanggung jawab pengiriman Hermes

1. Validasi versi, mode, nomor yang diperlukan, ID unik, kesesuaian count/total, dokumen/teks, dan kebijakan `update_purchase_orders=false`.
2. Simpan korelasi `request_id`, mode, daftar PO, dan pesan/dokumen provider. Pada `pdf_poll`, simpan pula kedua nomor, ID opsi dan ID pesan polling.
3. Untuk `pdf`, ambil dan kirim seluruh PDF kepada `recipient_phone` tanpa polling. Untuk `text`, teruskan pesan ringkasan tanpa PDF/polling. Untuk `pdf_poll`, kirim seluruh PDF lalu **satu polling native WhatsApp** untuk seluruh PO.
4. Pada `pdf_poll`, map ID/label opsi provider ke `approve`, `reject`, `request_revision`. Provider yang tidak mendukung polling native harus menghasilkan kegagalan yang jelas, bukan diam-diam mengganti dengan pesan teks pilihan balasan.
5. Untuk `pdf_poll`, terima vote melalui webhook/provider listener Hermes. Poll creation saja tidak cukup; jalur penerimaan vote wajib tersedia di Hermes.
6. Hanya pada `pdf_poll`, teruskan keputusan dan rekomendasi kepada `sender_phone`. Tidak memanggil endpoint perubahan/verifikasi PO pada mode apa pun.

## 6. Event hasil internal Hermes

Ini adalah bentuk normalisasi **di dalam Hermes**, **bukan endpoint callback Next.js**. Contoh: [`vote.example.json`](./vote.example.json).

```json
{
  "schema_version": "1.0",
  "event": "purchase_order_poll.vote_updated",
  "event_id": "c1286a8f-6859-46d0-8b4d-85a279d9a4fb",
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "poll_message_id": "provider-message-id",
  "respondent_phone": "+6289876543210",
  "selected_option_ids": ["approve"],
  "received_at": "2026-10-22T10:05:00.000Z"
}
```

- Korelasikan vote memakai ID pesan provider yang tersimpan, bukan nomor saja.
- `respondent_phone` harus cocok dengan penerima polling yang disimpan.
- `selected_option_ids`: nol atau satu ID. Array kosong berarti suara dicabut; laporkan sebagai belum ada keputusan aktif.
- Perubahan pilihan merupakan pembaruan keputusan, bukan polling baru. Gunakan metadata urutan/timestamp provider untuk mengabaikan event lama yang datang terlambat.
- Deduplikasi `event_id`/ID event provider agar redelivery tidak mengirim laporan berulang.

### Bentuk pesan hasil

```text
Hasil Polling Purchase Order
Referensi: b6ea9e86-2123-423f-9a93-9203952a390a
Pemberi keputusan: +6289876543210
Keputusan: SETUJU
PO: PO-2026-00101, PO-2026-00102
Total: IDR 4.000.000,00

Rekomendasi: lanjutkan pemeriksaan dan proses verifikasi di aplikasi sesuai
kewenangan pengguna. Status PO belum diubah.
```

Rekomendasi `reject`: tinjau alasan keputusan sebelum melanjutkan proses. Rekomendasi `request_revision`: koordinasikan revisi dokumen. Tanpa suara aktif: tunggu keputusan penerima. Seluruhnya berupa informasi kepada pengaju, bukan eksekusi transaksi oleh agent.

## 7. Checklist pengujian integrasi Hermes

- `pdf` mengirim seluruh PDF tanpa polling, `pdf_poll` menambahkan tepat satu polling native, `text` hanya mengirim teks.
- Path cetak, PO ID, nama file, dan `items` sesuai; PDF diambil memakai konfigurasi backend Hermes, bukan token pada payload.
- Nomor tujuan polling dan tujuan hasil mengikuti field yang berbeda.
- Pengiriman ulang request sama tidak membuat polling kedua.
- Vote awal, perubahan vote, pencabutan vote, dan redelivery webhook diproses dengan korelasi yang benar.
- Laporan mencantumkan referensi request dan seluruh PO, tidak mengubah status dokumen.
- Error provider tidak dilaporkan sebagai pesan berhasil terkirim.
