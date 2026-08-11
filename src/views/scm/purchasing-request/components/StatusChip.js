"use client";

import { Chip } from "@mui/material";

const STATUS = {
  draft: { label: "Draft", color: "default" },
  active: { label: "Check", color: "warning" },
  approved: { label: "Validate", color: "info" },
  finish: { label: "Finish", color: "success" },
  done: { label: "Finish", color: "success" },
};

/** Maps a request status or priority value to its display chip. */
export default function StatusChip({ status, size = "small" }) {
  const normalized = String(status || "draft").toLowerCase();
  const config = STATUS[normalized] || {
    label: status || "-",
    color: "default",
  };
  return (
    <Chip
      size={size}
      color={config.color}
      label={config.label}
      sx={{ fontWeight: 600 }}
    />
  );
}
