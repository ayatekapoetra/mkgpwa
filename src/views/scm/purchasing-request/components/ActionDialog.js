"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

/** Presents a reusable confirmation dialog with an optional required reason. */
export default function ActionDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  color = "primary",
  loading,
  reason,
  onReasonChange,
  requireReason = false,
  onClose,
  onConfirm,
  children,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {description && <DialogContentText>{description}</DialogContentText>}
          {children}
          {requireReason && (
            <TextField
              label="Alasan"
              multiline
              minRows={3}
              value={reason || ""}
              onChange={(event) => onReasonChange(event.target.value)}
              required
              helperText="Minimal 10 karakter"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant="contained"
          color={color}
          onClick={onConfirm}
          disabled={
            loading ||
            (requireReason && String(reason || "").trim().length < 10)
          }
        >
          {loading ? "Memproses..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
