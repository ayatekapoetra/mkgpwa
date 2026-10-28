import { useState, useEffect } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
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
import { AddCircle, ReceiptAdd, Calculator, Bank, Receipt2 } from 'iconsax-react';
import { fetchDebitCoas, addOrderPaymentItem } from 'api/order-payments';
import { openNotification } from 'api/notification';

const money = (v) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(v) || 0);

export default function AddItemDialog({
  open,
  onClose,
  paymentId,
  bisnisId,
  existingInvoices = [],
  onAdded,
  onAddLocal,
}) {
  const theme = useTheme();
  const [itemType, setItemType] = useState('expense'); // 'expense' (Biaya Operasional / Admin Bank) or 'invoice' (Alokasi Faktur Tambahan)
  const [coas, setCoas] = useState([]);
  const [coaLoading, setCoaLoading] = useState(false);
  const [coa, setCoa] = useState(null);
  const [qty, setQty] = useState('1');
  const [hargaStn, setHargaStn] = useState('');
  const [description, setDescription] = useState('');
  const [faktur, setFaktur] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (!paymentId && !bisnisId) return;
    setCoaLoading(true);
    const target = paymentId || { bisnis_id: bisnisId };
    fetchDebitCoas(target)
      .then((rows) => setCoas(rows || []))
      .catch(() => setCoas([]))
      .finally(() => setCoaLoading(false));
  }, [open, paymentId, bisnisId]);

  const reset = () => {
    setItemType('expense');
    setCoa(null);
    setQty('1');
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
  const isFormReady =
    itemType === 'expense'
      ? Boolean(coa) && Number(qty) > 0 && Number(hargaStn) > 0
      : Boolean(faktur) && Number(qty) > 0 && Number(hargaStn) > 0;

  const handleSubmit = async () => {
    setError('');
    if (itemType === 'expense') {
      if (!coa) return setError('Akun debit (COA Beban) wajib dipilih');
    } else {
      if (!faktur) return setError('Faktur pembelian wajib dipilih');
    }
    if (!qty || Number(qty) <= 0) return setError('Qty harus lebih besar dari 0');
    if (!hargaStn || Number(hargaStn) <= 0) return setError('Harga satuan harus lebih besar dari 0');

    setSubmitting(true);
    try {
      const payload = {
        coa_debit: coa ? Number(coa.id) : undefined,
        qty: Number(qty) || 1,
        harga_stn: Number(hargaStn),
        description: description ? description.trim() : (itemType === 'expense' ? 'Biaya transfer admin bank' : undefined),
        trx_beli: itemType === 'invoice' && faktur ? Number(faktur.trx_beli || faktur.id) : undefined,
      };

      if (onAddLocal) {
        onAddLocal({
          id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          item_type: itemType,
          coa_debit: coa ? Number(coa.id) : null,
          coa_kode: coa?.kode || '',
          coa_name: coa?.name || '',
          qty: Number(qty) || 1,
          harga_stn: Number(hargaStn),
          amount: (Number(qty) || 1) * Number(hargaStn),
          subtotal: (Number(qty) || 1) * Number(hargaStn),
          description: description ? description.trim() : (itemType === 'expense' ? 'Biaya transfer admin bank' : ''),
          narasi: description ? description.trim() : '',
          trx_beli: itemType === 'invoice' && faktur ? Number(faktur.trx_beli || faktur.id) : null,
          faktur_kode: itemType === 'invoice' && faktur ? (faktur.faktur_kode || `Faktur #${faktur.trx_beli}`) : null,
        });
        reset();
        onClose();
        return;
      }

      const updated = await addOrderPaymentItem(paymentId, payload);
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
                Biaya administrasi bank, materai, atau penyesuaian alokasi faktur
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
          {/* Pilihan Tipe Item (Pemisahan Visual Jelas) */}
          <Box>
            <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1, mb: 1, display: 'block' }}>
              Tipe Item Pembayaran
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Box
                  onClick={() => {
                    setItemType('expense');
                    setFaktur(null);
                  }}
                  sx={{
                    p: 1.75,
                    cursor: 'pointer',
                    borderRadius: 2.5,
                    border: '2px solid',
                    borderColor: itemType === 'expense' ? 'primary.main' : 'divider',
                    bgcolor: itemType === 'expense' ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                    transition: 'all 0.15s ease',
                    height: '100%',
                    '&:hover': {
                      borderColor: itemType === 'expense' ? 'primary.main' : 'primary.light',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: itemType === 'expense' ? 'primary.main' : alpha(theme.palette.text.secondary, 0.1),
                        color: itemType === 'expense' ? 'primary.contrastText' : 'text.secondary',
                        flexShrink: 0,
                      }}
                    >
                      <Bank size={18} />
                    </Box>
                    <Box minWidth={0}>
                      <Typography variant="subtitle2" fontWeight={800} color={itemType === 'expense' ? 'primary.main' : 'text.primary'}>
                        Biaya Operasional / Admin Bank
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.3 }}>
                        Non-faktur: admin transfer, materai, beban biaya
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  onClick={() => setItemType('invoice')}
                  sx={{
                    p: 1.75,
                    cursor: 'pointer',
                    borderRadius: 2.5,
                    border: '2px solid',
                    borderColor: itemType === 'invoice' ? 'primary.main' : 'divider',
                    bgcolor: itemType === 'invoice' ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                    transition: 'all 0.15s ease',
                    height: '100%',
                    '&:hover': {
                      borderColor: itemType === 'invoice' ? 'primary.main' : 'primary.light',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: itemType === 'invoice' ? 'primary.main' : alpha(theme.palette.text.secondary, 0.1),
                        color: itemType === 'invoice' ? 'primary.contrastText' : 'text.secondary',
                        flexShrink: 0,
                      }}
                    >
                      <Receipt2 size={18} />
                    </Box>
                    <Box minWidth={0}>
                      <Typography variant="subtitle2" fontWeight={800} color={itemType === 'invoice' ? 'primary.main' : 'text.primary'}>
                        Alokasi Faktur Tambahan
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.3 }}>
                        Pilih faktur pembelian untuk dialokasikan
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Section: Akun & Faktur */}
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.75 }}>
              <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: 'primary.main' }} />
              <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1 }}>
                {itemType === 'expense' ? 'Akun Beban Debit' : 'Faktur & Akun Debit'}
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {/* Dropdown Akun Debit (COA) */}
              <Autocomplete
                loading={coaLoading}
                options={coas}
                value={coa}
                onChange={(_, val) => setCoa(val)}
                getOptionLabel={(o) => o.label || `${o.kode} - ${o.name}` || ''}
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
                    label="Akun Debit (COA Beban)"
                    required={itemType === 'expense'}
                    placeholder="Cari kode atau nama COA..."
                    helperText={coa ? `${coa.kode} — ${coa.name}` : (itemType === 'expense' ? 'Wajib pilih akun debit untuk pencatatan beban operasional/admin bank' : 'Pilih akun debit jika ingin menentukan COA spesifik')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
                noOptionsText="Tidak ada COA aktif untuk unit bisnis ini"
              />

              {/* Input Faktur: Tampilan sesuai mode */}
              {itemType === 'expense' ? (
                <TextField
                  label="Faktur Pembelian"
                  disabled
                  value="Non-Faktur (Biaya Operasional Langsung)"
                  helperText="Opsi faktur dinonaktifkan untuk biaya operasional / admin bank agar sisa hutang faktur tidak terpotong"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette.action.disabledBackground, 0.5),
                    },
                  }}
                />
              ) : (
                <Autocomplete
                  options={existingInvoices}
                  value={faktur}
                  onChange={(_, val) => {
                    setFaktur(val);
                    if (val && !description) {
                      setDescription(`Alokasi faktur ${val.faktur_kode || val.kdfb || val.trx_beli || ''}`);
                    }
                  }}
                  getOptionLabel={(o) => o.faktur_kode || `Faktur #${o.trx_beli || o.id}`}
                  isOptionEqualToValue={(a, b) => (a?.trx_beli || a?.id) === (b?.trx_beli || b?.id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Nomor Faktur Tambahan"
                      required
                      placeholder="Pilih faktur pembelian..."
                      helperText={faktur ? `Faktur terpilih: ${faktur.faktur_kode || faktur.trx_beli}` : 'Pilih faktur untuk alokasi tambahan'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                  noOptionsText="Belum ada faktur pada transaksi ini"
                />
              )}
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
                  placeholder="1"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  type="number"
                  label={itemType === 'expense' ? 'Nominal Biaya' : 'Harga Satuan'}
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
            placeholder={itemType === 'expense' ? 'Contoh: Biaya administrasi transfer bank' : 'Keterangan tambahan untuk alokasi faktur'}
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