"use client";

import { useMemo } from "react";
import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { calculateDocumentTotals, formatCurrency } from "../utils";

/**
 * Renders the document financial summary card for a Purchasing Request.
 * Displays Total Bruto, Total Diskon, Total PPN, and Estimasi Grand Total.
 * Only includes active items (aktif !== 'N').
 */
export default function DocumentSummaryCard({
  row = null,
  items = [],
  drafts = null,
}) {
  const totals = useMemo(
    () => calculateDocumentTotals({ row, items, drafts }),
    [row, items, drafts],
  );

  return (
    <Paper
      variant="outlined"
      data-testid="document-summary-card"
      sx={{
        p: 2.5,
        borderRadius: 1.5,
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Ringkasan Finansial Dokumen
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Akumulasi nilai pengadaan untuk seluruh item aktif ({totals.itemCount} item)
          </Typography>
        </Box>
        <Chip
          size="small"
          label={
            totals.hasValidatedPrice
              ? "Harga Tervalidasi"
              : "Menunggu Validasi Harga"
          }
          color={totals.hasValidatedPrice ? "success" : "default"}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {/* Metric 1: Total Bruto */}
        <Paper
          variant="outlined"
          data-testid="summary-bruto"
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: "action.hover",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Total Nilai Barang (Bruto)
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={totals.hasValidatedPrice ? "text.primary" : "text.secondary"}
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? formatCurrency(totals.totalGross)
              : "-"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? `${totals.itemCount} item aktif`
              : "Belum divalidasi"}
          </Typography>
        </Paper>

        {/* Metric 2: Total Diskon */}
        <Paper
          variant="outlined"
          data-testid="summary-diskon"
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: "action.hover",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Total Diskon / Potongan
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={totals.hasValidatedPrice ? "text.primary" : "text.secondary"}
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? totals.totalDiscount > 0
                ? `- ${formatCurrency(totals.totalDiscount)}`
                : formatCurrency(0)
              : "-"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? totals.totalDiscount > 0
                ? "Potongan harga vendor"
                : "Tanpa potongan"
              : "Belum divalidasi"}
          </Typography>
        </Paper>

        {/* Metric 3: Total PPN */}
        <Paper
          variant="outlined"
          data-testid="summary-ppn"
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: "action.hover",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Total PPN
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={totals.hasValidatedPrice ? "text.primary" : "text.secondary"}
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? totals.totalPpn > 0
                ? `+ ${formatCurrency(totals.totalPpn)}`
                : formatCurrency(0)
              : "-"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? totals.totalPpn > 0
                ? "Pajak Pertambahan Nilai"
                : "Non-PPN"
              : "Belum divalidasi"}
          </Typography>
        </Paper>

        {/* Metric 4: Estimasi Grand Total */}
        <Paper
          variant="outlined"
          data-testid="summary-grand-total"
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: totals.hasValidatedPrice ? "primary.lighter" : "action.hover",
            borderColor: totals.hasValidatedPrice ? "primary.main" : "divider",
            borderWidth: totals.hasValidatedPrice ? 1.5 : 1,
          }}
        >
          <Typography
            variant="caption"
            color={totals.hasValidatedPrice ? "primary.dark" : "text.secondary"}
            fontWeight={600}
          >
            Estimasi Grand Total PR
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={totals.hasValidatedPrice ? "primary.main" : "text.secondary"}
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? formatCurrency(totals.grandTotal)
              : "-"}
          </Typography>
          <Typography
            variant="caption"
            color={totals.hasValidatedPrice ? "primary.dark" : "text.secondary"}
            display="block"
            sx={{ mt: 0.5 }}
          >
            {totals.hasValidatedPrice
              ? "Grand total nilai pengadaan"
              : "Menunggu validasi harga"}
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
}
