"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { formatCurrency } from "../utils";

/** Modal that previews grouping and downstream documents before finalization. */
export default function FinalizationPreview({
  open,
  loading,
  preview,
  onClose,
  onConfirm,
  finalizing,
}) {
  const groups = preview?.metode_groups || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Preview Finalisasi</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Finalisasi akan membuat dokumen downstream berikut sesuai grouping
              metode pembayaran. Pastikan seluruh nilai sudah benar sebelum
              konfirmasi.
            </Typography>
            {groups.map((group) => (
              <Box
                key={group.metode}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Metode: {group.metode.toUpperCase()}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(group.grand_total)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Item: {group.item_count} · Net: {formatCurrency(group.net)} ·
                  PPN: {formatCurrency(group.tax_amount)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dokumen</TableCell>
                        <TableCell align="right">Jumlah/Nilai</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.documents?.map((doc) => (
                        <TableRow key={`${doc.type}-${doc.metode || ""}`}>
                          <TableCell>{doc.type}</TableCell>
                          <TableCell align="right">
                            {doc.count || formatCurrency(doc.total || 0)}
                            {doc.cashier_pending ? " (cashier pending)" : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={finalizing}>
          Batal
        </Button>
        <Button
          color="success"
          variant="contained"
          onClick={onConfirm}
          disabled={loading || finalizing || groups.length === 0}
        >
          {finalizing ? "Memfinalisasi..." : "Finalisasi PO"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}