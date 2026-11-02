const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("create.js integrates orderPaymentNarasiHelpers correctly", () => {
  const createPath = path.resolve(__dirname, "../src/views/scm/order-payment/create.js");
  const content = fs.readFileSync(createPath, "utf8");

  // Verify import exists
  assert.match(
    content,
    /import\s*\{[\s\S]*?mergeAllocationsFromModal[\s\S]*?joinHeaderNarasi[\s\S]*?\}\s*from\s*"\.\/orderPaymentNarasiHelpers"/,
    "create.js must import mergeAllocationsFromModal and joinHeaderNarasi",
  );

  // Verify handleModalConfirm uses mergeAllocationsFromModal
  assert.match(
    content,
    /const handleModalConfirm = \(rows\) =>\s*\{\s*setAllocations\(\(prev\) => mergeAllocationsFromModal\(prev, rows\)\);\s*setModalOpen\(false\);/,
    "handleModalConfirm must delegate to mergeAllocationsFromModal",
  );

  // Verify submit computes header narasi via joinHeaderNarasi
  assert.match(
    content,
    /const fallbackNarasi = `Pembayaran \$\{payloadAllocations\.length\} faktur \/ \$\{pemasokCount\} pemasok`;\s*const computedNarasi = joinHeaderNarasi\(payloadAllocations, fallbackNarasi\);/,
    "submit must use joinHeaderNarasi for computedNarasi",
  );

  // AC-04: Verify 'Keterangan PO:' text is still rendered
  assert.match(
    content,
    /Keterangan PO:\s*\{row\.po_narasi\}/,
    "create.js must keep rendering 'Keterangan PO: {row.po_narasi}' in item list",
  );
  assert.match(
    content,
    /Keterangan PO:\s*\{detailRow\.po_narasi\}/,
    "create.js must keep rendering 'Keterangan PO: {detailRow.po_narasi}' in invoice detail dialog",
  );
});
