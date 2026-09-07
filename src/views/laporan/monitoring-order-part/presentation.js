const quantityFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});

export const STAGES = [
  { key: "mro", label: "MRO" },
  { key: "pr", label: "PR" },
  { key: "po", label: "PO" },
  { key: "invoice", label: "FB" },
  { key: "payment", label: "PAY" },
  { key: "delivery", label: "DO" },
  { key: "shipping", label: "SL" },
  { key: "receipt", label: "RO" },
];

export const PROCUREMENT_STAGES = [
  "MRO",
  "PR_SUBMITTED",
  "PR_VALIDATED",
  "PR_APPROVED",
  "PO_CREATED",
  "PO_VERIFIED",
  "PO_CLOSED",
  "REJECTED",
  "CANCELLED",
];
export const FINANCE_STAGES = [
  "NOT_REQUIRED",
  "NOT_STARTED",
  "INVOICED",
  "PARTIALLY_PAID",
  "PAID",
];
export const FULFILLMENT_STAGES = [
  "NOT_STARTED",
  "DELIVERY_PREPARED",
  "PARTIALLY_SHIPPED",
  "SHIPPED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
];
export const CURRENT_STAGES = [
  ...new Set([
    "UNKNOWN",
    ...PROCUREMENT_STAGES,
    ...FINANCE_STAGES,
    ...FULFILLMENT_STAGES,
  ]),
];

const LABELS = {
  PR_SUBMITTED: "PR Submitted",
  PR_VALIDATED: "PR Validated",
  PR_APPROVED: "PR Approved",
  PO_CREATED: "PO Created",
  PO_VERIFIED: "PO Verified",
  PO_CLOSED: "PO Closed",
  NOT_REQUIRED: "Tidak diperlukan",
  NOT_STARTED: "Belum dimulai",
  PARTIALLY_PAID: "Dibayar sebagian",
  DELIVERY_PREPARED: "Delivery disiapkan",
  PARTIALLY_SHIPPED: "Dikirim sebagian",
  PARTIALLY_RECEIVED: "Diterima sebagian",
  RECEIVED: "Diterima",
  SHIPPED: "Dikirim",
  INVOICED: "Invoiced",
  PAID: "Lunas",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
  UNKNOWN: "Tidak diketahui",
};

export const displayValue = (value, fallback = "-") =>
  value === undefined || value === null || value === "" ? fallback : value;
export const stageLabel = (stage) =>
  LABELS[stage] ||
  String(stage || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const formatQuantity = (value) =>
  Number.isFinite(Number(value))
    ? quantityFormatter.format(Number(value))
    : "-";
export const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(
    "id-ID",
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  );
};
export const errorMessage = (
  error,
  fallback = "Gagal memuat Monitoring Status Order Part.",
) =>
  error?.response?.data?.diagnostic?.message ||
  error?.diagnostic?.message ||
  error?.message ||
  fallback;

export const stageColor = (stage) => {
  if (["REJECTED", "CANCELLED", "error"].includes(stage)) return "error";
  if (
    String(stage).startsWith("PARTIALLY") ||
    ["partial", "warning"].includes(stage)
  )
    return "warning";
  if (["RECEIVED", "PAID", "completed", "synced"].includes(stage))
    return "success";
  if (["UNKNOWN", "unavailable", "NOT_STARTED"].includes(stage))
    return "default";
  return "primary";
};

export const stageState = (row, key) =>
  row?.stages?.[key] ||
  row?.stages?.[
    key === "pr" ? "pr_submitted" : key === "po" ? "po_created" : key
  ] ||
  {};
export const stageAvailable = (stage) =>
  Boolean(stage?.document_id || stage?.document_code) &&
  !["not_started", "unavailable"].includes(stage?.state);
