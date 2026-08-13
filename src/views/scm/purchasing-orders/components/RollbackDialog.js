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

const ROLLBACK_LABELS = {
  to_pr: "Rollback ke PR (Soft Delete PO)",
  to_open: "Rollback ke Open (Null Verified)",
};

/** Dialog to confirm rollback with preflight impact preview. */
export default function RollbackDialog({
  open,
  loading,
  preview,
  onRollback,
  onClose,
}) {
  const [reason, setReason] = useState("");
  const rollbackAllowed = preview?.rollback_allowed;
  const rollbackType = preview?.rollback_type;
  const disabled = !reason.trim() || !rollbackAllowed;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {ROLLBACK_LABELS[rollbackType] || "Rollback Purchase Order"}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity={rollbackAllowed ? "warning" : "error"}>
              {preview?.description ||
                (rollbackAllowed
                  ? "Rollback akan dilakukan sesuai status dokumen."
                  : "Status ini tidak dapat di-rollback.")}
            </Alert>
            {preview?.impact && (
              <Typography variant="body2" color="text.secondary">
                Dampak: {preview.impact.delivery_waiting} delivery waiting,{" "}
                {preview.impact.invoices} faktur.
              </Typography>
            )}
            <TextField
              label="Alasan rollback"
              multiline
              minRows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={loading}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => onRollback(reason)}
          disabled={disabled || loading}
        >
          Rollback
        </Button>
      </DialogActions>
    </Dialog>
  );
}