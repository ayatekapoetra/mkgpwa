'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  Box
} from '@mui/material';
import moment from 'moment';
import OptionShiftKerja from 'components/OptionShiftKerja';
import { pullRekapRitase, fetchPullPreview } from 'api/ritase-rekap';
import { openSnackbar } from 'api/snackbar';

export default function PullDataDialog({ open, onClose, onSuccess }) {
  const [dateOps, setDateOps] = useState(() => moment().format('YYYY-MM-DD'));
  const [shiftId, setShiftId] = useState('');
  const [shiftTouched, setShiftTouched] = useState(false);
  const [shiftError, setShiftError] = useState('');

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Cek batas backdate 90 hari (PRD BR-11, AC-09)
  const isBackdateExceeded = Boolean(
    dateOps && moment().diff(moment(dateOps, 'YYYY-MM-DD'), 'days') > 90
  );

  // Reset dialog state saat dibuka
  useEffect(() => {
    if (open) {
      setDateOps(moment().format('YYYY-MM-DD'));
      setShiftId('');
      setShiftTouched(false);
      setShiftError('');
      setPreview(null);
      setSubmitError(null);
    }
  }, [open]);

  // Muat preview data checker jika tanggal dan shift valid
  useEffect(() => {
    let active = true;
    if (!open || !dateOps || !shiftId || isBackdateExceeded) {
      setPreview(null);
      return;
    }

    setPreviewLoading(true);
    fetchPullPreview({ date_ops: dateOps, shift_id: shiftId })
      .then((data) => {
        if (active) {
          setPreview(data);
          setPreviewLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setPreview(null);
          setPreviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, dateOps, shiftId, isBackdateExceeded]);

  const handleShiftChange = (name, val) => {
    setShiftId(val);
    setShiftTouched(true);
    if (val) {
      setShiftError('');
    } else {
      setShiftError('Shift wajib dipilih');
    }
  };

  const handleSubmit = async () => {
    setShiftTouched(true);
    setSubmitError(null);

    // AC-30: Dialog Tarik Data menolak submit tanpa shift dan menampilkan inline error
    if (!shiftId) {
      setShiftError('Shift wajib dipilih');
      return;
    }

    if (isBackdateExceeded) {
      setSubmitError('Tanggal melebihi batas 90 hari');
      return;
    }

    setSubmitting(true);
    try {
      const res = await pullRekapRitase({
        date_ops: dateOps,
        shift_id: shiftId
      });

      const created = res?.groups_created ?? 0;
      const incomplete = res?.rows_incomplete ?? 0;
      const msg = `${created} grup draft dibentuk, ${incomplete} baris belum lengkap`;

      openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: {
          color: 'success'
        },
        close: true
      });

      if (typeof onSuccess === 'function') {
        onSuccess(res);
      }
      onClose();
    } catch (err) {
      let message = err?.message || 'Gagal menarik data rekap';
      if (err?.code === 'DATE_LOCKED' || message.includes('90 hari')) {
        message = 'Tanggal melebihi batas 90 hari';
      } else if (err?.code === 'SHIFT_REQUIRED') {
        setShiftError('Shift wajib dipilih');
        message = 'Shift wajib dipilih';
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Tarik Data Rekap Ritase</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2.5}>
          {submitError && (
            <Grid item xs={12}>
              <Alert severity="error" data-testid="pull-error-alert">
                {submitError}
              </Alert>
            </Grid>
          )}

          {isBackdateExceeded && (
            <Grid item xs={12}>
              <Alert severity="error" data-testid="backdate-inline-error">
                Tanggal melebihi batas 90 hari
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Operasional"
              size="small"
              value={dateOps}
              onChange={(e) => setDateOps(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'data-testid': 'input-date-ops' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <OptionShiftKerja
              value={shiftId}
              label="Shift (Wajib)"
              name="shift_id"
              error={shiftError}
              touched={shiftTouched || Boolean(shiftError)}
              setFieldValue={handleShiftChange}
            />
            {shiftTouched && shiftError && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, display: 'block' }}
                data-testid="shift-inline-error"
              >
                {shiftError}
              </Typography>
            )}
          </Grid>

          {/* Preview Info Checker */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'grey.50',
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              {previewLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Memeriksa data checker...
                  </Typography>
                </Stack>
              ) : preview ? (
                preview.checker_rows === 0 ? (
                  <Typography variant="body2" color="text.secondary" data-testid="text-preview-empty">
                    Tidak ada data checker untuk tanggal & shift ini.
                  </Typography>
                ) : (
                  <Stack spacing={0.5} data-testid="text-preview-info">
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      Data checker: {preview.checker_rows ?? 0} baris
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Estimasi: {preview.estimated_groups ?? 0} grup draft ({preview.incomplete_rows ?? 0} baris belum lengkap)
                    </Typography>
                  </Stack>
                )
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Pilih tanggal dan shift untuk melihat ringkasan data checker lapangan.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="secondary">
          Batal
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting || isBackdateExceeded}
          data-testid="btn-submit-pull"
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? 'Menarik Data...' : 'Tarik Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
