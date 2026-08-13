/** Formats a numeric value as Indonesian rupiah display text. */
export const formatCurrency = (value) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
};

/** Status label + color mapping for the PO lifecycle. */
export const STATUS_META = {
  open: { label: "Baru", color: "warning" },
  verify: { label: "Menunggu Verifikasi", color: "info" },
  close: { label: "Diproses", color: "success" },
};

export const getStatusMeta = (status) =>
  STATUS_META[String(status || "").toLowerCase()] || {
    label: status || "-",
    color: "default",
  };

/** Finds an option whose identifier matches the supplied value. */
export const getSelectedOption = (options, id) =>
  options.find((option) => String(option.id) === String(id)) || null;

/** Reads a nested relation name safely across common backend shapes. */
export const getRelationName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.nama || value.name || value.initial || value.kode || "";
};

/** Computes the canonical per-item financial values (mirrors backend). */
export const calculateItemTotals = (item) => {
  const qty = Number(item.qty || 0);
  const unitPrice = Number(item.harga || 0);
  const exchangeRate =
    String(item.currency || "IDR").toUpperCase() === "USD"
      ? Number(item.kurs || 0)
      : 1;
  const discount = Number(item.potongan || 0);
  const taxRate = Number(item.ppn || 0);

  const gross = Math.round(qty * unitPrice * exchangeRate * 100) / 100;
  const net = Math.max(0, gross - discount);
  const taxAmount = Math.round(net * (taxRate / 100) * 100) / 100;
  const grandTotal = Math.round((net + taxAmount) * 100) / 100;

  return {
    gross,
    net,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    round_total: Math.ceil(grandTotal),
  };
};

/** Sums active items into header totals. */
export const calculateHeaderTotals = (items) => {
  const active = (items || []).filter((item) => item.aktif !== "N");
  return active.reduce(
    (acc, item) => {
      const computed = calculateItemTotals(item);
      return {
        gross: acc.gross + computed.gross,
        discount: acc.discount + Number(item.potongan || 0),
        tax_amount: acc.tax_amount + computed.tax_amount,
        grand_total: acc.grand_total + computed.grand_total,
      };
    },
    { gross: 0, discount: 0, tax_amount: 0, grand_total: 0 },
  );
};