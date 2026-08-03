# Durable Notifications API Contract

Base path: `/api/app-notifications`

Data model dan DDL endpoint ini dijelaskan pada [Database and DDL Specification](./database-ddl.md).

Semua endpoint memerlukan bearer JWT. Response memakai envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": null
}
```

## Admin

### Access

`GET /admin/access`

Mengembalikan permission composer user saat ini.

### Search Users

`GET /admin/users?page=1&perPage=20&search=ayat`

Hanya mengembalikan user aktif. `perPage` maksimum 100.

### Audience Options

`GET /admin/audience-options?audience_type=business`

Nilai `audience_type` yang didukung adalah `business`, `branch`, dan `section`. Data dihitung dari karyawan aktif yang memiliki `user_id` dan terhubung ke user aktif.

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "value": 12,
      "label": "Mining",
      "recipient_count": 135
    }
  ],
  "meta": null
}
```

Branch dapat menyertakan `parent_label` berisi nama business unit. Parameter `search` opsional dan maksimum 100 karakter.

### Audience Recipients

`GET /admin/audience-recipients?audience_type=branch&cabang_id=8`

Mengembalikan seluruh user eligible pada group terpilih sebagai isi awal field multiple Recipients. Endpoint mendukung pasangan berikut:

- `audience_type=business` dengan `bisnis_id`;
- `audience_type=branch` dengan `cabang_id`;
- `audience_type=section` dengan `section`.

Setiap user dikembalikan satu kali walaupun memiliki lebih dari satu row karyawan. Response menyertakan `id`, `username`, `email`, `usertype`, `name`, dan `section`.

### Create

`POST /admin`

```json
{
  "audience_type": "personal",
  "target_app": "all",
  "title": "Perubahan jadwal",
  "body": "Silakan periksa jadwal terbaru.",
  "data": { "source": "operations" },
  "priority": "high",
  "ttl_seconds": 3600,
  "idempotency_key": "notification-unique-key",
  "user_ids": [12, 34]
}
```

`user_ids` wajib untuk seluruh audience selain broadcast. Untuk business, branch, dan section, group menjadi preset awal dan `user_ids` berisi daftar final setelah diedit user. Backend memvalidasi ulang bahwa setiap ID masih merupakan user aktif. Response `201` untuk create baru dan `200` untuk idempotent duplicate.

Kontrak audience create:

| `audience_type` | Field wajib             | Sumber recipient final    |
| --------------- | ----------------------- | ------------------------- |
| `broadcast`     | -                       | Seluruh `users.aktif='Y'` |
| `business`      | `bisnis_id`, `user_ids` | `user_ids` hasil edit     |
| `branch`        | `cabang_id`, `user_ids` | `user_ids` hasil edit     |
| `section`       | `section`, `user_ids`   | `user_ids` hasil edit     |
| `personal`      | `user_ids`              | User ID eksplisit         |

Contoh audience cabang:

```json
{
  "audience_type": "branch",
  "cabang_id": 8,
  "user_ids": [12, 34, 56],
  "target_app": "app_emp",
  "title": "Informasi cabang",
  "body": "Pesan untuk seluruh user aktif pada cabang.",
  "priority": "default",
  "idempotency_key": "notification-branch-8-unique-key"
}
```

### History and Detail

- `GET /admin?page=1&perPage=20&search=&status=completed`
- `GET /admin/:uuid`

Detail admin menyertakan daftar recipient dan status baca.

### Retry

`POST /admin/:uuid/retry`

Hanya menerima notification dengan status `failed` atau `partial`. Status lain menghasilkan `409`.

## Inbox

Nilai query `app` yang valid adalah `web`, `app_emp`, dan `app_oprdrv`. Default adalah `web`.

### List

`GET /inbox?page=1&perPage=20&app=app_emp&read=false`

`read` opsional:

| Nilai            | Hasil        |
| ---------------- | ------------ |
| tidak dikirim    | Semua        |
| `false` atau `0` | Belum dibaca |
| `true` atau `1`  | Sudah dibaca |

Contoh response:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "uuid": "f86e5d65-27c1-40a2-87b4-c0fd5f449770",
      "target_app": "app_emp",
      "title": "Perubahan jadwal",
      "body": "Silakan periksa jadwal terbaru.",
      "data": {},
      "read_at": null,
      "created_at": "2026-08-03 10:00:00"
    }
  ],
  "meta": {
    "total": 1,
    "perPage": 20,
    "page": 1,
    "lastPage": 1
  }
}
```

Nama field pagination mengikuti serializer Lucid yang aktif; client mendukung bentuk snake_case dan camelCase.

### Unread Count

`GET /unread-count?app=app_emp`

```json
{
  "success": true,
  "message": "OK",
  "data": { "unread_count": 3 },
  "meta": null
}
```

### Detail

`GET /inbox/:uuid?app=app_emp`

Menghasilkan `404` jika UUID tidak ada, bukan milik user, archived, inactive, atau tidak terlihat pada aplikasi tersebut.

### Mark Read

`POST /inbox/:uuid/read?app=app_emp`

Idempotent. Mengembalikan detail notification dengan `read_at`.

### Mark All Read

`POST /inbox/read-all?app=app_emp`

```json
{
  "success": true,
  "message": "Semua notifikasi ditandai sudah dibaca",
  "data": { "updated_count": 3 },
  "meta": null
}
```

Hanya mengubah unread notification yang terlihat pada aplikasi tersebut.

## Errors

| Status | Arti                                                       |
| ------ | ---------------------------------------------------------- |
| `401`  | JWT tidak valid atau tidak tersedia                        |
| `403`  | Tidak memiliki permission admin yang diperlukan            |
| `404`  | Notification tidak ditemukan dalam ownership dan app scope |
| `409`  | Status tidak dapat di-retry atau retry sedang diproses     |
| `422`  | Payload atau query tidak valid                             |
| `500`  | Error internal                                             |
