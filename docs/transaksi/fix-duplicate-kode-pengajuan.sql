-- Fix duplicate kode pada trx_pengajuan_nonpart
--
-- Pola target:
-- PD-251124MKG00026
-- PD-251124MKG10026
-- PD-251124MKG20026
-- dst
--
-- Asumsi:
-- 1. Lima digit terakhir pada kode adalah numeric sequence.
-- 2. Record dengan id terkecil mempertahankan kode asli.
-- 3. Duplicate lain akan digeser dengan penambahan 10000, 20000, dst
--    terhadap lima digit terakhir.
--
-- Sangat disarankan jalankan dulu query preview sebelum UPDATE.


-- ============================================================
-- A. AUDIT SEMUA DUPLICATE KODE
-- ============================================================

SELECT kode, COUNT(*) AS total_duplikat
FROM trx_pengajuan_nonpart
WHERE kode IS NOT NULL AND kode <> ''
GROUP BY kode
HAVING COUNT(*) > 1
ORDER BY total_duplikat DESC, kode ASC;


-- ============================================================
-- B. PREVIEW DETAIL DUPLICATE UNTUK SATU KODE
-- Ganti nilai @target_kode sesuai kebutuhan.
-- ============================================================

SET @target_kode := 'PD-251124MKG00026';

SELECT id, kode, bisnis_id, cabang_id, trx_date, status, createdby, created_at, updated_at, aktif
FROM trx_pengajuan_nonpart
WHERE kode = @target_kode
ORDER BY id ASC;


-- ============================================================
-- C. PREVIEW HASIL RENUMBER UNTUK SATU KODE
-- Tidak mengubah data, hanya menampilkan old_code dan new_code.
-- ============================================================

WITH ranked AS (
  SELECT
    id,
    kode,
    ROW_NUMBER() OVER (PARTITION BY kode ORDER BY id ASC) AS rn
  FROM trx_pengajuan_nonpart
  WHERE kode = @target_kode
)
SELECT
  id,
  kode AS old_code,
  CASE
    WHEN rn = 1 THEN kode
    ELSE CONCAT(
      LEFT(kode, CHAR_LENGTH(kode) - 5),
      LPAD((rn - 1) * 10000 + CAST(RIGHT(kode, 5) AS UNSIGNED), 5, '0')
    )
  END AS new_code,
  rn
FROM ranked
ORDER BY rn ASC;


-- ============================================================
-- D. UPDATE SATU KODE DUPLICATE
-- Jalankan hanya setelah preview benar.
-- ============================================================

WITH ranked AS (
  SELECT
    id,
    kode,
    ROW_NUMBER() OVER (PARTITION BY kode ORDER BY id ASC) AS rn
  FROM trx_pengajuan_nonpart
  WHERE kode = @target_kode
)
UPDATE trx_pengajuan_nonpart t
JOIN ranked r ON r.id = t.id
SET t.kode = CASE
  WHEN r.rn = 1 THEN t.kode
  ELSE CONCAT(
    LEFT(r.kode, CHAR_LENGTH(r.kode) - 5),
    LPAD((r.rn - 1) * 10000 + CAST(RIGHT(r.kode, 5) AS UNSIGNED), 5, '0')
  )
END
WHERE r.rn > 1;


-- ============================================================
-- E. VERSI KOMPATIBEL TANPA CTE UPDATE
-- Pakai ini jika MySQL Anda tidak mendukung WITH ... UPDATE.
-- ============================================================

-- SET @target_kode := 'PD-251124MKG00026';
--
-- CREATE TEMPORARY TABLE tmp_pengajuan_kode_fix AS
-- SELECT
--   id,
--   kode,
--   (@rn := @rn + 1) AS rn
-- FROM (
--   SELECT id, kode
--   FROM trx_pengajuan_nonpart
--   WHERE kode = @target_kode
--   ORDER BY id ASC
-- ) src
-- JOIN (SELECT @rn := 0) vars;
--
-- SELECT
--   id,
--   kode AS old_code,
--   CASE
--     WHEN rn = 1 THEN kode
--     ELSE CONCAT(
--       LEFT(kode, CHAR_LENGTH(kode) - 5),
--       LPAD((rn - 1) * 10000 + CAST(RIGHT(kode, 5) AS UNSIGNED), 5, '0')
--     )
--   END AS new_code,
--   rn
-- FROM tmp_pengajuan_kode_fix
-- ORDER BY rn ASC;
--
-- UPDATE trx_pengajuan_nonpart t
-- JOIN tmp_pengajuan_kode_fix x ON x.id = t.id
-- SET t.kode = CASE
--   WHEN x.rn = 1 THEN t.kode
--   ELSE CONCAT(
--     LEFT(x.kode, CHAR_LENGTH(x.kode) - 5),
--     LPAD((x.rn - 1) * 10000 + CAST(RIGHT(x.kode, 5) AS UNSIGNED), 5, '0')
--   )
-- END
-- WHERE x.rn > 1;
--
-- DROP TEMPORARY TABLE tmp_pengajuan_kode_fix;


-- ============================================================
-- F. PREVIEW SEMUA DUPLICATE SEKALIGUS
-- Menampilkan rencana perubahan untuk semua kode duplicate.
-- ============================================================

WITH duplicated_codes AS (
  SELECT kode
  FROM trx_pengajuan_nonpart
  WHERE kode IS NOT NULL AND kode <> ''
  GROUP BY kode
  HAVING COUNT(*) > 1
), ranked AS (
  SELECT
    t.id,
    t.kode,
    ROW_NUMBER() OVER (PARTITION BY t.kode ORDER BY t.id ASC) AS rn
  FROM trx_pengajuan_nonpart t
  INNER JOIN duplicated_codes d ON d.kode = t.kode
)
SELECT
  id,
  kode AS old_code,
  CASE
    WHEN rn = 1 THEN kode
    ELSE CONCAT(
      LEFT(kode, CHAR_LENGTH(kode) - 5),
      LPAD((rn - 1) * 10000 + CAST(RIGHT(kode, 5) AS UNSIGNED), 5, '0')
    )
  END AS new_code,
  rn
FROM ranked
ORDER BY old_code ASC, rn ASC;


-- ============================================================
-- G. UPDATE SEMUA DUPLICATE SEKALIGUS
-- Jalankan hanya setelah preview bagian F diverifikasi.
-- ============================================================

WITH duplicated_codes AS (
  SELECT kode
  FROM trx_pengajuan_nonpart
  WHERE kode IS NOT NULL AND kode <> ''
  GROUP BY kode
  HAVING COUNT(*) > 1
), ranked AS (
  SELECT
    t.id,
    t.kode,
    ROW_NUMBER() OVER (PARTITION BY t.kode ORDER BY t.id ASC) AS rn
  FROM trx_pengajuan_nonpart t
  INNER JOIN duplicated_codes d ON d.kode = t.kode
)
UPDATE trx_pengajuan_nonpart t
JOIN ranked r ON r.id = t.id
SET t.kode = CONCAT(
  LEFT(r.kode, CHAR_LENGTH(r.kode) - 5),
  LPAD((r.rn - 1) * 10000 + CAST(RIGHT(r.kode, 5) AS UNSIGNED), 5, '0')
)
WHERE r.rn > 1;


-- ============================================================
-- H. VALIDASI SETELAH UPDATE
-- Harus menghasilkan 0 row sebelum UNIQUE KEY ditambahkan.
-- ============================================================

SELECT kode, COUNT(*) AS total_duplikat
FROM trx_pengajuan_nonpart
WHERE kode IS NOT NULL AND kode <> ''
GROUP BY kode
HAVING COUNT(*) > 1
ORDER BY total_duplikat DESC, kode ASC;


-- ============================================================
-- I. TAMBAHKAN INDEX / UNIQUE KEY SETELAH BERSIH
-- ============================================================

-- ALTER TABLE trx_pengajuan_nonpart
--   ADD INDEX idx_trx_pengajuan_nonpart_kode (kode);
--
-- ALTER TABLE trx_pengajuan_nonpart
--   ADD UNIQUE KEY uq_trx_pengajuan_nonpart_kode (kode);
