export const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return String(v);
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export const getDueDateMeta = (row, referenceDate = new Date()) => {
  const dueDateStr =
    row.next_due_date || row.due_date || row.tgl_jatuh_tempo || row.jatuh_tempo;
  if (!dueDateStr) {
    return {
      dateFormatted: "—",
      status: "none",
      label: "Tanpa Jatuh Tempo",
      color: "default",
      diffDays: null,
    };
  }

  const d = new Date(dueDateStr);
  const now = new Date(referenceDate);
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dOnly.getTime() - nowOnly.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (row.aging_days > 0 || diffDays < 0) {
    const overdueDays =
      row.aging_days > 0 ? row.aging_days : Math.abs(diffDays);
    return {
      dateFormatted: formatDate(dueDateStr),
      status: "overdue",
      label: `Lewat ${overdueDays} hari`,
      color: "error",
      diffDays,
    };
  }

  if (diffDays <= 3) {
    return {
      dateFormatted: formatDate(dueDateStr),
      status: "due_soon",
      label: diffDays === 0 ? "Jatuh tempo hari ini" : `${diffDays} hari lagi`,
      color: "warning",
      diffDays,
    };
  }

  return {
    dateFormatted: formatDate(dueDateStr),
    status: "safe",
    label: `Aman (${diffDays} hari lagi)`,
    color: "success",
    diffDays,
  };
};

export const getDeliveryMeta = (row) => {
  const isReceived =
    Boolean(row.goods_received_at) || row.status_pengiriman === "RECEIVED";
  return {
    isReceived,
    label:
      row.status_pengiriman_label ||
      (isReceived ? "Barang Diterima" : "Menunggu Barang (GRN)"),
    color: isReceived ? "success" : "default",
    receivedAt: row.goods_received_at ? formatDate(row.goods_received_at) : null,
  };
};

export const getTerminLabel = (row) => {
  if (row.termin_no) {
    const terminName =
      row.termin_name ||
      (row.termin_no === 1 && row.top_type === "INSTALLMENT"
        ? "DP"
        : "Pelunasan");
    return `Termin ${row.termin_no} (${terminName})`;
  }
  if (row.top_type === "INSTALLMENT") {
    return "Bertahap (DP/Pelunasan)";
  }
  return null;
};

export const isRowPayable = (row) => {
  return row.is_payable !== false && !row.disabled;
};

export const getUnpayableReason = (row) => {
  if (isRowPayable(row)) return "";
  return (
    row.reason_unpayable ||
    "Barang belum diterima (GRN pending), pelunasan belum dapat diproses kasir."
  );
};
