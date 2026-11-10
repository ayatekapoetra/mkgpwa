"use client";

import moment from "moment";
import "moment/locale/id";

moment.locale("id");

export const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

export const formatDate = (v) => {
  if (!v) return "—";
  const m = moment(v);
  return m.isValid() ? m.format("DD MMM YYYY") : String(v).slice(0, 10);
};

export const formatDateLong = (v) => {
  if (!v) return "—";
  const m = moment(v);
  return m.isValid() ? m.format("dddd, DD MMMM YYYY") : String(v).slice(0, 10);
};

export const STATUS_OPTIONS = [
  { value: "unpaid", label: "Belum Lunas" },
  { value: "paid", label: "Lunas" },
  { value: "partial", label: "Sebagian" },
  { value: "planned", label: "Sudah Direncanakan" },
  { value: "all", label: "Semua" },
];

export const TOP_TYPE_LABELS = {
  CASH: "Tunai",
  CREDIT: "Kredit",
  INSTALLMENT: "Termin",
};

export const INSTALLMENT_LABELS = {
  NONE: "—",
  AWAITING_DP: "Menunggu DP",
  DP_PAID: "DP Dibayar",
  AWAITING_DELIVERY: "Menunggu Barang",
  READY_TO_PAY: "Siap Bayar",
  COMPLETED: "Selesai",
};

export const buildDefaultFilters = () => ({
  status: "unpaid",
  bisnis_id: "",
  cabang_id: "",
  pemasok_id: "",
  top_type: "",
  metode: "",
  kdfb: "",
  no_po: "",
  no_pd: "",
  due_before: "",
  overdue_only: "",
  q: "",
  page: 1,
  perPage: 25,
});

export const agingColor = (days, row) => {
  if (row?.planned) return "info";
  if (!row?.is_overdue) return "success";
  if (days > 30) return "error";
  if (days > 7) return "warning";
  return "warning";
};

export const agingLabel = (row) => {
  if (row?.planned) return `Rencana: ${row.planned_kdbayar || "-"}`;
  if (!row?.next_due_date && !row?.due_date) return "Tanpa jatuh tempo";
  const days = Number(row?.aging_days) || 0;
  if (!days) return "Belum jatuh tempo";
  return `Lewat ${days} hari`;
};
