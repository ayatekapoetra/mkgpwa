"use client";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

/**
 * Confirmation dialog for deleting/deactivating a Purchasing Request (PRD-FEAT-SCM-003).
 */
export default function DeletePrDialog({
  open,
  row,
  loading = false,
  onClose,
  onConfirm,
}) {
  const kode = row?.kode || "-";

  return (
    <Dialog
      open={Boolean(open)}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Hapus Purchasing Request</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          Apakah Anda yakin ingin menghapus / menonaktifkan Purchasing Request{" "}
          <Typography component="span" fontWeight={700} color="text.primary">
            {kode}
          </Typography>
          ? Tindakan ini akan menonaktifkan berkas PR yang tidak terpakai dari sistem.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
