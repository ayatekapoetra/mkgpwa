'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { AddCircle, ReceiptAdd, Calculator } from 'iconsax-react';
import { fetchDebitCoas, addOrderPaymentItem } from 'api/order-payments';
import { openNotification } from 'api/notification';

const money = (v) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(v) || 0);

export default function AddItemDialog({ open, onClose, paymentId, existingInvoices = [], onAdded }) {
  const theme = useTheme();
  const [coas, setCoas] = useState([]);
  const [coaLoading, setCoaLoading] = useState(false);
  const [coa, setCoa] = useState(null);
  const [qty, setQty] = useState('');
  const [hargaStn, setHargaStn] = useState('');
  const [description, setDescription] = useState('');
  const [faktur, setFaktur] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !paymentId) return;
    setCoaLoading(true);
    fetchDebitCoas(paymentId)
      .then((rows) => setCoas(rows))
      .catch(() => setCoas([]))
      .finally(() => setCoaLoading(false));
  }, [open, paymentId]);

  const reset = () => {
    setCoa(null);
    setQty('');
    setHargaStn('');
    setDescription('');
    setFaktur(null);
    setError('');
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const subtotal = (Number(qty) || 0) * (Number(hargaStn) || 0);
  const isFormReady = coa && Number(qty) > 0 && Number(hargaStn) > 0;

  const handleSubmit = async () => {
    setError('');
    if (!coa) return setError('Akun debit wajib dipilih');
    if (!qty || Number(qty) <= 0) return setError('Qty harus lebih besar dari 0');
    if (!hargaStn || Number(hargaStn) <= 0) return setError('Harga satuan harus lebih besar dari 0');

    setSubmitting(true);
    try {
      const body = {
        coa_debit: Number(coa.id),
        qty: Number(qty),
        harga_stn: Number(hargaStn),
        description: description || undefined,
        trx_beli: faktur ? Number(faktur.trx_beli) : undefined,
      };
      const updated = await addOrderPaymentItem(paymentId, body);
      openNotification({
        open: true,
        title: 'Berhasil',
        message: 'Item pembayaran berhasil ditambahkan',
        alert: { color: 'success' },
      });
      reset();
      onClose();
      if (onAdded) onAdded(updated);
    } catch (err) {
      setError(err?.message || 'Gagal menambahkan item pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.info.main, 0.06)} 50%, ${theme.palette.background.paper} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1.75} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <ReceiptAdd size={26} variant="Bold" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              Tambah Item Pembayaran
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Biaya tambahan seperti administrasi bank
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} icon={false}>
            <Typography variant="body2" fontWeight={600}>{error}</Typography>
          </Alert>
        ) : null}

        <Stack spacing={2.5}>
          {/* Section: Akun & Faktur */}
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.75 }}>
              <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: 'primary.main' }} />
              <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1 }}>
                Akun &amp; Referensi
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <Autocomplete
                loading={coaLoading}
                options={coas}
                value={coa}
                onChange={(_, val) => setCoa(val)}
                getOptionLabel={(o) => o.label || ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box component="li" key={key} {...optionProps} sx={{ px: 2, py: 1.25 }}>
                      <Stack spacing={0.25} sx={{ width: '100%' }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: 'error.main', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.3 }}
                        >
                          {option.kode}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11, lineHeight: 1.2 }}>
                          {option.bisnis_nama || `Bisnis #${option.bisnis_id}`}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Akun Debit (COA)"
                    required
                    placeholder="Cari kode atau nama COA..."
                    helperText={coa ? `${coa.kode} — ${coa.name}` : 'Pilih akun debit untuk jurnal item'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
                noOptionsText="Tidak ada COA aktif untuk unit bisnis ini"
              />
              <Autocomplete
                options={existingInvoices}
                value={faktur}
                onChange={(_, val) => setFaktur(val)}
                getOptionLabel={(o) => o.faktur_kode || `Faktur #${o.trx_beli}`}
                isOptionEqualToValue={(a, b) => a?.trx_beli === b?.trx_beli}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Faktur (opsional)"
                    placeholder="Tanpa faktur — biaya lepas"
                    helperText="Tautkan ke faktur existing atau biarkan kosong"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
                noOptionsText="Belum ada faktur pada pembayaran ini"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Section: Nilai */}
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.75 }}>
              <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: 'info.main' }} />
              <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1 }}>
                Nilai Item
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  type="number"
                  label="Qty"
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  placeholder="0"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  type="number"
                  label="Harga Satuan"
                  required
                  value={hargaStn}
                  onChange={(e) => setHargaStn(e.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  placeholder="0"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section: Deskripsi */}
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Narasi / Deskripsi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Biaya administrasi transfer bank untuk pembayaran PO-2026-001"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Subtotal preview */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: isFormReady ? alpha(theme.palette.primary.main, 0.3) : 'divider',
              bgcolor: isFormReady ? alpha(theme.palette.primary.main, 0.04) : 'action.hover',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  >
                    <Calculator size={18} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Subtotal</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                      {Number(qty) || 0} × Rp {money(Number(hargaStn) || 0)}
                    </Typography>
                  </Box>
                </Stack>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                    color: isFormReady ? 'primary.main' : 'text.disabled',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Rp {money(subtotal)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Info hint */}
          <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ px: 0.5 }}>
            <Chip
              size="small"
              variant="outlined"
              color="info"
              label="Total pembayaran akan diperbarui otomatis setelah item ditambahkan"
              sx={{ fontSize: 11, height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1.5,
        }}
      >
        <Button
          variant="text"
          onClick={handleClose}
          disabled={submitting}
          sx={{ borderRadius: 2, px: 2.5 }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !isFormReady}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddCircle size={20} variant="Bold" />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 700,
            boxShadow: submitting ? 'none' : `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          {submitting ? 'Menambahkan...' : 'Tambah Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}