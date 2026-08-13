"use client";

import { Alert, Box, Chip, Stack, Typography } from "@mui/material";

/** Lists the downstream documents (invoices, payments, delivery waiting) linked to a PO. */
export default function DownstreamLinks({ row, reconciliation }) {
  if (!row) return null;

  const invoices = row.invoices || [];
  const payments = row.payments || [];
  const deliveries = row.deliveries || [];
  const mismatch = reconciliation?.mismatch;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Downstream Documents
      </Typography>
      {mismatch !== undefined && (
        <Alert severity={mismatch ? "error" : "success"} sx={{ mb: 2 }}>
          {mismatch
            ? "Ditemukan ketidaksesuaian nilai downstream dengan PO. Tinjau rekonsiliasi."
            : "Nilai downstream konsisten dengan PO."}
        </Alert>
      )}
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={`Faktur: ${reconciliation?.invoice_count ?? invoices.length}`}
            color="info"
          />
          <Chip
            label={`Pembayaran: ${reconciliation?.payment_count ?? payments.length}`}
            color="warning"
          />
          <Chip
            label={`Delivery Waiting: ${reconciliation?.delivery_waiting_count ?? deliveries.length}`}
            color="success"
          />
          <Chip
            label={`Monitoring: ${reconciliation?.monitoring_count ?? 0}`}
            color="default"
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Total Faktur: {reconciliation?.invoice_total ?? 0} · Total Pembayaran:{" "}
          {reconciliation?.payment_total ?? 0}
        </Typography>
      </Stack>
    </Box>
  );
}