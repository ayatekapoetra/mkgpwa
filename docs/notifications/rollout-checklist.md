# Durable Notifications Rollout Checklist

## Sebelum Deploy

- [ ] Pastikan backup database tersedia.
- [ ] Review [Database and DDL Specification](./database-ddl.md).
- [ ] Pastikan user migration mempunyai privilege `CREATE`, `ALTER`, `INDEX`, dan `REFERENCES`.
- [ ] Pastikan tipe `app_notifications.id` dan `app_notification_recipients.notification_id` kompatibel untuk foreign key.
- [ ] Pastikan storage engine kedua tabel mendukung foreign key dan konsisten, misalnya InnoDB.
- [ ] Pastikan `PUSH_NOTIFICATIONS_ENABLED` dan konfigurasi push gateway sesuai environment.
- [ ] Pastikan token gateway tidak disimpan di source control atau bundle client.
- [ ] Pastikan build EmployeeMKG dan MKGOprDrv yang memahami deep link sudah tersedia.
- [ ] Jalankan backend unit tests.
- [ ] Jalankan lint dan build Next.js.
- [ ] Jalankan focused lint dan Expo config check pada kedua mobile app.

## Urutan Deploy

1. Deploy migration `app_notifications` dan `app_notification_recipients`.
2. Deploy migration menu `/push-notifications`.
3. Deploy migration ekspansi audience dan `audience_filter_json`.
4. Deploy backend endpoint durable notification.
5. Deploy Next.js composer dan web inbox.
6. Rilis EmployeeMKG dan MKGOprDrv dengan inbox dan deep link.
7. Berikan permission composer hanya kepada user yang ditunjuk.

Backend default `app=web`, sehingga deployment backend dapat dilakukan sebelum client mobile baru tanpa mengekspos target aplikasi lain.

Perintah migration dijalankan dari folder `be`:

```bash
node ace migration:status
node ace migration:run
node ace migration:status
```

Gunakan `node ace migration:run --force` pada environment production setelah backup dan target database diverifikasi.

## Verifikasi Database

- [ ] `SHOW CREATE TABLE app_notifications` sesuai data dictionary.
- [ ] `SHOW CREATE TABLE app_notification_recipients` mempunyai FK `ON DELETE CASCADE`.
- [ ] Unique index UUID dan idempotency key tersedia.
- [ ] Unique pair notification/recipient tersedia.
- [ ] Index status/history dan inbox tersedia.
- [ ] Submenu `/push-notifications` tersedia tepat satu row.
- [ ] Permission composer hanya diberikan kepada user yang ditunjuk.
- [ ] Query orphan dan duplicate pada database specification menghasilkan nol row.

## Smoke Test Staging

- [ ] User tanpa permission menerima `403` pada admin access/create.
- [ ] User dengan permission dapat mencari recipient aktif.
- [ ] Option business, branch, dan section hanya menghitung karyawan aktif yang terhubung ke user aktif.
- [ ] Audience business hanya membuat recipient dari `mas_karyawans.bisnis_id` terpilih.
- [ ] Audience branch hanya membuat recipient dari `mas_karyawans.cabang_id` terpilih.
- [ ] Audience section hanya membuat recipient dari `mas_karyawans.section` terpilih.
- [ ] User yang muncul pada beberapa row karyawan tidak menghasilkan duplicate recipient.
- [ ] Memilih business, branch, atau section mengisi field multiple Recipients dengan seluruh user eligible.
- [ ] Recipient hasil group dapat dihapus dan user aktif lain dapat ditambahkan sebelum submit.
- [ ] Recipient snapshot mengikuti daftar final pada field Recipients, bukan selalu seluruh anggota group.
- [ ] Broadcast `web` muncul di inbox web dan tidak memanggil push mobile.
- [ ] Personal `app_emp` muncul hanya di EmployeeMKG recipient terpilih.
- [ ] Personal `app_oprdrv` muncul hanya di MKGOprDrv recipient terpilih.
- [ ] Target `all` muncul di semua inbox dan menghasilkan dua push channel.
- [ ] Filter semua, read, dan unread menghasilkan row yang benar.
- [ ] Detail otomatis menandai notification dibaca.
- [ ] Mark all hanya mengubah notification pada app scope saat ini.
- [ ] User lain menerima `404` ketika mencoba UUID yang bukan miliknya.
- [ ] Idempotency key yang sama tidak membuat notification kedua.
- [ ] Simulasikan satu channel gagal dan pastikan status `partial` serta inbox tetap ada.
- [ ] Retry notification partial dan periksa hasil status terbaru.
- [ ] Uji push foreground, background, terminated, dan deep link pada Android dan iOS.

## Observability

- [ ] Pantau jumlah row recipient setelah broadcast pertama.
- [ ] Pantau notification `processing` yang tidak selesai.
- [ ] Pantau status `partial`/`failed` dan `last_dispatch_error`.
- [ ] Cocokkan push gateway ticket dengan notification UUID/idempotency key.
- [ ] Verifikasi response time list inbox dan unread count.

## Rollback

- Nonaktifkan composer permission terlebih dahulu.
- Matikan push melalui `PUSH_NOTIFICATIONS_ENABLED=false` bila gateway bermasalah; inbox tetap dapat dibuat.
- Rollback aplikasi tanpa menghapus tabel agar histori dan read-state tidak hilang.
- Drop tabel hanya jika fitur belum digunakan atau retention data telah disetujui.

## Follow-up

- Tambahkan reconciliation receipt final jika status delivery perangkat diperlukan.
- Evaluasi batching/queue worker jika broadcast synchronous mulai lambat.
- Evaluasi retention dan archive policy setelah volume produksi tersedia.
- Pindahkan secret yang masih masuk bundle mobile ke backend proxy dan rotasi secret lama.
