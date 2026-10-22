export const PURCHASE_ORDER_PRIORITIES = [
  { value: "P1", label: "P1 - Urgent" },
  { value: "P2", label: "P2 - Tinggi" },
  { value: "P3", label: "P3 - Normal" },
  { value: "P4", label: "P4 - Rendah" },
];

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
}) => {
  if (initialMode === "narasi") return { narasi };
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
