# PRD - Produksi Pit Circle Time Monitoring

## Latar Belakang

Pengawas operasional membutuhkan tampilan cepat untuk melihat performa dumptruck pada setiap fleet kerja checker pit. Data sumber berasal dari `pro_ritase_pits`, yaitu catatan keberangkatan dumptruck dari pit pada kombinasi operasi tertentu.

Dalam konteks operasional:

- 1 fleet dipusatkan pada 1 excavator.
- 1 excavator dalam 1 shift dapat melayani lebih dari 1 pit.
- 1 excavator dalam 1 shift dapat mengangkut lebih dari 1 material.
- Karena itu, identitas group fleet wajib terdiri dari:
  - `date_ops`
  - `shift_id`
  - `startpit_id`
  - `excavator_id`
  - `material_id`

## Tujuan

- Menampilkan ringkasan produksi pit per fleet.
- Menampilkan performa dumptruck dalam satu fleet berdasarkan jumlah ritase dan rata-rata circle time.
- Memberi indikasi unit dumptruck yang tidak efektif agar pengawas dapat memindahkan unit ke fleet lain.

## Definisi Operasional

### Group Fleet

Satu card fleet direpresentasikan oleh kombinasi unik:

```text
date_ops + shift_id + startpit_id + excavator_id + material_id
```

### Ritase Dumptruck

Jumlah ritase dumptruck adalah jumlah baris `pro_ritase_pits` aktif dan produksi untuk dumptruck tersebut dalam satu group fleet.

### Circle Time

Circle time dumptruck dihitung dari selisih dua keberangkatan pit berturut-turut untuk dumptruck yang sama dalam group fleet yang sama:

```text
circle_time_trip_n = starttime_(n+1) - starttime_n
```

Catatan:

- Trip terakhir tidak memiliki circle time jika belum ada keberangkatan berikutnya.
- Hanya data `aktif = 'Y'` dan `status = 'PRODUKSI'` yang masuk perhitungan utama.

### Average Circle Time Dumptruck

Rata-rata circle time dumptruck dihitung dari rata-rata seluruh `circle_time_trip` valid milik dumptruck dalam satu group fleet.

### Average Circle Time Fleet

Rata-rata circle time fleet dihitung dari rata-rata seluruh `circle_time_trip` valid dari semua dumptruck dalam group fleet yang sama.

### Unit Efektif

Dumptruck dianggap efektif jika:

```text
avg_circle_time_dumptruck < avg_circle_time_fleet
```

Syarat tambahan yang disarankan:

- Dumptruck baru dinilai jika memiliki minimal `3` trip valid.
- Jika di bawah itu, status ditandai `insufficient_data`.

## Target User

- Pengawas operasional pit
- Koordinator produksi
- Management monitoring melalui signage/dashboard

## Visualisasi Utama

Setiap fleet ditampilkan dalam 1 card berisi:

- Tanggal operasional
- Total ritase fleet
- Jumlah dumptruck aktif
- Material
- Shift
- Kode excavator / label fleet
- Jumlah unit efektif
- Rata-rata circle time fleet

Chart utama dalam card:

- Sumbu X: dumptruck dalam fleet
- Bar: total ritase dumptruck
- Warna bar:
  - hijau: efektif
  - merah: tidak efektif
  - abu-abu: data belum cukup
- Line: rata-rata circle time dumptruck
- Dashed horizontal line: rata-rata circle time fleet

Tooltip minimal:

- kode dumptruck
- total ritase
- average circle time dumptruck
- average circle time fleet
- selisih terhadap average fleet
- status efektivitas

## Kebutuhan Backend

### Endpoint Utama

```http
GET /api/produksi/pit-circle-time-monitoring
```

Query params:

- `start_date` wajib
- `end_date` wajib
- `shift_id` optional
- `cabang_id` optional
- `excavator_id` optional
- `startpit_id` optional
- `material_id` optional
- `status` optional default `PRODUKSI`
- `include_inactive` optional default `false`
- `min_valid_trips` optional default `3`

Response shape yang disarankan:

```json
{
  "diagnostic": { "ver": 1, "error": false },
  "data": {
    "filters": {
      "start_date": "2026-05-01",
      "end_date": "2026-05-30",
      "min_valid_trips": 3
    },
    "fleets": [
      {
        "fleet_key": "2026-05-17|1|68|541|8",
        "date_ops": "2026-05-17",
        "shift_id": 1,
        "shift_name": "Shift 1",
        "cabang_id": 2,
        "area": "MORUT",
        "startpit_id": 68,
        "startpit_name": "Pit C1 Ithamatra",
        "excavator_id": 541,
        "excavator_kode": "PC 06",
        "material_id": 8,
        "material_name": "Limonit",
        "total_ritase": 27,
        "total_dumptruck": 7,
        "effective_dumptrucks": 4,
        "ineffective_dumptrucks": 2,
        "insufficient_dumptrucks": 1,
        "avg_circle_time_minutes": 55,
        "dumptrucks": [
          {
            "dumptruck_id": 585,
            "dumptruck_kode": "DT-585",
            "ritase_count": 6,
            "valid_trip_count": 5,
            "avg_circle_time_minutes": 49,
            "delta_vs_fleet_minutes": -6,
            "effectiveness_status": "effective"
          }
        ]
      }
    ]
  }
}
```

### Endpoint Detail Opsional

Jika dibutuhkan drilldown per dumptruck/trip:

```http
GET /api/produksi/pit-circle-time-monitoring/fleet-detail
```

Query params wajib:

- `date_ops`
- `shift_id`
- `startpit_id`
- `excavator_id`
- `material_id`

Response:

- list trip mentah per dumptruck
- circle time per trip
- status efektif per trip jika ingin audit detail

## Kebutuhan Query Backend

Data dasar berasal dari `pro_ritase_pits` dengan filter utama:

- `aktif = 'Y'`
- `status = 'PRODUKSI'`
- `sync_status = 'SYNCED'` opsional jika ingin hanya data sinkron final

Kemudian:

1. Group per fleet key.
2. Di tiap fleet, group lagi per `dumptruck_id`.
3. Urutkan `starttime` ascending per dumptruck.
4. Hitung `circle_time_trip` dari keberangkatan berikutnya.
5. Hitung `avg_circle_time_dumptruck`.
6. Hitung `avg_circle_time_fleet`.
7. Klasifikasikan `effectiveness_status`.

## Kebutuhan Frontend Next.js

### Route Baru

```text
/panel/produksi-pit-circle-time-monitoring
```

### Struktur Folder

- `src/app/(signageboard)/panel/produksi-pit-circle-time-monitoring/page.js`
- `src/views/signages/produksi-pit-circle-time-monitoring/index.js`
- komponen chart dan card di folder view yang sama

### Layout

Acuan visual:

- layout header dan filter mengikuti gaya `panel/sparepart-used`
- konten utama berupa grid card fleet
- setiap card berisi summary + chart kombinasi ritase vs circle time

## Edge Cases

- Fleet tanpa dumptruck valid tidak ditampilkan atau diberi empty state.
- Dumptruck dengan 1 trip saja tidak memiliki circle time valid.
- Dumptruck dengan trip valid di bawah threshold diberi status `insufficient_data`.
- Data `NON_PRODUKSI` dipisahkan dari hitungan utama.
- Perubahan pit/material oleh excavator dalam shift yang sama harus menghasilkan card fleet terpisah.

## Tahapan Implementasi

1. Finalkan kontrak endpoint backend.
2. Implement service agregasi fleet dan dumptruck.
3. Tambahkan endpoint controller backend.
4. Buat hook/api client di Next.js.
5. Buat card summary dan combo chart.
6. Tambahkan tooltip dan status color mapping.
7. Uji dengan sample `pro_ritase_pits`.
