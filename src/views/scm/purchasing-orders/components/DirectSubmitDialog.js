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
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { formatCurrency } from "../utils";

/**
 * SCM-005 (PRD-SCM-005 v1.0, Q-04 A): mandatory confirmation dialog before
 * executing the direct "Ajukan Verifikasi" action. Shows the downstream
 * document summary — faktur beli + rencana pembayaran tunai/kredit/termin
 * + nilai total — with an explicit continue button; both buttons are
 * disabled while the action is in flight (BR-02 double-submit guard).
 */
export default function DirectSubmitDialog({
  open,
  loading = false,
  summary,
  onClose,
  onConfirm,
}) {
  const groups = summary?.groups || [];
  const hasItems = groups.length > 0;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Ajukan Verifikasi &amp; Bentuk Rencana Pembayaran</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Aksi ini memvalidasi, memfinalisasi, dan membentuk dokumen turunan
            dalam satu langkah. Status dokumen menjadi <b>Diproses</b> dan tidak
            dapat di-rollback. Periksa ringkasan berikut sebelum melanjutkan.
          </Typography>

          {!hasItems && !loading && (
            <Alert severity="warning">
              Dokumen tidak memiliki item aktif. Aksi akan ditolak oleh server.
            </Alert>
          )}

          {groups.map((group) => (
            <Box
              key={group.metode || "-"}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={(group.metode || "-").toUpperCase()}
                    color={group.metode === "tunai" ? "success" : "info"}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {group.item_count} item
                  </Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  {formatCurrency(group.grand_total)}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                {(group.documents || []).map((document) => (
                  <Typography
                    key={document}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    • {document}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}

          <Divider />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" color="text.secondary">
              Nilai total ({summary?.itemCount || 0} item)
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {formatCurrency(summary?.grandTotal || 0)}
            </Typography>
          </Stack>

          {loading && (
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={onConfirm}
          color="success"
          variant="contained"
          disabled={loading || !hasItems}
        >
          {loading ? "Memproses..." : "Lanjutkan Ajukan Verifikasi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}