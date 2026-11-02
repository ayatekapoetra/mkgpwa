/**
 * Helpers murni untuk logika prefill narasi alokasi & komputasi narasi header order payment.
 * Digunakan oleh src/views/scm/order-payment/create.js dan diuji di __tests__/orderPaymentNarasiHelpers.test.mjs
 */

/**
 * Normalisasi dan trim string narasi.
 * Mengabaikan null, undefined, atau string kosong/whitespace.
 * Menghindari konversi "null" / "undefined" secara tidak sengaja.
 */
export function normalizeNarasi(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (s === "null" || s === "undefined") return "";
  return s;
}

/**
 * Menentukan narasi untuk baris alokasi yang baru ditambahkan atau diperbarui.
 * AC-01: Saat faktur ditambahkan, narasi alokasi di-prefill dari po_narasi (trim) bila alokasi belum punya narasi;
 *        tetap bisa diedit user; edit manual tidak ditimpa ulang.
 * AC-03: Faktur tanpa po_narasi: narasi kosong, tidak muncul "null"/"undefined".
 *
 * @param {string|null|undefined} existingNarasi Narasi yang sudah ada pada baris alokasi (mis. jika diedit sebelumnya)
 * @param {string|null|undefined} poNarasi Narasi dari PO (row.po_narasi)
 * @returns {string}
 */
export function buildAllocationNarasi(existingNarasi, poNarasi) {
  const existing = normalizeNarasi(existingNarasi);
  if (existing) {
    return existing;
  }
  return normalizeNarasi(poNarasi);
}

/**
 * Menggabungkan narasi item alokasi yang unik dengan separator "; " (dedup, urutan stabil).
 * AC-02: Narasi header pembayaran = narasi item unik digabung "; " (dedup, urutan stabil);
 *        fallback lama hanya jika semua kosong.
 *
 * @param {Array<{ narasi?: string }>} items Daftar alokasi / item dengan properti narasi
 * @param {string} fallback Teks fallback jika semua narasi item kosong
 * @returns {string}
 */
export function joinHeaderNarasi(items, fallback = "") {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  const seen = new Set();
  const uniqueList = [];

  for (const item of items) {
    const n = normalizeNarasi(item?.narasi);
    if (n && !seen.has(n)) {
      seen.add(n);
      uniqueList.push(n);
    }
  }

  if (uniqueList.length === 0) {
    return fallback;
  }

  return uniqueList.join("; ");
}

/**
 * Memperbarui daftar alokasi saat baris faktur dipilih dari modal (handleModalConfirm).
 * Mempertahankan alokasi yang sudah ada beserta narasi manual yang telah diedit user.
 * Untuk alokasi baru, menginisialisasi amount dan narasi (prefill dari po_narasi jika ada).
 *
 * @param {Array} prevAllocations Daftar alokasi sebelum konfirmasi modal
 * @param {Array} selectedRows Daftar baris faktur yang dipilih dari modal
 * @returns {Array} Daftar alokasi baru
 */
export function mergeAllocationsFromModal(prevAllocations = [], selectedRows = []) {
  const map = new Map(prevAllocations.map((a) => [String(a.id), a]));
  selectedRows.forEach((r) => {
    const key = String(r.id);
    if (!map.has(key)) {
      map.set(key, {
        ...r,
        amount: String(r.sisa ?? r.total ?? 0),
        narasi: buildAllocationNarasi(r.narasi, r.po_narasi),
      });
    }
  });
  return [...map.values()];
}
