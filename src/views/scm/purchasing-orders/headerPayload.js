export const PURCHASE_ORDER_PRIORITIES = [
  { value: "P1", label: "P1 - Urgent" },
  { value: "P2", label: "P2 - Tinggi" },
  { value: "P3", label: "P3 - Normal" },
  { value: "P4", label: "P4 - Rendah" },
];

export const PURCHASE_ORDER_TOP_TYPES = [
  { value: "CASH", label: "Tunai / COD (CASH)", description: "Pembayaran saat serah terima barang" },
  { value: "CREDIT", label: "Kredit Net Hari (CREDIT)", description: "Pembayaran jatuh tempo setelah barang diterima" },
  { value: "INSTALLMENT", label: "Bertahap DP + Pelunasan (INSTALLMENT)", description: "Uang muka saat PO dan pelunasan setelah barang diterima" },
];

export const PURCHASE_ORDER_METODE_OPTIONS = [
  { value: "tunai", label: "Tunai", description: "Pembayaran tunai / COD / bayar lunas di muka (CASH)" },
  { value: "kredit", label: "Kredit", description: "Pembayaran dengan termin kredit / bertahap (CREDIT / INSTALLMENT)" },
];

/**
 * Validates and normalizes payment terms (TOP: CASH, CREDIT, INSTALLMENT) & synchronizes metode (tunai/kredit).
 * Sesuai BR-SCM-002:
 * - CASH -> metode otomatis 'tunai'
 * - CREDIT / INSTALLMENT -> metode otomatis 'kredit'
 */
export const normalizePaymentTerms = ({ top_type = "CASH", top_days = 0, dp_percent = 0, metode } = {}) => {
  const type = String(top_type || "CASH").toUpperCase();
  if (!["CASH", "CREDIT", "INSTALLMENT"].includes(type)) {
    throw new Error("Syarat pembayaran harus berupa CASH, CREDIT, atau INSTALLMENT");
  }

  const derivedMetode = type === "CASH" ? "tunai" : "kredit";
  const finalMetode =
    metode && ["tunai", "kredit"].includes(String(metode).toLowerCase())
      ? String(metode).toLowerCase()
      : derivedMetode;

  if (type === "CASH") {
    return { top_type: "CASH", top_days: 0, dp_percent: 0, metode: "tunai" };
  }

  if (type === "CREDIT") {
    const days = parseInt(top_days, 10);
    if (isNaN(days) || days <= 0) {
      throw new Error("Masa kredit (top_days) harus berupa angka positif lebih dari 0 hari");
    }
    return { top_type: "CREDIT", top_days: days, dp_percent: 0, metode: finalMetode };
  }

  if (type === "INSTALLMENT") {
    const percent = parseFloat(dp_percent);
    if (isNaN(percent) || percent < 1 || percent > 99) {
      throw new Error("Persentase uang muka (DP) harus di antara 1% dan 99%");
    }
    const days = parseInt(top_days, 10);
    if (isNaN(days) || days <= 0) {
      throw new Error("Masa kredit pelunasan (top_days) harus berupa angka positif lebih dari 0 hari");
    }
    return { top_type: "INSTALLMENT", top_days: days, dp_percent: percent, metode: "kredit" };
  }
};

/** Limit partial edits to their own fields; bank edits must not overwrite priority. */
export const buildPurchaseOrderHeaderPayload = ({
  initialMode = "all",
  modeRekening = "existing",
  selectedRekeningId = "",
  nmBank = "",
  noRekening = "",
  an = "",
  prioritas = "",
  narasi = "",
  top_type,
  top_days,
  dp_percent,
  metode,
}) => {
  if (initialMode === "narasi") return { narasi };
  if (initialMode === "top") {
    return normalizePaymentTerms({ top_type, top_days, dp_percent, metode });
  }
  if (!["all", "rekening", "new_rekening"].includes(initialMode)) {
    throw new Error("Mode edit header PO tidak valid");
  }

  const payload = {};
  if (initialMode === "all") {
    payload.narasi = narasi;
    if (prioritas) {
      if (!PURCHASE_ORDER_PRIORITIES.some((option) => option.value === prioritas)) {
        throw new Error("Prioritas PO harus berupa P1, P2, P3, atau P4");
      }
      payload.prioritas = prioritas;
    }
    if (top_type !== undefined || metode !== undefined) {
      const terms = normalizePaymentTerms({ top_type, top_days, dp_percent, metode });
      Object.assign(payload, terms);
    }
  }

  if (modeRekening === "new") {
    if (!nmBank.trim() || !noRekening.trim()) {
      throw new Error("Nama bank dan nomor rekening baru wajib diisi");
    }
    payload.nm_bank = nmBank.trim();
    payload.no_rekening = noRekening.trim();
    payload.an = an.trim() || null;
  } else {
    payload.rekening_id = selectedRekeningId ? Number(selectedRekeningId) : null;
  }
  return payload;
};
