/** Formats a numeric value as Indonesian rupiah display text. */
export const formatCurrency = (value) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
};

/** Calculates gross, tax, and subtotal values for a request item. */
export const calculateItemTotals = (item) => {
  const grossTotal =
    Number(item.qty_acc || 0) *
    Number(item.harga || 0) *
    (item.currency === "USD" ? Number(item.kurs || 0) : 1);
  const taxableTotal = Math.max(0, grossTotal - Number(item.potongan || 0));
  const taxTotal = (taxableTotal * Number(item.ppn || 0)) / 100;

  return {
    tot_harga: grossTotal,
    ppn_rp: taxTotal,
    subtotal: taxableTotal + taxTotal,
  };
};

/** Calculates aggregated financial metrics for active request items. */
export const calculateDocumentTotals = ({
  row = null,
  items,
  drafts = null,
} = {}) => {
  // An available empty list is authoritative (including after the last deletion).
  const hasItems = Array.isArray(items) || Array.isArray(row?.items);
  const rawItems = Array.isArray(items) ? items : (row?.items || []);
  const activeItems = (rawItems || []).filter(
    (item) => item && item.aktif !== "N",
  );

  const effectiveItems = activeItems.map((item) => {
    if (drafts && drafts[item.id]) {
      return { ...item, ...drafts[item.id] };
    }
    return item;
  });

  const totalGross = effectiveItems.reduce((acc, item) => {
    if (
      item.tot_harga !== undefined &&
      item.tot_harga !== null &&
      Number(item.tot_harga) > 0
    ) {
      return acc + Number(item.tot_harga);
    }
    const qty = Number(item.qty_acc ?? item.qty_req ?? item.qty ?? 0);
    const harga = Number(item.harga || 0);
    const kurs = item.currency === "USD" ? (Number(item.kurs) || 1) : 1;
    return acc + qty * harga * kurs;
  }, 0);

  const totalDiscount = effectiveItems.reduce(
    (acc, item) => acc + Number(item.potongan || 0),
    0,
  );

  const totalPpn = effectiveItems.reduce((acc, item) => {
    if (
      item.ppn_rp !== undefined &&
      item.ppn_rp !== null &&
      Number(item.ppn_rp) > 0
    ) {
      return acc + Number(item.ppn_rp);
    }
    const qty = Number(item.qty_acc ?? item.qty_req ?? item.qty ?? 0);
    const harga = Number(item.harga || 0);
    const kurs = item.currency === "USD" ? (Number(item.kurs) || 1) : 1;
    const gross = qty * harga * kurs;
    const taxable = Math.max(0, gross - Number(item.potongan || 0));
    return acc + (taxable * Number(item.ppn || 0)) / 100;
  }, 0);

  const itemsSubtotal = effectiveItems.reduce((acc, item) => {
    if (
      item.subtotal !== undefined &&
      item.subtotal !== null &&
      Number(item.subtotal) > 0
    ) {
      return acc + Number(item.subtotal);
    }
    const qty = Number(item.qty_acc ?? item.qty_req ?? item.qty ?? 0);
    const harga = Number(item.harga || 0);
    const kurs = item.currency === "USD" ? (Number(item.kurs) || 1) : 1;
    const gross = qty * harga * kurs;
    const taxable = Math.max(0, gross - Number(item.potongan || 0));
    const ppn = (taxable * Number(item.ppn || 0)) / 100;
    return acc + (taxable + ppn);
  }, 0);

  const rowTotal = Number(row?.total_ro || 0);
  const grandTotal = hasItems ? itemsSubtotal : rowTotal;

  const validatedCount = effectiveItems.filter(
    (item) => item.user_validated || item.date_validated,
  ).length;
  const approvedCount = effectiveItems.filter(
    (item) => item.user_approved || item.date_approved,
  ).length;

  const hasValidatedPrice =
    grandTotal > 0 || validatedCount > 0 || approvedCount > 0;

  return {
    itemCount: effectiveItems.length,
    validatedCount,
    approvedCount,
    totalGross,
    totalDiscount,
    totalPpn,
    itemsSubtotal,
    grandTotal,
    hasValidatedPrice,
  };
};

/** Finds an option whose identifier matches the supplied value. */
export const getSelectedOption = (options, id) => {
  return options.find((option) => String(option.id) === String(id)) || null;
};

/** Reads a nested relation name safely across common backend shapes. */
export const getRelationName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.nama || value.name || value.initial || value.kode || "";
};

/** Builds a human-readable spare-part title. */
export const getBarangDisplayName = (barang) => {
  if (!barang) return "Sparepart belum dipilih";
  return barang.nama || barang.name || `Barang #${barang.id || "-"}`;
};

/** Builds the primary code label for a spare part. */
export const getBarangPrimaryCode = (barang) => {
  if (!barang) return "-";
  return barang.kode || barang.num_part || `ID-${barang.id || "-"}`;
};

/** Builds searchable text used by spare-part autocomplete options. */
export const getBarangSearchText = (barang) => {
  if (!barang) return "";

  return [
    barang.kode,
    barang.nama || barang.name,
    barang.num_part,
    barang.serial,
    barang.satuan || barang.stn,
    barang.stn_pakai,
    getRelationName(barang.manufacture),
    getRelationName(barang.brand),
    getRelationName(barang.application),
    getRelationName(barang.kategori),
    barang.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

/** Builds a compact option label for spare-part autocomplete. */
export const getBarangOptionLabel = (barang) => {
  if (!barang) return "";

  const parts = [
    barang.kode,
    barang.nama || barang.name,
    barang.num_part ? `PN ${barang.num_part}` : "",
  ].filter(Boolean);

  return parts.join(" · ");
};

/** Builds structured fields shown on spare-part detail panels. */
export const getBarangInfoFields = (barang) => {
  if (!barang) return [];

  return [
    {
      key: "kode",
      label: "Kode Barang",
      value: barang.kode || "-",
      colSpan: 1,
    },
    {
      key: "num_part",
      label: "Part Number",
      value: barang.num_part || "-",
      colSpan: 2,
    },
    {
      key: "manufacture",
      label: "Manufaktur",
      value: getRelationName(barang.manufacture) || "-",
      colSpan: 1,
    },
    {
      key: "brand",
      label: "Brand",
      value: getRelationName(barang.brand) || "-",
      colSpan: 1,
    },
    {
      key: "application",
      label: "Aplikasi",
      value:
        getRelationName(barang.application) ||
        barang.application ||
        barang.category ||
        "-",
      colSpan: 1,
    },
    {
      key: "kategori",
      label: "Kategori",
      value: getRelationName(barang.kategori) || barang.category || "-",
      colSpan: 1,
    },
    {
      key: "satuan",
      label: "Satuan Order",
      value: barang.satuan || barang.stn || "-",
      colSpan: 1,
    },
    {
      key: "stn_pakai",
      label: "Satuan Pakai",
      value: barang.stn_pakai || "-",
      colSpan: 1,
    },
  ];
};

/** Calculates row summary statistics for the list view. */
export const calculateItemStats = (row) => {
  const items = (row?.items || []).filter((item) => item && item.aktif !== "N");
  const totals = calculateDocumentTotals({ row });

  return {
    total: items.length,
    validated: totals.validatedCount,
    approved: totals.approvedCount,
    totalGross: totals.totalGross,
    totalDiscount: totals.totalDiscount,
    totalPpn: totals.totalPpn,
    grandTotal: totals.grandTotal,
    hasValidatedPrice: totals.hasValidatedPrice,
  };
};

/** Checks whether a request description has non-empty content. */
export const hasDescriptionContent = (description) => {
  if (description === null || description === undefined) {
    return false;
  }
  return String(description).trim().length > 0;
};

/** Formats purchasing request description with custom fallback for empty values. */
export const getRequestDescription = (description, fallback = "-") => {
  return hasDescriptionContent(description) ? String(description).trim() : fallback;
};
