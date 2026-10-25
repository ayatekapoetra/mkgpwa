"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CalendarEdit } from "iconsax-react";

import { rescheduleDueDate } from "api/order-payments";
import { openNotification } from "api/notification";
import {
  buildReschedulePayload,
  canRescheduleDueDate,
  normalizeDateString,
  shouldDisableSubmit,
  validateRescheduleInput,
} from "./rescheduleDueDateHelpers";

const formatDisplayDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const s = String(v).slice(0, 10);
    return s || "—";
  }
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

/**
 * Button component to trigger Reschedule Due Date modal.
 * Only renders/activates if user has approval permission.
 */
export function RescheduleDueDateButton({
  permissions,
  onClick,
  size = "small",
  variant = "outlined",
  color = "warning",
  sx = {},
  children = "Ubah Jatuh Tempo",
  ...props
}) {
  const allowed = canRescheduleDueDate(permissions);
  if (!allowed) return null;

  return (
    <Button
      size={size}
      variant={variant}
      color={color}
      startIcon={<CalendarEdit size={16} />}
      onClick={onClick}
      sx={sx}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * RescheduleDueDateModal
 * Modal to reschedule purchase invoice / installment due date.
 *
 * Enforces:
 * - Approval permissions (approval === 'Y' / can_reschedule_due_date)
 * - Required new_due_date not earlier than invoice date
 * - Required reason minimum 10 characters
 * - Disabled submit when invalid
 * - Reactive update on HTTP 200
 * - Specific authorization error handling on HTTP 403
 */
export default function RescheduleDueDateModal({
  open,
  onClose,
  faktur = null,
  permissions = null,
  onSuccess = null,
}) {
  const [newDueDate, setNewDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState({ new_due_date: false, reason: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const fakturId = faktur?.id || faktur?.faktur_id || faktur?.trx_beli;
  const fakturKode = faktur?.kdfb || faktur?.faktur_kode || faktur?.no_faktur || (fakturId ? `#${fakturId}` : "—");
  const invoiceDateRaw = faktur?.date_faktur || faktur?.created_at || faktur?.tanggal_faktur;
  const currentDueDateRaw = faktur?.due_date || faktur?.jatuh_tempo;
  const terminId = faktur?.termin_id ?? null;
  const terminLabel = faktur?.termin_label || faktur?.termin_nama || (faktur?.termin_no ? `Termin ke-${faktur.termin_no}` : null);

  const invoiceDateNormalized = normalizeDateString(invoiceDateRaw);
  const currentDueDateNormalized = normalizeDateString(currentDueDateRaw);

  const hasApproval = canRescheduleDueDate(permissions);

  useEffect(() => {
    if (open) {
      setNewDueDate(currentDueDateNormalized || "");
      setReason("");
      setTouched({ new_due_date: false, reason: false });
      setServerError("");
      setSubmitting(false);
    }
  }, [open, currentDueDateNormalized]);

  const validation = useMemo(() => {
    return validateRescheduleInput({
      new_due_date: newDueDate,
      invoice_date: invoiceDateNormalized,
      reason,
    });
  }, [newDueDate, invoiceDateNormalized, reason]);

  const isSubmitDisabled = shouldDisableSubmit({
    new_due_date: newDueDate,
    invoice_date: invoiceDateNormalized,
    reason,
    isSubmitting: submitting,
  }) || !hasApproval;

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setTouched({ new_due_date: true, reason: true });
    setServerError("");

    if (!hasApproval) {
      const msg = "Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo";
      setServerError(msg);
      openNotification({
        open: true,
        title: "Akses Ditolak",
        message: msg,
        alert: { color: "error" },
      });
      return;
    }

    if (!validation.isValid) {
      return;
    }

    if (!fakturId) {
      const msg = "ID Faktur tidak ditemukan";
      setServerError(msg);
      openNotification({
        open: true,
        title: "Gagal",
        message: msg,
        alert: { color: "error" },
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildReschedulePayload({
        new_due_date: newDueDate,
        reason,
        termin_id: terminId,
      });

      const result = await rescheduleDueDate(fakturId, payload);

      openNotification({
        open: true,
        title: "Berhasil",
        message: "Tanggal jatuh tempo berhasil diperbarui",
        alert: { color: "success" },
      });

      if (typeof onSuccess === "function") {
        onSuccess({
          ...faktur,
          id: fakturId,
          due_date: newDueDate,
          new_due_date: newDueDate,
          reason,
          termin_id: terminId,
          rescheduled: true,
          result,
        });
      }

      onClose();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      let errorMsg = err?.message || "Gagal mengubah tanggal jatuh tempo";
      if (status === 403) {
        errorMsg = "Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo";
      }

      setServerError(errorMsg);
      openNotification({
        open: true,
        title: status === 403 ? "Akses Ditolak" : "Gagal",
        message: errorMsg,
        alert: { color: "error" },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: "hidden",
          boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.22)",
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
              color: "warning.main",
            }}
          >
            <CalendarEdit size={22} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Ubah Tanggal Jatuh Tempo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Perubahan jadwal jatuh tempo faktur / termin pembelian
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.5}>
          {serverError && (
            <Alert severity="error" onClose={() => setServerError("")}>
              {serverError}
            </Alert>
          )}

          {!hasApproval && (
            <Alert severity="warning">
              Anda tidak memiliki hak persetujuan (approval) untuk mengubah tanggal jatuh tempo.
            </Alert>
          )}

          {/* Info Ringkas Faktur */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  No. Faktur
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {fakturKode}
                </Typography>
                {terminLabel && (
                  <Typography variant="caption" color="info.main" fontWeight={600}>
                    {terminLabel}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tanggal Faktur
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatDisplayDate(invoiceDateRaw)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Jatuh Tempo Saat Ini
                </Typography>
                <Typography variant="body2" fontWeight={600} color="warning.dark">
                  {formatDisplayDate(currentDueDateRaw)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Form Input */}
          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            <TextField
              type="date"
              label="Tanggal Jatuh Tempo Baru"
              required
              fullWidth
              size="small"
              disabled={!hasApproval || submitting}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: invoiceDateNormalized || undefined,
              }}
              value={newDueDate}
              onChange={(e) => {
                setNewDueDate(e.target.value);
                setTouched((prev) => ({ ...prev, new_due_date: true }));
              }}
              error={Boolean(touched.new_due_date && validation.errors.new_due_date)}
              helperText={
                (touched.new_due_date && validation.errors.new_due_date) ||
                (invoiceDateNormalized ? `Tanggal tidak boleh sebelum ${invoiceDateNormalized}` : "Pilih tanggal jatuh tempo baru")
              }
            />

            <Box>
              <TextField
                label="Alasan Perubahan Jatuh Tempo"
                required
                multiline
                rows={3}
                fullWidth
                size="small"
                disabled={!hasApproval || submitting}
                placeholder="Tuliskan alasan penundaan atau perubahan jatuh tempo (minimal 10 karakter)..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setTouched((prev) => ({ ...prev, reason: true }));
                }}
                error={Boolean(touched.reason && validation.errors.reason)}
                helperText={
                  (touched.reason && validation.errors.reason) ||
                  `${reason.trim().length}/10 karakter minimal`
                }
              />
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CalendarEdit size={18} />}
        >
          {submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
