// PROJECT IMPORTS
import CreateDom from 'views/master/dom/create';

// ==============================|| SAMPLE PAGE ||============================== //

const DomPage = () => {
  return <CreateDom />;
};

export default DomPage;


// CREATE TABLE `mrt-test`.`mas_doms`  (
//   `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
//   `kode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Format: IM 1225 BTSI 01 / B 1225 BTSI 01F',
//   `date_ops` date NOT NULL COMMENT 'Tanggal operasional',
//   `cabang_id` int UNSIGNED NULL DEFAULT NULL COMMENT 'FK to mas_cabangs',
//   `material_id` int UNSIGNED NULL DEFAULT NULL COMMENT 'FK to mas_jenis_material',
//   `pit_source_id` int UNSIGNED NULL DEFAULT NULL COMMENT 'FK to mas_lokasikerja (Stockpile location)',
//   `contractor_code` enum('BTSI','B') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'BTSI=BTSI contractor, B=Other',
//   `cargo_type` enum('MPR','B') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'MPR=IM prefix (Import), B=B prefix (Barge)',
//   `dom_number` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Sequential number 01, 02, 03...',
//   `truck_type` enum('10_RODA','12_RODA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Truck type',
//   `target_ret` int NOT NULL DEFAULT 60 COMMENT 'Target ritase per dom',
//   `current_ret` int NOT NULL DEFAULT 0 COMMENT 'Current ritase counter',
//   `status` enum('OPEN','CLOSED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN' COMMENT 'DOM status',
//   `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT 'User ID who created',
//   `closed_by` int UNSIGNED NULL DEFAULT NULL COMMENT 'User ID who closed',
//   `closed_at` datetime NULL DEFAULT NULL,
//   `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'Additional notes',
//   `aktif` enum('Y','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Y',
//   `created_at` datetime NULL DEFAULT NULL,
//   `updated_at` datetime NULL DEFAULT NULL,
//   PRIMARY KEY (`id`) USING BTREE,
//   UNIQUE INDEX `uk_kode`(`kode` ASC) USING BTREE,
//   INDEX `idx_status`(`status` ASC) USING BTREE,
//   INDEX `idx_date_ops`(`date_ops` ASC) USING BTREE,
//   INDEX `idx_date_material`(`date_ops` ASC, `material_id` ASC) USING BTREE,
//   INDEX `idx_material`(`material_id` ASC) USING BTREE,
//   INDEX `idx_pit_source`(`pit_source_id` ASC) USING BTREE,
//   INDEX `idx_cabang`(`cabang_id` ASC) USING BTREE,
//   INDEX `idx_date_status`(`date_ops` ASC, `status` ASC) USING BTREE
// ) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;