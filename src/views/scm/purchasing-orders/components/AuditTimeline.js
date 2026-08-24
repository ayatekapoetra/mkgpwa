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

const labelFor = (event) => EVENT_LABELS[event] || event || "Event";

const parseChange = (raw) => {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return raw;
  }
};

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
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {row.created_at
                ? moment(row.created_at).format("DD MMM YYYY HH:mm")
                : "-"}
            </Typography>
          </Stack>
          {(row.before || row.after || row.reason) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {row.reason ? `Alasan: ${row.reason} · ` : ""}
              {row.before || row.after
                ? `Perubahan: ${JSON.stringify({
                    before: parseChange(row.before),
                    after: parseChange(row.after),
                  })}`
                : ""}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
}