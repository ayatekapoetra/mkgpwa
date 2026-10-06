"use client";

import {
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

const EVENT_LABELS = {
  prepared: "Persiapan",
  submitted: "Diajukan",
  verified: "Diverifikasi",
  returned: "Dikembalikan",
  finalized: "Difinalisasi",
  rollback: "Rollback",
  cancel: "Ditolak",
  reject: "Ditolak",
  attachment_uploaded: "Lampiran",
  attachment_deleted: "Hapus Lampiran",
  so_code_updated: "Update SO",
};

const FIELD_LABELS = {
  status: "Status",
  sts_code: "Kode status",
  payment_id: "ID pembayaran",
};

const STATUS_LABELS = {
  open: "Open",
  verify: "Verify",
  close: "Close",
  reject: "Reject",
  approval: "Approval",
  approved: "Approved",
};

const labelFor = (event) => EVENT_LABELS[event] || event || "Event";

const parseChange = (raw) => {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return raw;
  }
};

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "status") return STATUS_LABELS[String(value).toLowerCase()] || value;
  return String(value);
};

function ChangeSummary({ before, after }) {
  const previous = parseChange(before) || {};
  const next = parseChange(after) || {};
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])]
    .filter((key) => key !== "payment_id" || next[key] !== undefined);

  if (!keys.length) return null;

  return (
    <Box sx={{ mt: 1, p: 1.25, bgcolor: "grey.50", borderRadius: 1.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        Perubahan
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        {keys.map((key) => (
          <Stack key={key} direction="row" spacing={1} alignItems="baseline">
            <Typography variant="caption" sx={{ minWidth: 105, fontWeight: 700 }}>
              {FIELD_LABELS[key] || key}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatValue(key, previous[key])} → {formatValue(key, next[key])}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

/** Append-only audit timeline of a purchase order. */
export default function AuditTimeline({ rows = [] }) {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Belum ada audit trail.
      </Typography>
    );
  }
  return (
    <Stack divider={<Divider flexItem />} spacing={1.5}>
      {rows.map((row, index) => (
        <Box key={`${row.id || index}`}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={labelFor(row.event)} color="primary" />
              <Typography variant="caption" color="text.secondary">
                {row.actor_id ? `User #${row.actor_id}` : "System"}
                {row.role ? ` · ${row.role}` : ""}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {row.created_at
                ? moment(row.created_at).format("DD MMM YYYY HH:mm")
                : "-"}
            </Typography>
          </Stack>
          {row.reason ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              <strong>Alasan:</strong> {row.reason}
            </Typography>
          ) : null}
          <ChangeSummary before={row.before} after={row.after} />
        </Box>
      ))}
    </Stack>
  );
}
