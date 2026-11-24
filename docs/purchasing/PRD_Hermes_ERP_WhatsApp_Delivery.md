# PRD Hermes — Hook WhatsApp Purchase Order dan Pengajuan Dana

| Atribut | Nilai |
|---|---|
| Versi dokumen | 1.0.0 |
| Tanggal | 24 November 2026 |
| Status | Handoff implementasi Hermes; belum menjadi bukti perbaikan/deployment |
| Cakupan | Preview Purchase Order dan Pengajuan Dana |
| Halaman ERP | `/purchasing-orders/preview`, `/pengajuan-dana/preview` |
| Hook yang dipakai | `POST /hooks/purchase-order-polls` |
| Skema transport saat ini | `1.1` |

> **Baca dokumen ini sebagai acuan utama penyesuaian hook saat ini.** Kedua fitur hanya mengirim teks, teks + PDF, atau PDF saja. Nama path/event lama tidak berarti mengaktifkan polling/voting WhatsApp. Rancangan endpoint native baru dalam dokumen sebelumnya tidak menjadi prasyarat pekerjaan ini.

## 1. Instruksi handoff untuk agent/tim Hermes

Sesuaikan implementasi hook yang sudah dipakai ERP agar:

1. Pesan dan dokumen benar-benar dikirim ke `recipient_phone` sesuai request.
2. Mendukung request transport `text` dan `pdf`; pilihan produk `pdf_text` sudah dipecah adapter ERP menjadi dua request tersebut.
3. Tidak membuat native poll, pesan pilihan Setuju/Tolak/Perlu Revisi, laporan voting, atau rekomendasi pada kedua alur.
4. Memperbaiki lifecycle file PDF yang menyebabkan `ENOENT` pada `cache/scratch/po_pdfs`.
5. Menjaga idempotensi, mencatat message ID/status bridge, serta melaporkan error sebenarnya melalui GET status.
6. Tidak mengganti endpoint, nama event, atau skema yang diterima adapter secara sepihak.

Hasil pekerjaan yang diminta adalah perubahan kode hook/worker/media bridge yang diperlukan, deployment, dan bukti uji end-to-end. Membuat direktori sekali secara manual hanya mitigasi; implementasi harus tetap bekerja setelah restart atau cache dibersihkan.

## 2. Tujuan dan aturan produk

| Pilihan pada kedua preview | Mode di ERP | Konten di nomor tujuan |
|---|---|---|
| Teks saja | `text` | Satu pesan ringkasan teks |
| Teks dan PDF | `pdf_text` | Satu pesan ringkasan teks dan satu PDF gabungan |
| PDF saja | `pdf` | Satu PDF gabungan, tanpa pesan ringkasan terpisah |

- PDF gabungan merangkum seluruh dokumen yang dipilih dalam request induk.
- Satu tujuan, yaitu `recipient_phone`; akun WhatsApp pengirim berasal dari sesi bridge.
- Tidak ada input penerima hasil voting. `sender_phone` selalu `null`.
- Tidak ada perubahan status PO/Pengajuan Dana setelah WhatsApp dikirim.
- Hermes meneruskan teks dari ERP, termasuk newline, emoji, narasi, dan format WhatsApp. Jangan menulis ulang dengan AI.
- Dokumen Pengajuan Dana tetap berisi Pengajuan Dana walaupun transport memakai nama field PO.

## 3. Arsitektur yang benar-benar digunakan

```text
Frontend Next.js
  ├─ /purchasing-orders/preview
  └─ /pengajuan-dana/preview
        ↓ JWT pengguna
Backend ERP
  ├─ validasi akses dan nomor tujuan
  ├─ buat PDF gabungan jika diperlukan
  ├─ simpan request + idempotensi
  └─ adapter transport Hermes
        ↓ Bearer token integrasi
POST Hermes /hooks/purchase-order-polls
        ↓ antrean/worker
Unduh PDF dari backend ERP, bila mode pdf
        ↓
WhatsApp bridge → recipient_phone

Frontend → GET status ERP → GET status Hermes per request transport
```

API ERP yang dipanggil browser:

```text
POST /api/scm/purchase-orders/hermes-delivery
GET  /api/scm/purchase-orders/hermes-delivery/:request_id
POST /api/pengajuan-dana/hermes-delivery
GET  /api/pengajuan-dana/hermes-delivery/:request_id
```

Hermes tidak dipanggil browser secara langsung dan tidak menerima JWT pengguna sebagai token integrasi hook.

## 4. Tiga mode produk, dua mode transport

| Mode pilihan pengguna | Request yang sampai ke hook Hermes |
|---|---|
| `text` | Satu POST `delivery.mode: "text"` |
| `pdf` | Satu POST `delivery.mode: "pdf"` |
| `pdf_text` | Dua POST mandiri: anak `pdf`, lalu anak `text` |

Untuk mode gabungan:

- Masing-masing anak mempunyai UUID v4 dan `Idempotency-Key` berbeda, deterministik dari UUID induk + jenis bagian.
- Nomor tujuan dan data bisnis kedua anak sama.
- Anak PDF mempunyai satu `pdf_documents`, `text: null`.
- Anak teks mempunyai `pdf_documents: []`, `text` nonkosong.
- ERP menjadwalkan POST PDF dahulu, tetapi worker asinkron tidak menjamin urutan pesan tiba di WhatsApp.
- Hermes memperlakukan tiap UUID anak sebagai satu pekerjaan. Jangan menambahkan teks otomatis ke request PDF atau PDF otomatis ke request teks karena akan menggandakan kiriman.
- UUID induk gabungan adalah resource ERP. GET hook Hermes menggunakan UUID anak yang diterimanya, bukan UUID induk yang tidak pernah didaftarkan di hook.

**Tidak perlu menambahkan mode `pdf_text` native untuk menyelesaikan integrasi saat ini.** Jika nantinya Hermes menyediakan mode native, perpindahan adapter harus dikoordinasikan; jangan menjalankan fan-out ERP dan fan-out Hermes sekaligus.

Request `pdf_poll` atau poll non-null bukan kontrak aktif kedua fitur. Tolak dengan HTTP 422; jangan mengonversinya diam-diam atau mengirim pesan voting.

## 5. Kontrak hook yang wajib dipertahankan

```text
POST https://hermes.kenzieputra.my.id/hooks/purchase-order-polls
GET  https://hermes.kenzieputra.my.id/hooks/purchase-order-polls/:request_id
GET  https://hermes.kenzieputra.my.id/hooks/health
```

Header POST:

```text
Authorization: Bearer <HERMES_HOOK_TOKEN>
Content-Type: application/json
Idempotency-Key: <UUID request_id pada body>
```

GET status memakai Bearer token integrasi yang sama. Jangan mencantumkan token nyata dalam PRD, payload, URL, frontend, atau log.

### 5.1 Invarian payload dari kedua domain

```json
{
  "schema_version": "1.1",
  "event": "purchase_order_poll.requested",
  "sender_phone": null,
  "poll": null,
  "result_handling": {
    "send_result_to": null,
    "include_recommendation": false,
    "update_purchase_orders": false
  }
}
```

Ini fragmen envelope, bukan payload lengkap. Nama event legacy tetap dipakai untuk **pengiriman biasa**. Jangan mewajibkan poll hanya karena nama event mengandung `poll`.

| Field | Validasi |
|---|---|
| `schema_version` | Literal `"1.1"` |
| `event` | Literal `"purchase_order_poll.requested"` |
| `request_id` | UUID v4, sama persis dengan header idempotensi |
| `created_at` | ISO 8601 valid |
| `recipient_phone` | E.164, pola `^\+[1-9]\d{7,14}$` |
| `sender_phone`, `poll` | `null` |
| `delivery.mode` | `pdf` atau `text` untuk transport saat ini |
| `delivery.pdf_documents` | Tepat satu pada `pdf`, kosong pada `text` |
| `delivery.text` | `null` pada `pdf`, string nonkosong pada `text` |
| `items[].po_id` | String numerik positif dan unik dalam request; dapat berupa alias Pengajuan Dana |
| `summary.purchase_order_count` | Sama dengan `items.length`, minimal 1 |
| `summary.totals_by_currency` | Total per currency; validasi dengan desimal, bukan penjumlahan lintas currency |
| `result_handling` | Nilai nonaktif persis seperti fragmen di atas |

ERP menormalisasi `08…` dan `628…` menjadi E.164. Hermes mempertahankan nomor tersebut; jangan mengganti ke nomor default/admin/test. Resolusi JID dan pemeriksaan registrasi penerima memakai kemampuan bridge/SDK aktual. Format E.164 valid belum membuktikan nomor terdaftar di WhatsApp.

### 5.2 Contoh lengkap — request teks Purchase Order

Nomor contoh hanya ilustrasi; pengujian runtime memakai nomor uji yang ditentukan pelaksana.

```json
{
  "schema_version": "1.1",
  "event": "purchase_order_poll.requested",
  "request_id": "917b408f-96c8-4407-8bdf-d319ee327cda",
  "created_at": "2026-11-24T03:00:00.000Z",
  "sender_phone": null,
  "recipient_phone": "+6281234567890",
  "delivery": {
    "mode": "text",
    "pdf_documents": [],
    "text": "📋 *RINGKASAN PURCHASE ORDER*\n\n*1. PO-14028*\n🏭 Pemasok Contoh\n📝 Pengadaan operasional\n💰 *Grand Total: IDR 1.500.000,00*"
  },
  "poll": null,
  "items": [
    {
      "po_id": "14028",
      "po_number": "PO-14028",
      "pr_number": null,
      "request_date": "2026-11-24",
      "status": "verify",
      "priority": "P1",
      "business_unit": { "initial": "MKG", "name": "PT Makkuragatama" },
      "branch_name": "Makassar",
      "supplier_name": "Pemasok Contoh",
      "description": "Pengadaan operasional",
      "currency": "IDR",
      "grand_total": "1500000.00",
      "line_items": []
    }
  ],
  "summary": {
    "purchase_order_count": 1,
    "totals_by_currency": [{ "currency": "IDR", "amount": "1500000.00" }]
  },
  "result_handling": {
    "send_result_to": null,
    "include_recommendation": false,
    "update_purchase_orders": false
  }
}
```

Untuk request PDF PO, envelope tetap sama; ubah `delivery` menjadi:

```json
{
  "mode": "pdf",
  "pdf_documents": [
    {
      "po_id": "14028",
      "file_name": "purchase-order-14028.pdf",
      "mime_type": "application/pdf",
      "source": { "method": "GET", "path": "/scm/purchase-orders/14028/print" }
    }
  ],
  "text": null
}
```

Contoh tersebut menggambarkan format alternatif. Jangan mengganti isi request yang sudah terdaftar menggunakan UUID/idempotency key yang sama.

### 5.3 Pengajuan Dana memakai adapter PO pada wire

Frontend mengirim event `pengajuan_dana_delivery.requested` ke **backend ERP**. Backend memetakannya menjadi envelope legacy bagian 5.1 sebelum menghubungi Hermes.

| Data Pengajuan Dana | Field yang diterima hook |
|---|---|
| ID Pengajuan Dana | Dipetakan menjadi alias transport pada `items[].po_id` |
| Kode Pengajuan Dana | `items[].po_number`, misalnya `PD-2026-00101` |
| Tanggal transaksi | `items[].request_date` |
| Jumlah pengajuan terpilih | `summary.purchase_order_count` |
| PDF gabungan Pengajuan Dana | `delivery.pdf_documents[0]` dengan alias yang sama |
| Teks ringkasan | `delivery.text`, judul tetap Pengajuan Dana |

Hermes tidak boleh menolak alias karena bukan primary key PO aktual atau mencoba mengambil data PO lain. Alias hanya dipakai untuk mengunduh konten dari backend ERP.

Contoh lengkap request PDF Pengajuan Dana setelah adapter:

```json
{
  "schema_version": "1.1",
  "event": "purchase_order_poll.requested",
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "created_at": "2026-11-24T03:01:00.000Z",
  "sender_phone": null,
  "recipient_phone": "+6281234567890",
  "delivery": {
    "mode": "pdf",
    "pdf_documents": [
      {
        "po_id": "880940574322175",
        "file_name": "purchase-order-880940574322175.pdf",
        "mime_type": "application/pdf",
        "source": { "method": "GET", "path": "/scm/purchase-orders/880940574322175/print" }
      }
    ],
    "text": null
  },
  "poll": null,
  "items": [
    {
      "po_id": "880940574322175",
      "po_number": "PD-2026-00101",
      "pr_number": null,
      "request_date": "2026-11-24",
      "status": "approval",
      "priority": null,
      "business_unit": { "initial": "MKG", "name": "PT Makkuragatama" },
      "branch_name": "Makassar",
      "supplier_name": null,
      "description": "Biaya operasional",
      "currency": "IDR",
      "grand_total": "1500000.00",
      "line_items": []
    }
  ],
  "summary": {
    "purchase_order_count": 1,
    "totals_by_currency": [{ "currency": "IDR", "amount": "1500000.00" }]
  },
  "result_handling": {
    "send_result_to": null,
    "include_recommendation": false,
    "update_purchase_orders": false
  }
}
```

Alias pada contoh sesuai derivasi adapter untuk UUID induk tersebut dan indeks item 0. Hermes cukup memakai alias/path yang diterima tanpa menghitung ulang atau menggantinya.

Nama file `purchase-order-<alias>.pdf` pada wire adalah nama transport saat ini; isi file tetap Pengajuan Dana. Nama file bisnis yang lebih baik memerlukan perubahan kontrak bersama, bukan pengambilan dokumen PO sebagai pengganti.

## 6. Pengambilan PDF dari ERP

Hermes membentuk URL:

```text
<PO_API_BASE_URL> + delivery.pdf_documents[0].source.path
```

Contoh konfigurasi nonsecret:

```text
PO_API_BASE_URL=https://api.example.com/api
```

Unduhan memakai:

```text
GET /api/scm/purchase-orders/<po_id_atau_alias>/print
Authorization: Bearer <PDF_SERVICE_TOKEN>
```

Ketentuan:

1. `PO_API_BASE_URL` menunjuk backend ERP yang dapat dijangkau dari Hermes dan memuat prefix `/api`.
2. Token PDF harus cocok dengan `HERMES_PDF_TOKEN` backend ERP; middleware saat ini juga mendukung fallback `INTERNAL_SERVICE_TOKEN`. Token PDF dan token hook mempunyai fungsi berbeda.
3. `localhost:3005` adalah alamat frontend development, bukan origin PDF yang dapat dipakai server Hermes.
4. Hormati `source.path` persis seperti request. Jangan menambahkan `/api` dua kali, mengganti alias menjadi kode dokumen, atau mengganti request anak menjadi path file induk secara tebakan.
5. Pada Pengajuan Dana, handler service print ERP mengenali alias 15 digit berawalan `8`, lalu mengembalikan file cache Pengajuan Dana untuk request induk.
6. Hanya izinkan path relatif yang sesuai kontrak dan origin backend terkonfigurasi. Jangan mengambil URL bebas dari pengguna atau meneruskan token ke origin redirect lain.
7. HTTP 401/403/404, halaman login HTML, JSON error, file kosong, atau respons non-PDF harus menjadi error unduhan yang eksplisit.

### 6.1 Diagnosis HTTP 404 dan penggabungan prefix `/api`

Route kanonis ERP adalah `/api/scm/purchase-orders/:id/print`. Backend juga menyediakan alias `/scm/purchase-orders/:id/print` dengan controller dan middleware `authOrHermesPdf` yang sama setelah perubahan alias dideploy. Kedua path melayani PO dan alias transport Pengajuan Dana.

Hermes harus mencatat **URL final unduhan** (tanpa token) dan status respons agar 404 dapat dibedakan antara route tidak ditemukan dan dokumen/cache tidak ditemukan. Untuk contoh PO 14028:

```text
Kanonis: https://api.example.com/api/scm/purchase-orders/14028/print
Alias:   https://api.example.com/scm/purchase-orders/14028/print
Salah:   https://api.example.com/api/api/scm/purchase-orders/14028/print
```

Saat menyusun URL, pertahankan prefix dari `PO_API_BASE_URL`. Pada JavaScript, `new URL('/scm/...', 'https://api.example.com/api/')` membuang `/api/` karena path dimulai slash. Gunakan penggabungan base tanpa trailing slash + path relatif kontrak, atau buang leading slash path dan pastikan base diakhiri slash sebelum memakai URL resolver.

Tanpa header autentikasi, route yang terdaftar seharusnya menghasilkan 401/403, bukan route-level 404. Dengan token benar, periksa HTTP 200 serta MIME/signature PDF. Alias tidak menyelesaikan origin backend yang salah, prefix ganda, reverse proxy yang tidak meneruskan route, atau file/cache yang tidak tersedia. Pastikan URL final menuju backend dan deployment yang menyimpan request/PDF tersebut.

Hermes tidak perlu membuat PDF bisnis. ERP sudah menyediakan file; Hermes mengunduh dan mengirimkannya.

## 7. Perbaikan utama — ENOENT `po_pdfs`

### 7.1 Insiden yang menjadi dasar requirement

```text
ENOENT: no such file or directory, open
/home/ubuntu/.hermes/cache/scratch/po_pdfs/
99451b71-b88b-4934-be51-d526f445fdbf_purchase-order-14028.pdf
```

Error ini menunjukkan proses gagal membuka path tersebut. Pesan error saja belum memastikan apakah direktori belum ada, unduhan belum membuat file, cleanup menghapus file, atau bridge memakai filesystem berbeda.

### 7.2 Pemeriksaan source/runtime yang diminta dari Hermes

- Temukan operasi `open` yang gagal dan tahapnya: penulisan unduhan, pembacaan attachment, atau pemrosesan media bridge.
- Identifikasi user proses, working directory, konfigurasi scratch, serta lokasi filesystem/container hook dan bridge.
- Korelasikan request ID dengan hasil HTTP unduhan, ukuran file, waktu penulisan, jadwal cleanup, dan respons bridge.
- Pastikan tidak ada dua worker memakai file sementara/nama tujuan yang saling menghapus atau menimpa.
- Periksa lokasi path yang benar-benar dibaca bridge, bukan hanya lokasi yang ditulis hook.

### 7.3 Lifecycle PDF yang wajib diterapkan

```text
Validasi request
  → pastikan direktori induk ada dan writable
  → unduh ke buffer/file sementara unik
  → tunggu unduhan dan penulisan selesai
  → validasi HTTP, MIME, ukuran, signature PDF
  → siapkan file final atau upload buffer
  → kirim melalui bridge
  → simpan message ID/status
  → cleanup setelah bridge selesai memakai media
```

Persyaratan teknis:

1. Buat direktori scratch secara rekursif pada startup dan tepat sebelum penulisan setiap PDF. Direktori dapat hilang setelah cleanup/restart.
2. Pastikan izin sesuai user service; jangan menyelesaikan masalah dengan permission terbuka untuk semua pengguna.
3. Gunakan filename terkontrol dari UUID dan basename yang disanitasi, tanpa traversal direktori.
4. Tunggu promise/stream unduhan selesai sebelum membaca atau mengirim file. Tulis file sementara lalu rename atomik jika memakai disk.
5. Validasi HTTP 2xx, `Content-Type: application/pdf`, ukuran nonzero dan di bawah limit konfigurasi, serta signature `%PDF-`.
6. Jika hook dan bridge berada pada host/container berbeda, gunakan upload/buffer/media API yang didukung bridge atau shared storage yang benar. Path lokal hook tidak otomatis tersedia di bridge.
7. Cleanup harus memperhitungkan file in-flight. Jangan menghapus file ketika bridge masih membaca atau mengunggahnya.
8. Catat tahap error secara terstruktur (`download`, `write`, `read`, `upload`, `send`, `cleanup`) agar kasus `ENOENT` berikutnya dapat dilokalisasi.
9. Konfigurasi timeout, ukuran maksimal, dan TTL harus eksplisit. File terlalu besar ditolak, tidak dipotong diam-diam.
10. Tes pemulihan harus mencakup direktori tidak ada saat worker mulai dan hook/bridge pada filesystem terpisah.

Membuat ulang direktori hanya menyelesaikan kasus direktori hilang. Bila penyebab sebenarnya cleanup terlalu cepat atau bridge membaca path pada host lain, perbaiki urutan/transport media tersebut.

## 8. Status dan respons yang dapat dibaca ERP

### 8.1 Submission

Request valid baru: HTTP 202, misalnya:

```json
{
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "status": "queued",
  "message": "Permintaan pengiriman diterima Hermes."
}
```

HTTP 202 hanya berarti masuk proses. Jangan mengembalikan sukses terkirim sebelum bridge memberikan bukti pengiriman.

### 8.2 GET status

Field `status` dan `error` harus berada pada root JSON, karena adapter ERP membacanya langsung; jangan membungkus di `data` atau menggunakan struktur `diagnostic` ERP sebagai pengganti.

```json
{
  "request_id": "b6ea9e86-2123-423f-9a93-9203952a390a",
  "status": "failed",
  "delivery_mode": "pdf",
  "error": {
    "code": "PDF_STORAGE_FAILED",
    "message": "File PDF tidak tersedia saat akan dikirim.",
    "stage": "read",
    "retryable": false
  }
}
```

Field tambahan pada contoh error adalah informasi yang diminta; ERP saat ini terutama membaca `error.message`. `retryable` harus ditentukan dari penyebab aktual. File gagal dibaca sebelum pemanggilan bridge dapat diunduh ulang secara terkontrol; jika bridge mungkin sudah mengirim, rekonsiliasi dahulu.

| Status | Arti |
|---|---|
| `queued` | Disimpan/menunggu/sedang diproses; belum selesai |
| `sent` | Ada progres/ack pengiriman; proses belum terminal |
| `completed` | Request transport sudah selesai dikirim menurut bukti bridge dan mempunyai message ID |
| `failed` | Request transport gagal dengan detail error |

Simpan message ID asli bridge, target yang dipakai, timestamp, attempt, dan receipt WhatsApp jika tersedia. `completed` bukan bukti handset menerima/membaca. Gunakan receipt `sent`/`delivered`/`read`/`unknown` sesuai bukti, tanpa membuat receipt sintetis. Pelaporan message ID/receipt sebagai field tambahan dan tampilannya di UI ERP memerlukan koordinasi kontrak; penyimpanan bukti di Hermes wajib dilakukan.

Request yang sudah terdaftar tetapi gagal dikembalikan lewat GET HTTP 200 dengan status `failed`; UUID tidak dikenal → HTTP 404.

### 8.3 Penolakan dan runtime error

| Kondisi | Hasil |
|---|---|
| JSON/schema/nomor/mode tidak valid | HTTP 422 `VALIDATION_ERROR` dengan field penyebab |
| Token salah/tidak ada | HTTP 401/403 |
| Key sama, payload berbeda | HTTP 409 `IDEMPOTENCY_CONFLICT` |
| Komponen tidak siap sebelum request diterima | HTTP 503 |
| Unduhan/media gagal setelah enqueue | GET status `failed` dan error tahap terkait |

Kode runtime minimal: `PDF_FETCH_FAILED`, `PDF_INVALID_CONTENT`, `PDF_STORAGE_FAILED`, `MEDIA_SEND_FAILED`, `TEXT_SEND_FAILED`, `BRIDGE_UNAVAILABLE`, `RECIPIENT_NOT_REGISTERED`, `TEXT_TOO_LONG`, `DELIVERY_UNCONFIRMED`.

Teks melebihi batas bridge ditolak secara eksplisit; jangan memotong konten diam-diam atau menggantinya dengan pesan voting. Kebijakan pemecahan teks menjadi banyak pesan memerlukan kontrak terkoordinasi karena format saat ini meminta satu bagian teks.

## 9. Idempotensi, kegagalan parsial, dan penerima

- Simpan UUID + hash payload secara durable dan atomik sebelum enqueue. Unique constraint mencegah dua worker mengirim request yang sama bersamaan.
- POST key/payload identik mengembalikan status tersimpan dengan HTTP 200, tanpa kiriman baru; payload berbeda dengan key sama ditolak.
- Request anak PDF dan teks adalah dua pekerjaan berbeda. Satu anak gagal tidak membatalkan fakta bahwa anak lainnya mungkin sudah terkirim.
- Jangan menandai request selesai hanya karena PDF tersimpan atau bridge endpoint terjangkau. Tunggu hasil operasi pengiriman yang sebenarnya.
- Jika bridge timeout setelah mungkin menerima pesan, rekonsiliasi message ID/status sebelum retry. Bila tidak dapat dipastikan, catat `DELIVERY_UNCONFIRMED`; jangan blind retry.
- Jangan mengirim ulang bagian sukses hanya karena bagian lain gagal. ERP saat ini tidak otomatis meretry induk gagal; pemulihan di Hermes harus menghormati UUID anak dan status pengirimannya.
- Jangan mengganti penerima saat lookup WhatsApp gagal. Error penerima dilaporkan pada request itu sendiri.
- Tidak ada jaminan exactly-once end-to-end jika bridge tidak mendukung idempotensi/rekonsiliasi; dokumentasikan batas yang benar-benar tersedia.

## 10. Dependensi ERP yang perlu diketahui Hermes

Bagian ini adalah batas kemampuan adapter saat PRD ditulis, bukan masalah yang dapat diselesaikan dengan mengganti parser Hermes saja:

1. Backend yang dikonfigurasi untuk PDF harus sudah memuat adapter dan file cache request terkait. Deploy multi-instance memerlukan storage bersama atau routing yang menjamin file tersedia.
2. PDF PO saat ini diambil berdasarkan ID PO pertama; lookup memilih ringkasan terbaru dan dapat fallback ke cetakan satu PO. Risiko PDF tertukar antar-request harus diperbaiki ERP dengan referensi request-specific. Hermes tetap memakai path yang diberikan dan melaporkan unduhan gagal dengan benar.
3. Pengajuan Dana memakai alias transport request-specific; jangan menggantinya menjadi ID PO nyata.
4. Fingerprint browser mode teks masih memuat waktu saat ini, sehingga pengiriman lintas menit dapat menghasilkan UUID baru. Hermes hanya dapat mendeduplikasi UUID/payload yang memang sama; stabilisasi fingerprint adalah pekerjaan ERP.
5. Refresh ERP berhenti ketika status induk terminal. Status masing-masing UUID anak harus tetap tersedia di Hermes untuk diagnosis kegagalan parsial.
6. PDF PO multi-currency memerlukan validasi perhitungan ERP; Hermes tidak memperbaiki isi PDF atau mengonversi mata uang secara mandiri.

Jangan melaporkan pengiriman berhasil end-to-end bila masih ada dependensi ERP yang membuat dokumen/tujuan salah. Pisahkan bukti validasi hook, pengiriman bridge, dan penerimaan konten yang benar.

## 11. Konfigurasi dan deployment Hermes

Konfigurasi minimum yang harus diverifikasi:

- Token masuk hook yang sesuai dengan `HERMES_HOOK_TOKEN` ERP.
- `PO_API_BASE_URL` beserta prefix `/api` yang benar.
- Token unduhan PDF yang cocok dengan `HERMES_PDF_TOKEN` ERP.
- URL/auth bridge aktual dan sesi WhatsApp terhubung.
- Direktori scratch yang eksplisit, writable, serta cocok dengan cara bridge mengakses media.
- Timeout, limit ukuran PDF/teks, TTL cache, dan jumlah worker.
- Penyimpanan durable request/status/message ID dan pemulihan worker setelah restart.

Liveness sehat belum membuktikan pengiriman bekerja. Readiness perlu memeriksa direktori/storage dan koneksi bridge. Setelah perubahan kode, restart layanan melalui process manager deployment aktual, lalu jalankan matriks UAT bagian 12.

Migrasi validator/worker/database harus sejalan. Menambahkan enum di validator tanpa memperbaiki worker, cache PDF, dan pengiriman media tidak menyelesaikan insiden ini.

## 12. Acceptance criteria dan bukti yang wajib diserahkan

### 12.1 Matriks pengiriman

| Domain | Format | Bukti hasil di nomor tujuan |
|---|---|---|
| Purchase Order | Teks | Ringkasan PO diterima, tanpa PDF/voting |
| Purchase Order | Teks + PDF | Teks PO dan satu PDF gabungan yang benar diterima |
| Purchase Order | PDF | Satu PDF gabungan yang benar diterima, tanpa ringkasan teks terpisah |
| Pengajuan Dana | Teks | Ringkasan Pengajuan Dana diterima, tanpa PDF/voting |
| Pengajuan Dana | Teks + PDF | Teks Pengajuan Dana dan satu PDF gabungan yang benar diterima |
| Pengajuan Dana | PDF | Satu PDF gabungan yang benar diterima, tanpa ringkasan teks terpisah |

### 12.2 Pengujian wajib

1. Keenam kombinasi di atas memakai nomor tujuan request, bukan nomor default.
2. Tidak ada native poll/pesan voting/hasil/rekomendasi pada semua kombinasi.
3. Direktori `po_pdfs` tidak ada saat worker mulai → dibuat otomatis; unduhan dan kiriman berhasil.
4. Cleanup/restart menghapus direktori sebelumnya → request baru tetap berjalan.
5. PDF belum selesai ditulis → bridge tidak membaca file lebih awal.
6. Hook dan bridge berbeda filesystem → media dikirim melalui mekanisme yang tersedia pada bridge, tanpa path lokal yang tidak bisa dibaca.
7. PDF 401/403/404, HTML, kosong, timeout, atau permission error → status/error jelas; tidak ada sukses palsu.
8. Bridge offline/sesi terputus atau nomor tidak terdaftar → error benar tanpa penggantian tujuan.
9. Key identik/payload identik dikirim ulang, termasuk setelah restart → tidak ada duplikasi.
10. Key identik/payload berbeda → HTTP 409.
11. Anak PDF gagal tetapi teks berhasil, dan sebaliknya → status masing-masing tersimpan; bagian sukses tidak direplay.
12. Timeout bridge dengan outcome tidak diketahui → rekonsiliasi atau error unconfirmed, tanpa blind retry.
13. GET status root JSON terbaca ERP; setiap UUID anak dapat ditelusuri.
14. File PDF dapat dibuka, memuat seluruh dokumen yang dipilih, dan tidak tertukar antar-request.
15. Status PO/Pengajuan Dana tidak berubah akibat WhatsApp.

### 12.3 Laporan hasil Hermes

Serahkan:

- Daftar file/source hook/worker/bridge yang diubah dan ringkasan akar masalah `ENOENT` yang ditemukan.
- Versi deployment dan hasil tes otomatis terkait media/idempotensi/status.
- Hasil enam kombinasi UAT: domain, mode pilihan, request induk ERP, UUID transport/anak, tujuan yang dimasking pada laporan, message ID asli, receipt yang tersedia, dan konfirmasi isi di handset.
- Bukti tes direktori hilang, file in-flight/cleanup, serta akses media lintas filesystem bila relevan.
- Kendala ERP atau bridge yang masih terbuka, dengan request ID korelasi dan tahap kegagalan.

**Definisi selesai:** hook menerima payload adapter kedua domain, insiden PDF ditangani pada akar penyebabnya, dan seluruh kombinasi UAT menerima konten yang benar di nomor tujuan tanpa voting maupun duplikasi.

## 13. Referensi kode ERP

- `nextjs/src/views/scm/purchasing-orders/polling.js`
- `nextjs/src/views/accounting/pengajuan-dana/polling.js`
- `be/app/Services/PurchaseOrderHermesService.js`
- `be/app/Services/PengajuanDanaHermesService.js`
- `be/app/Controllers/Http/PurchaseOrderHermesController.js`
- `be/app/Controllers/Http/PengajuanDanaHermesController.js`
- `be/app/Controllers/Http/material-supply-chain/PurchaseOrderController.js`, method `print`
- `be/app/Middleware/AuthOrHermesPdf.js`
- `be/start/routes.js`
- `nextjs/docs/purchasing/polling/contract-api.md`

Dokumen ini menjadi handoff utama untuk hook saat ini. `PRD_Hermes_Pengajuan_Dana_WhatsApp_Delivery.md` memuat detail domain dan rancangan native masa depan; `PRD_Hermes_PO_WhatsApp_Hook.md` adalah arsip kontrak lama yang masih menyebut voting.
