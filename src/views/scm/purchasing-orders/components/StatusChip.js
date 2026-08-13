"use client";

import { Chip } from "@mui/material";
import { getStatusMeta } from "../utils";

/** Renders a colored status chip for a purchase order lifecycle state. */
export default function StatusChip({ status }) {
  const meta = getStatusMeta(status);
  return <Chip size="small" label={meta.label} color={meta.color} />;
}