"use client";

import { Paper, Typography } from "@mui/material";

import ProgressIndicator from "./ProgressIndicator";

/** Summarizes validation and approval progress for active request items. */
export default function ProgressCard({ items }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Progress
      </Typography>
      <ProgressIndicator items={items} />
    </Paper>
  );
}
