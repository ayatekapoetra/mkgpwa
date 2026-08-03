# PRD: Durable Notifications

## Status Dokumen

| Item           | Nilai                                                           |
| -------------- | --------------------------------------------------------------- |
| Status         | Implemented, menunggu rollout database/environment              |
| Owner produk   | Operations / IT MKG                                             |
| Sistem         | Next.js, AdonisJS backend, EmployeeMKG, MKGOprDrv, push gateway |
| Route composer | `/push-notifications`                                           |
| Versi awal     | 2026-08-03                                                      |

Dokumen pendukung:

- [Database and DDL Specification](./database-ddl.md)
- [API Contract](./api-contract.md)
- [Rollout and Verification Checklist](./rollout-checklist.md)

## Ringkasan

Fitur ini menyediakan satu alur untuk membuat, menyimpan, mengirim, dan membaca notifikasi pada web, EmployeeMKG, dan MKGOprDrv. Pesan tetap tersedia di inbox walaupun push gagal atau perangkat sedang offline.

## Masalah

- Push bersifat sementara dan tidak menyediakan histori yang dapat dibaca ulang.
- Belum ada composer terpusat dengan kontrol akses.
- Status baca dan jumlah unread belum konsisten antar aplikasi.
- Pengiriman broadcast dan personal belum mempunyai audit status yang durable.

## Tujuan

- Menyediakan composer di `/push-notifications` bagi user yang memiliki permission menu.
- Mendukung audience seluruh user, business unit, cabang, section, dan user terpilih.
- Mendukung target `web`, `app_emp`, `app_oprdrv`, dan `all`.
- Menyimpan pesan dan recipient sebelum pengiriman push dimulai.
- Menyediakan list, detail, unread count, mark read, dan mark all read per user dan aplikasi.
- Menyediakan status dispatch dan retry untuk kegagalan parsial atau total.

## Indikator Keberhasilan

- Seluruh notification yang berhasil dibuat mempunyai notification row dan recipient row yang konsisten.
- Kegagalan push tidak menyebabkan pesan hilang dari inbox.
- User hanya dapat melihat notification yang menjadi miliknya dan sesuai app scope.
- Duplicate request dengan idempotency key sama tidak menghasilkan row atau dispatch kedua.
- Operator dapat mengenali dan retry status `failed` atau `partial`.
- Unread count konsisten dengan list unread pada aplikasi yang sama.

## Bukan Tujuan

- Browser Web Push.
- Penjadwalan pengiriman.
- Rich media, attachment, template, atau action button dinamis.
- Sinkronisasi status receipt final dari Expo setelah ticket diterima.
- Archive/delete inbox oleh recipient pada fase pertama.

## Pengguna

### Composer

User authenticated dengan permission menu `/push-notifications`. Role `developer` mempunyai override sesuai pola permission backend.

### Recipient

Semua user aktif untuk broadcast, atau user aktif yang dipilih untuk personal. Recipient tidak memerlukan permission composer untuk membaca inbox miliknya.

## Arsitektur

```text
Composer Next.js
      |
      v
AdonisJS Durable Notification API
      |-- transaction --> app_notifications
      |                  app_notification_recipients
      |
      +-- after commit --> Push Gateway
                              |--> EmployeeMKG
                              +--> MKGOprDrv

Web / EmployeeMKG / MKGOprDrv
      +--> app-scoped inbox API --> durable database
```

Backend adalah pemilik data notification dan read-state. Push gateway hanya mengurus pengiriman mobile dan tidak menjadi source of truth inbox.

## Functional Requirements

| ID      | Requirement                                                                                 |
| ------- | ------------------------------------------------------------------------------------------- |
| `FR-01` | Sistem harus memeriksa permission composer untuk read, insert, dan retry/update.            |
| `FR-02` | Composer harus mendukung broadcast, business unit, cabang, section, dan personal recipient. |
| `FR-03` | Composer harus mendukung target web, EmployeeMKG, MKGOprDrv, dan all.                       |
| `FR-04` | Backend harus menyimpan notification dan recipient dalam satu transaction.                  |
| `FR-05` | Backend harus commit inbox sebelum memanggil push gateway.                                  |
| `FR-06` | Create harus idempotent berdasarkan `idempotency_key`.                                      |
| `FR-07` | Inbox harus difilter berdasarkan authenticated user dan app scope.                          |
| `FR-08` | Recipient harus dapat melihat list/detail serta mengubah read-state.                        |
| `FR-09` | Sistem harus menyediakan unread count per app scope.                                        |
| `FR-10` | Operator harus dapat melihat history, detail recipient, status, dan error dispatch.         |
| `FR-11` | Operator hanya dapat retry notification `failed` atau `partial`.                            |
| `FR-12` | Push payload harus membawa UUID dan deep link yang dapat dibuka client.                     |

## Non-Functional Requirements

| ID       | Requirement                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| `NFR-01` | Semua endpoint harus menggunakan JWT.                                         |
| `NFR-02` | `user_id` inbox harus berasal dari JWT dan tidak boleh diterima dari caller.  |
| `NFR-03` | Pagination maksimum adalah 100 row per request.                               |
| `NFR-04` | Recipient broadcast harus di-insert dalam batch untuk membatasi ukuran query. |
| `NFR-05` | Error gateway harus disimpan tanpa rollback inbox committed.                  |
| `NFR-06` | UUID dan idempotency key harus unik di database.                              |
| `NFR-07` | Endpoint read harus idempotent.                                               |
| `NFR-08` | Secret gateway dan API internal tidak boleh masuk bundle client.              |

## Target dan Visibilitas

| Target       | Push                      | Inbox                           |
| ------------ | ------------------------- | ------------------------------- |
| `web`        | Tidak                     | Web                             |
| `app_emp`    | EmployeeMKG               | EmployeeMKG                     |
| `app_oprdrv` | MKGOprDrv                 | MKGOprDrv                       |
| `all`        | EmployeeMKG dan MKGOprDrv | Web, EmployeeMKG, dan MKGOprDrv |

Client mengirim query `app=web`, `app=app_emp`, atau `app=app_oprdrv`. Backend hanya mengembalikan pesan dengan `target_app` yang sama atau `all`. Default backend adalah `web` agar caller lama tidak memperoleh inbox aplikasi lain.

## Alur Composer

1. User membuka `/push-notifications`.
2. Frontend memeriksa akses read/insert/update.
3. User memilih audience, target, judul, isi, priority, TTL opsional, dan recipient untuk personal.
4. Frontend membuat `idempotency_key` unik dan mengirim request.
5. Backend memvalidasi permission, payload, dan user aktif.
6. Backend menyimpan notification dan seluruh recipient dalam satu transaksi.
7. Setelah commit, backend mengirim push per mobile target.
8. Backend menyimpan hasil gateway dan status akhir tanpa menghapus inbox jika push gagal.

## Aturan Audience

- `broadcast`: seluruh row user dengan `aktif='Y'` menjadi recipient inbox. Push menggunakan `filter.all_active=true`.
- `business`: user aktif yang terhubung ke karyawan aktif dengan `mas_karyawans.bisnis_id` terpilih.
- `branch`: user aktif yang terhubung ke karyawan aktif dengan `mas_karyawans.cabang_id` terpilih.
- `section`: user aktif yang terhubung ke karyawan aktif dengan nilai trimmed `mas_karyawans.section` terpilih.
- `personal`: hanya `user_ids` aktif dan valid yang menjadi recipient. Push menggunakan `filter.user_ids`.
- Pemilihan group mengambil `DISTINCT user_id` sebagai preset field multiple Recipients.
- User composer dapat menghapus recipient hasil preset atau menambahkan user aktif lain sebelum submit.
- Audience organisasi dan personal mengirim daftar final melalui `user_ids` serta push `filter.user_ids`.
- Audience tanpa recipient aktif menghasilkan HTTP `422`.
- Backend memvalidasi ulang seluruh `user_ids` ketika submit dan menyimpannya sebagai snapshot. Retry memakai snapshot awal, bukan struktur karyawan terbaru.

## Status Dispatch

- `pending`: data tersimpan, dispatch belum dimulai.
- `processing`: dispatch sedang diproses.
- `completed`: target web selesai disimpan, atau seluruh push target menerima ticket.
- `partial`: sebagian channel atau sebagian ticket gagal.
- `failed`: seluruh push target gagal atau dilewati.

Retry hanya tersedia untuk `partial` dan `failed`. Retry memakai idempotency key turunan per channel dan waktu agar gateway memproses percobaan baru.

### State Transition

```text
create -> pending -> processing -> completed
                             |--> partial -> processing (retry)
                             +--> failed  -> processing (retry)
```

- Target `web` berpindah ke `completed` tanpa request push.
- Notification `completed` tidak dapat di-retry.
- Claim status dilakukan sebelum retry untuk mencegah dua retry berjalan bersamaan.

## Inbox

- List diurutkan berdasarkan `created_at` terbaru.
- Filter `read=true` menampilkan pesan yang sudah dibaca.
- Filter `read=false` menampilkan pesan yang belum dibaca.
- Tanpa filter `read`, list menampilkan seluruh pesan pada aplikasi tersebut.
- Detail dan mutasi selalu dibatasi oleh recipient authenticated dan target aplikasi.
- Status baca disimpan pada recipient, bukan pada notification utama.
- Pesan target `all` memakai satu status baca recipient yang sama ketika dibuka melalui salah satu client.

## Deep Link

- EmployeeMKG: `/notifications/<uuid>`
- MKGOprDrv: `/notifikasi/<uuid>`

Payload push membawa `type=app_notification`, `notification_id`, `notification_uuid`, `uuid`, dan `deep_link`.

## Data dan Audit

### `app_notifications`

Menyimpan UUID, audience, target, title, body, custom data, priority, TTL, status, idempotency key, recipient count, hasil push, error terakhir, creator, dan waktu dispatch.

### `app_notification_recipients`

Menyimpan pasangan unik notification/user serta `read_at` dan `archived_at`.

Definisi kolom, ERD, DDL MySQL, index, foreign key, sizing, migration verification, dan rollback tersedia pada [Database and DDL Specification](./database-ddl.md).

## Failure Semantics

- Kegagalan sebelum transaction commit tidak membuat inbox parsial.
- Kegagalan push setelah commit tidak membatalkan notification atau recipient.
- Duplicate `idempotency_key` mengembalikan notification yang sudah ada dan tidak dispatch ulang.
- Kegagalan menandai read tidak menghalangi user melihat detail yang sudah berhasil dimuat.

## Edge Cases

| Kondisi                                  | Perilaku                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| Personal berisi user inactive/tidak ada  | User tersebut dikeluarkan dari recipient               |
| Seluruh personal recipient tidak valid   | Request ditolak `422`                                  |
| Karyawan aktif tidak memiliki `user_id`  | Tidak dimasukkan sebagai recipient                     |
| Satu user memiliki beberapa row karyawan | Tetap satu recipient melalui `DISTINCT user_id`        |
| Filter organisasi tanpa user eligible    | Request ditolak `422`                                  |
| Idempotency key sudah ada                | Notification existing dikembalikan tanpa dispatch baru |
| Push feature flag off                    | Inbox tetap ada; push dicatat gagal/dilewati           |
| Satu channel target `all` gagal          | Status menjadi `partial`                               |
| Semua mobile channel gagal               | Status menjadi `failed`                                |
| Detail bukan milik user                  | Response `404` agar ownership tidak bocor              |
| App query tidak valid                    | Response `422`                                         |
| Read notification yang sudah read        | Sukses tanpa membuat efek samping tambahan             |
| Target `all` dibaca dari satu app        | Recipient dianggap read pada semua app                 |

## Keamanan

- Semua endpoint memakai JWT.
- Endpoint admin memakai permission `/push-notifications` per action.
- Inbox selalu difilter dengan authenticated `user.id`; caller tidak dapat menentukan user recipient.
- UUID tetap diperiksa bersama ownership recipient dan target aplikasi.
- Input title, body, enum, pagination, TTL, dan recipient divalidasi server-side.

## Acceptance Criteria

- Composer yang tidak berizin menerima `403`.
- Broadcast web tampil pada inbox web seluruh user aktif tanpa memanggil push gateway.
- Personal mobile hanya tampil dan terkirim kepada user aktif yang dipilih.
- Target mobile spesifik tidak tampil pada web atau aplikasi mobile lainnya.
- Target `all` tampil di ketiga inbox dan mengirim dua request push.
- Unread count berubah setelah read dan read-all.
- Push gagal tetap menghasilkan inbox dan status `failed` atau `partial`.
- Request create dengan idempotency key sama tidak membuat row atau push kedua.
- User tidak dapat membaca notification milik user lain walaupun mengetahui UUID.

## Traceability

| Area              | Implementasi                                                                 |
| ----------------- | ---------------------------------------------------------------------------- |
| Database          | `be/database/migrations/20260803000100_create_app_notifications.js`          |
| Audience schema   | `be/database/migrations/20260803000300_expand_app_notification_audiences.js` |
| Menu              | `be/database/migrations/20260803000200_add_push_notifications_menu.js`       |
| Service backend   | `be/app/Services/AppNotificationService.js`                                  |
| Permission        | `be/app/Services/AppNotificationPermissionService.js`                        |
| Controller        | `be/app/Controllers/Http/AppNotificationController.js`                       |
| Route             | `be/start/routes.js`                                                         |
| Composer web      | `nextjs/src/views/setting/push-notifications/index.js`                       |
| Inbox web         | `nextjs/src/views/notifications/`                                            |
| Inbox EmployeeMKG | `employeemkg/app/notifications/`                                             |
| Inbox MKGOprDrv   | `mkgoprdrv/app/notifikasi/`                                                  |

## Metrik Awal

- Jumlah notification per target dan audience.
- Persentase status `completed`, `partial`, dan `failed`.
- Jumlah retry.
- Recipient count dan unread count.
- Error gateway terakhir per notification.

## Risiko Lanjutan

- Status `completed` menunjukkan push ticket diterima gateway, bukan delivery receipt final perangkat.
- Broadcast membuat satu recipient row per user aktif sehingga volume perlu dipantau.
- Status baca target `all` dibagi antar client; perubahan ke status per aplikasi membutuhkan perubahan schema.
