"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { formatCurrency, calculateItemTotals } from "../utils";

/** Renders a single PO line item with its financial breakdown. */
export default function PurchaseOrderItemCard({ item, index, mode, value, onChange }) {
  const computed = calculateItemTotals(value || item);
  const barang = item.barang || {};
  const isNonPart = !item.barang_id;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Item #{index + 1}
              </Typography>
              <Typography variant="h6">
                {barang.nama || item.narasi || "Non-part item"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {barang.kode || "-"}
                {barang.num_part ? ` · PN ${barang.num_part}` : ""}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {isNonPart && <Chip size="small" label="Non-part" />}
              <Chip
                size="small"
                label={String(item.metode || "kredit").toUpperCase()}
                color={item.metode === "tunai" ? "warning" : "info"}
              />
            </Stack>
          </Stack>

          {mode === "prepare" && onChange ? (
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Qty
                </Typography>
                <Box>
                  <input
                    type="number"
                    defaultValue={value?.qty ?? item.qty ?? 0}
                    onBlur={(e) => onChange(item, "qty", Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Harga
                </Typography>
                <Box>
                  <input
                    type="number"
                    defaultValue={value?.harga ?? item.harga ?? 0}
                    onBlur={(e) => onChange(item, "harga", Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Diskon
                </Typography>
                <Box>
                  <input
                    type="number"
                    defaultValue={value?.potongan ?? item.potongan ?? 0}
                    onBlur={(e) => onChange(item, "potongan", Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  PPN (%)
                </Typography>
                <Box>
                  <input
                    type="number"
                    defaultValue={value?.ppn ?? item.ppn ?? 0}
                    onBlur={(e) => onChange(item, "ppn", Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Deskripsi / Narasi
                </Typography>
                <Box>
                  <input
                    type="text"
                    defaultValue={value?.narasi ?? item.narasi ?? ""}
                    onBlur={(e) => onChange(item, "narasi", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                  />
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Qty</Typography>
                <Typography variant="body2">{item.qty || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Harga</Typography>
                <Typography variant="body2">{formatCurrency(item.harga)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">PPN</Typography>
                <Typography variant="body2">{formatCurrency(computed.tax_amount)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Grand Total</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(computed.grand_total)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}