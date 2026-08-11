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
