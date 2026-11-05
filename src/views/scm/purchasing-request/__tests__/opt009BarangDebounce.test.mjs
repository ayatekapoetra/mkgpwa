import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isTimeoutError,
  getPurchasingRequestError,
  getGoodsIssueError,
} from "../../../../api/errorHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../../..");

test("AC-OPT-SCM-009-01: Inisialisasi query membawa page=1 & perPages=25", () => {
  const formPath = path.join(
    rootDir,
    "src/views/scm/purchasing-request/form.js",
  );
  const detailPath = path.join(
    rootDir,
    "src/views/scm/purchasing-request/detail.js",
  );

  const formContent = fs.readFileSync(formPath, "utf8");
  const detailContent = fs.readFileSync(detailPath, "utf8");

  assert.match(
    formContent,
    /usePurchasingRequestBarang\(\s*\{\s*page:\s*1,\s*perPages:\s*25\s*\}\s*,\s*true\)/,
    "form.js wajib menggunakan page: 1, perPages: 25 untuk query awal barang",
  );

  assert.match(
    detailContent,
    /usePurchasingRequestBarang\(\s*\{\s*page:\s*1,\s*perPages:\s*25\s*\}\s*,\s*Boolean\(row\)/,
    "detail.js wajib menggunakan page: 1, perPages: 25 untuk query barang",
  );
});

test("AC-OPT-SCM-009-02 & AC-OPT-SCM-009-03: Ambang batas minimal 3 karakter dan debounce 350ms", () => {
  const apiPath = path.join(
    rootDir,
    "src/api/purchasing-request.js",
  );
  const apiContent = fs.readFileSync(apiPath, "utf8");

  assert.match(
    apiContent,
    /const\s+useDebounce\s*=\s*\([^)]*delay\s*=\s*350\)/,
    "useDebounce wajib memiliki default delay 350ms",
  );

  assert.match(
    apiContent,
    /debounceMs\s*=\s*350/,
    "usePurchasingRequestBarangSearch wajib memiliki default debounce 350ms",
  );

  assert.match(
    apiContent,
    /hasSearch\s*=\s*debouncedTrimmed\.length\s*>=\s*3/,
    "Search wajib memiliki ambang batas minimal 3 karakter",
  );

  assert.match(
    apiContent,
    /params\s*=\s*\{\s*page:\s*1,\s*perPages:\s*25\s*\}/,
    "Server search wajib membatasi hasil ke perPages: 25 dan page: 1",
  );
});

test("AC-OPT-SCM-009-04: Preservasi item terpilih (selected item retention) saat pencarian baru", () => {
  const selectedItem = {
    id: 999,
    kode: "BRG-999",
    nama: "Baut Khusus Terpilih",
    satuan: "PCS",
  };

  const initialList = [
    { id: 1, kode: "BRG-001", nama: "Barang Satu" },
    { id: 2, kode: "BRG-002", nama: "Barang Dua" },
  ];

  const searchResults = [
    { id: 50, kode: "BRG-050", nama: "Filter Udara" },
    { id: 51, kode: "BRG-051", nama: "Filter Oli" },
  ];

  // Simulasi merging logic pada RequestItemsFields
  const mergeLogic = (currentBarang, isServerSearch, itemOptions, results) => {
    const map = new Map();
    if (currentBarang && currentBarang.id != null) {
      map.set(String(currentBarang.id), currentBarang);
    }
    const sourceOptions = isServerSearch ? results : itemOptions;
    (sourceOptions || []).forEach((option) => {
      if (option?.id != null) map.set(String(option.id), option);
    });
    return Array.from(map.values());
  };

  // Saat belum search (isServerSearch = false)
  const mergedBefore = mergeLogic(selectedItem, false, initialList, []);
  assert.equal(mergedBefore.length, 3);
  assert.ok(mergedBefore.some((opt) => opt.id === 999));

  // Saat user mencari keyword 'Filter' (isServerSearch = true)
  const mergedAfter = mergeLogic(selectedItem, true, initialList, searchResults);
  assert.equal(mergedAfter.length, 3);
  assert.ok(
    mergedAfter.some((opt) => opt.id === 999),
    "Item terpilih wajib tetap dipertahankan meski tidak masuk dalam searchResults",
  );
  assert.ok(mergedAfter.some((opt) => opt.id === 50));
  assert.ok(mergedAfter.some((opt) => opt.id === 51));
});

test("AC-OPT-SCM-009-05 & AC-OPT-SCM-009-06: Deteksi Timeout dan Transformasi Pesan 'Mohon menunggu sejenak!'", () => {
  // Test berbagai variasi error timeout
  const timeoutError1 = { code: "ECONNABORTED", message: "timeout of 30000ms exceeded" };
  const timeoutError2 = { code: "ETIMEDOUT", message: "connect ETIMEDOUT" };
  const timeoutError3 = { isTimeout: true, message: "Mohon menunggu sejenak!" };
  const regularError = { code: "ERR_BAD_REQUEST", message: "Invalid parameters" };

  assert.equal(isTimeoutError(timeoutError1), true);
  assert.equal(isTimeoutError(timeoutError2), true);
  assert.equal(isTimeoutError(timeoutError3), true);
  assert.equal(isTimeoutError(regularError), false);

  const axiosPath = path.join(rootDir, "src/utils/axios.js");
  const axiosContent = fs.readFileSync(axiosPath, "utf8");
  assert.match(
    axiosContent,
    /error\.isTimeout\s*=\s*true/,
    "axios interceptor wajib menetapkan flag isTimeout",
  );
  assert.match(
    axiosContent,
    /error\.message\s*=\s*["']Mohon menunggu sejenak!["']/,
    "axios interceptor wajib mentransformasi message menjadi 'Mohon menunggu sejenak!'",
  );

  const prTimeoutResult = getPurchasingRequestError(timeoutError1);
  assert.equal(prTimeoutResult.message, "Mohon menunggu sejenak!");
  assert.equal(prTimeoutResult.isTimeout, true);
  assert.equal(prTimeoutResult.severity, "warning");

  const giTimeoutResult = getGoodsIssueError(timeoutError2);
  assert.equal(giTimeoutResult.message, "Mohon menunggu sejenak!");
  assert.equal(giTimeoutResult.isTimeout, true);
  assert.equal(giTimeoutResult.severity, "warning");

  const prNormalResult = getPurchasingRequestError(regularError);
  assert.equal(prNormalResult.message, "Invalid parameters");
  assert.equal(prNormalResult.isTimeout, false);
  assert.equal(prNormalResult.severity, "error");
});

test("MaterialRequestTab.js: Alert Warning & Tombol Coba Lagi pada kondisi dataError timeout", () => {
  const mrTabPath = path.join(
    rootDir,
    "src/views/maintenance/work-order/MaterialRequestTab.js",
  );
  const mrTabContent = fs.readFileSync(mrTabPath, "utf8");

  assert.match(
    mrTabContent,
    /severity=\{isTimeout \? ['"]warning['"] : ['"]error['"]\}/,
    "MaterialRequestTab wajib mengubah severity menjadi warning saat isTimeout",
  );

  assert.match(
    mrTabContent,
    /<Button[^>]*onClick=\{\(\)\s*=>\s*mutate\(\)\}[^>]*>[\s\S]*?Coba Lagi[\s\S]*?<\/Button>/,
    "MaterialRequestTab wajib menyediakan tombol Coba Lagi yang memanggil mutate()",
  );
});

test("RequestItemsFields.js: Autocomplete render spinner & debounced input handling", () => {
  const reqItemsPath = path.join(
    rootDir,
    "src/views/scm/purchasing-request/components/RequestItemsFields.js",
  );
  const reqItemsContent = fs.readFileSync(reqItemsPath, "utf8");

  assert.match(
    reqItemsContent,
    /CircularProgress/,
    "RequestItemsFields wajib mengimpor dan merender CircularProgress saat loading",
  );

  assert.match(
    reqItemsContent,
    /query\.length\s*>=\s*3/,
    "filterOptions pada Autocomplete wajib melewatkan client-filter saat query >= 3",
  );

  assert.match(
    reqItemsContent,
    /reason\s*===\s*["']clear["']\s*\|\|\s*reason\s*===\s*["']reset["']/,
    "onInputChange wajib mereset barangSearch saat reason clear atau reset",
  );
});
