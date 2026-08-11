"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import moment from "moment";

import {
  getPurchasingRequestError,
  usePurchasingRequestSupplierRecommendations,
} from "api/purchasing-request";
import { formatCurrency } from "../utils";

export default function SupplierRecommendationDialog({
  open,
  onClose,
  barang,
  orderUnit,
}) {
  const { data, rows, loading, error } =
    usePurchasingRequestSupplierRecommendations(
      barang?.id,
      orderUnit,
      open,
    );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Rekomendasi Pemasok Termurah</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {barang?.nama || barang?.name || "Sparepart"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Histori 12 bulan terakhir dengan satuan order {orderUnit || "-"}
              {data.period_start && data.period_end
                ? ` (${moment(data.period_start).format("DD MMM YYYY")} - ${moment(
                    data.period_end,
                  ).format("DD MMM YYYY")})`
                : ""}
            </Typography>
          </Box>

          {error && (
            <Alert severity="warning">
              {getPurchasingRequestError(
                error,
                "Rekomendasi pemasok gagal dimuat.",
              ).message}
            </Alert>
          )}

          {loading && (
            <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
              <CircularProgress size={30} />
              <Typography variant="body2" color="text.secondary">
                Menghitung rekomendasi pemasok...
              </Typography>
            </Stack>
          )}

          {!loading && !error && rows.length === 0 && (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography fontWeight={700}>Belum ada rekomendasi</Typography>
              <Typography variant="body2" color="text.secondary">
                Tidak ditemukan pembelian yang sudah disetujui dalam 12 bulan
                terakhir dengan satuan order yang sama.
              </Typography>
            </Box>
          )}

          {!loading && !error && rows.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={64}>Rank</TableCell>
                    <TableCell>Pemasok</TableCell>
                    <TableCell>Alamat Pemasok</TableCell>
                    <TableCell align="right">Harga Termurah</TableCell>
                    <TableCell align="right">Rata-rata</TableCell>
                    <TableCell align="center">Transaksi</TableCell>
                    <TableCell>Pembelian Terakhir</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.supplier_id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          color={row.rank === 1 ? "success" : "default"}
                          label={`#${row.rank}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.supplier_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.supplier_code || "Tanpa kode"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {row.supplier_address || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(row.lowest_unit_price_idr)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          per {row.order_unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(row.weighted_average_unit_price_idr)}
                      </TableCell>
                      <TableCell align="center">{row.purchase_count}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.latest_purchase_date
                            ? moment(row.latest_purchase_date).format(
                                "DD MMM YYYY",
                              )
                            : "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.best_purchase?.purchase_request_code || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );
}
