/**
 * Helper to group Purchasing Request items for Purchase Order creation (PRD-SCM-002: AC-SCM-001, AC-SCM-002, AC-SCM-005).
 * Grouping dimension: [pemasok_id, ppn, metode].
 */

export const normalizeMetode = (metode) => {
  if (!metode) return "kredit";
  const m = String(metode).trim().toLowerCase();
  return m === "tunai" ? "tunai" : "kredit";
};

export const getDefaultTopForMetode = (metode) => {
  const norm = normalizeMetode(metode);
  if (norm === "tunai") {
    return {
      top_type: "CASH",
      top_days: 0,
      label: "Tunai / COD (CASH)",
      description: "Pembayaran saat serah terima barang (0 hari)",
    };
  }
  return {
    top_type: "CREDIT",
    top_days: 30,
    label: "Kredit Net 30 Hari (CREDIT)",
    description: "Pembayaran jatuh tempo 30 hari kalender setelah barang diterima",
  };
};

export const groupApprovalItems = (items = [], metodeOverrides = {}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const groupMap = new Map();

  for (const item of items) {
    const pemasokId = item.pemasok_id || item.pemasok?.id || 0;
    const pemasokName =
      item.pemasok?.nama_pemasok ||
      item.pemasok?.nama ||
      item.pemasok?.name ||
      "Pemasok Tidak Diketahui";

    const ppnRate = Number(item.ppn) || 0;
    const rawMetode =
      metodeOverrides && metodeOverrides[item.id] !== undefined
        ? metodeOverrides[item.id]
        : item.metode;
    const metode = normalizeMetode(rawMetode);

    const groupKey = `${pemasokId}__${ppnRate}__${metode}`;

    if (!groupMap.has(groupKey)) {
      const topInfo = getDefaultTopForMetode(metode);
      groupMap.set(groupKey, {
        group_key: groupKey,
        pemasok_id: pemasokId,
        pemasok_name: pemasokName,
        ppn_rate: ppnRate,
        is_ppn: ppnRate > 0,
        ppn_label: ppnRate > 0 ? `PPN ${ppnRate}%` : "Non-PPN (0%)",
        metode,
        metode_label: metode === "tunai" ? "Tunai" : "Kredit",
        default_top: topInfo,
        items: [],
        total_qty: 0,
        subtotal: 0,
        ppn_rp: 0,
        grandtotal: 0,
      });
    }

    const group = groupMap.get(groupKey);
    const itemSubtotal =
      Number(item.subtotal) ||
      (Number(item.qty_acc || item.qty || 0) * Number(item.harga || 0));
    const itemPpnRp =
      ppnRate > 0 ? Math.round(itemSubtotal * (ppnRate / 100)) : 0;

    group.items.push({
      ...item,
      resolved_metode: metode,
    });
    group.total_qty += Number(item.qty_acc || item.qty || 0);
    group.subtotal += itemSubtotal;
    group.ppn_rp += itemPpnRp;
    group.grandtotal += itemSubtotal + itemPpnRp;
  }

  return Array.from(groupMap.values());
};
