"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

/** Confirmation dialog for status transitions and destructive actions. */
export default function ActionDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  color = "primary",
  loading = false,
  requireReason = false,
  reason = "",
  onReasonChange,
  onClose,
  onConfirm,
}) {
  const [localReason, setLocalReason] = useState("");
  const reasonValue = reason !== undefined ? reason : localReason;
  const reasonHandler = onReasonChange || setLocalReason;
  const disabled = requireReason && !reasonValue.trim();

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {requireReason && (
            <TextField
              label="Alasan"
              multiline
              minRows={2}
              value={reasonValue}
              onChange={(event) => reasonHandler(event.target.value)}
              disabled={loading}
            />
          )}
          {loading && (
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={color}
          variant="contained"
          disabled={disabled || loading}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Inline alert banner used by workflow actions. */
export function ActionAlert({ severity = "info", message }) {
  if (!message) return null;
  return <Alert severity={severity}>{message}</Alert>;
}