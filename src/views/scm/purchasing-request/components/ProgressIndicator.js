"use client";

import { Box, LinearProgress, Stack, Typography } from "@mui/material";

/** Visualizes validation and approval completion across active request items. */
export default function ProgressIndicator({ items = [] }) {
  const active = items.filter((item) => item.aktif !== "N");
  const total = active.length;
  const validated = active.filter(
    (item) => item.user_validated || item.date_validated,
  ).length;
  const approved = active.filter(
    (item) => item.user_approved || item.date_approved,
  ).length;
  const calculatePercentage = (value) => {
    return total ? Math.round((value / total) * 100) : 0;
  };

  return (
    <Stack spacing={1.25}>
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption">Validasi</Typography>
          <Typography variant="caption">
            {validated}/{total}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={calculatePercentage(validated)}
          color="warning"
          sx={{ mt: 0.5, height: 7, borderRadius: 4 }}
        />
      </Box>
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption">Approval</Typography>
          <Typography variant="caption">
            {approved}/{total}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={calculatePercentage(approved)}
          color="success"
          sx={{ mt: 0.5, height: 7, borderRadius: 4 }}
        />
      </Box>
    </Stack>
  );
}
