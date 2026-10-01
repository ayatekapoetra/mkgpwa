'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add,
  Trash,
  Share,
  ShoppingBag,
  Eye,
  SearchNormal1,
  Box as BoxIcon,
  TickSquare,
  Warning2,
  CloseCircle,
  ArrowRight2,
  ArrowLeft2,
  Send2
} from 'iconsax-react';

import { openNotification } from 'api/notification';
import { useGetGudang } from 'api/gudang';
import { useGetGoodsIssueOption } from 'api/goods-issue';
import { createMaterialRequestFromWo, deleteMaterialRequest, prepareGoodsIssue, useMaterialRequestList } from 'api/material-request';

const STATUS_LABEL = {
  active: 'Requested',
  ready: 'Ready',
  order: 'Ordered',
  done: 'Fulfilled'
};

const STATUS_COLOR = {
  active: 'warning',
  ready: 'info',
  order: 'secondary',
  done: 'success'
};

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function StokBadge({ stok, qty }) {
  const s = Number(stok || 0);
  const q = Number(qty || 0);
  if (s <= 0) {
    return <Chip icon={<Warning2 size={14} />} label="Stok Habis" size="small" color="error" variant="outlined" />;
  }
  if (q > 0 && s < q) {
    return <Chip icon={<Warning2 size={14} />} label={`Stok ${s} (kurang)`} size="small" color="warning" variant="outlined" />;
  }
  return <Chip icon={<TickSquare size={14} />} label={`Stok ${s} (cukup)`} size="small" color="success" variant="outlined" />;
}

export default function MaterialRequestTab({ woId, woStatus, kdwo }) {
  const router = useRouter();
  const { data: mrList, dataLoading, dataError, mutate } = useMaterialRequestList(woId);
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();

  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [selectedGudang, setSelectedGudang] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Mode & form untuk "Sparepart Manual" (barang tidak ditemukan di master)
  const [itemMode, setItemMode] = useState('search'); // 'search' | 'manual'
  const [manualForm, setManualForm] = useState({ narasi: '', aliaspart: '', qty: 1, uom_used: '' });

  // State untuk "Keluarkan Barang" global (semua item belum keluar)
  const [giPreparing, setGiPreparing] = useState(false);
  const [giConfirm, setGiConfirm] = useState(null); // { mroIds: [], items: [{mro_id, kdwo, barang, qty_requested, qty_available, qty_to_issue}], skipped: [] }

  const woClosed = String(woStatus || '').toUpperCase() === 'CLOSE';
  const debouncedKeyword = useDebounce(keyword, 450);

  const optionUrl = selectedGudang?.id
    ? `/warehouse/goods-issues/options/items?gudang_id=${selectedGudang.id}${debouncedKeyword ? `&keyword=${encodeURIComponent(debouncedKeyword)}` : ''}&limit=30`
    : null;
  const { data: optionData, dataLoading: barangLoading, dataError: barangError } = useGetGoodsIssueOption(optionUrl, !!selectedGudang?.id);

  const barangList = useMemo(() => {
    if (!optionData) return [];
    if (Array.isArray(optionData)) return optionData;
    if (Array.isArray(optionData.items)) return optionData.items;
    if (Array.isArray(optionData.data?.items)) return optionData.data.items;
    return [];
  }, [optionData]);

  const cartTotalQty = cart.reduce((sum, c) => sum + Number(c.qty || 0), 0);
  const cartHasInsufficientStok = cart.some((c) => !c.isManual && Number(c.stok || 0) < Number(c.qty || 0));

  const handleAddToCart = (barang) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.barang_id === barang.id);
      if (exists) {
        return prev.map((c) => (c.barang_id === barang.id ? { ...c, qty: (Number(c.qty) || 1) + 1 } : c));
      }
      return [
        ...prev,
        {
          uid: `b-${barang.id}`,
          barang_id: barang.id,
          kode: barang.kode,
          nama: barang.nama,
          num_part: barang.num_part,
          satuan: barang.satuan_pakai || barang.satuan_order || '',
          stok: barang.stok_pakai || 0,
          qty: 1,
          uom_used: barang.satuan_pakai || barang.satuan_order || '',
          isManual: false
        }
      ];
    });
  };

  const handleCartQtyChange = (uid, qty) => {
    setCart((prev) => prev.map((c) => (c.uid === uid ? { ...c, qty: Math.max(0, Number(qty) || 0) } : c)));
  };

  const handleRemoveFromCart = (uid) => {
    setCart((prev) => prev.filter((c) => c.uid !== uid));
  };

  // Tambah item manual (barang tidak ditemukan di master)
  const handleAddManualToCart = () => {
    const narasi = (manualForm.narasi || '').trim();
    if (!narasi) {
      openNotification({ open: true, message: 'Deskripsi barang wajib diisi', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }
    const qty = Number(manualForm.qty || 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      openNotification({ open: true, message: 'Qty harus lebih dari 0', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        uid: `m-${Date.now()}-${prev.length}`,
        barang_id: '',
        kode: '',
        nama: narasi,
        num_part: '',
        satuan: manualForm.uom_used || '',
        stok: 0,
        qty,
        uom_used: manualForm.uom_used || '',
        narasi,
        aliaspart: (manualForm.aliaspart || '').trim(),
        isManual: true
      }
    ]);
    setManualForm({ narasi: '', aliaspart: '', qty: 1, uom_used: '' });
  };

  const resetForm = () => {
    setShowForm(false);
    setFormStep(0);
    setCart([]);
    setSelectedGudang(null);
    setKeyword('');
  };

  const handleSubmit = async () => {
    if (!selectedGudang?.id) {
      openNotification({ open: true, message: 'Pilih gudang terlebih dahulu', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      setFormStep(0);
      return;
    }
    if (cart.length === 0) {
      openNotification({ open: true, message: 'Tambah minimal 1 barang ke daftar', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      setFormStep(1);
      return;
    }
    const invalid = cart.find((c) => !c.qty || Number(c.qty) <= 0);
    if (invalid) {
      openNotification({ open: true, message: `Qty untuk ${invalid.nama || invalid.kode} harus > 0`, alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        gudang_id: selectedGudang.id,
        items: cart.map((c) => ({
          barang_id: c.barang_id || null,
          qty: Number(c.qty),
          uom_used: c.uom_used || '',
          narasi: c.isManual ? c.narasi : '',
          aliaspart: c.isManual ? c.aliaspart : ''
        }))
      };
      const response = await createMaterialRequestFromWo(woId, payload);
      if (response?.diagnostic?.error) {
        throw new Error(response.diagnostic.message || 'Gagal membuat material request');
      }
      openNotification({ open: true, message: response?.diagnostic?.message || 'Material request berhasil dibuat', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      resetForm();
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal membuat material request';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await deleteMaterialRequest(deleteDialog.id);
      openNotification({ open: true, message: 'Item material request dihapus', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      setDeleteDialog(null);
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menghapus item';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setDeleting(false);
    }
  };

  const giCreateHref = useMemo(() => {
    const params = new URLSearchParams();
    if (kdwo) params.set('kdwo', kdwo);
    if (woId) params.set('wo', String(woId));
    return `/goods-issues/create?${params.toString()}`;
  }, [kdwo, woId]);

  const goToGoodsIssue = (mroIds) => {
    const ids = Array.isArray(mroIds) ? mroIds : [mroIds];
    router.push(`/goods-issues/create?mros=${ids.join(',')}`);
  };

  // Aksi global "Order Barang" — redirect ke Purchasing Request dengan pre-fill item MR belum keluar
  const handleOrderBarang = () => {
    // Sertakan semua item belum keluar, termasuk item manual (barang_id kosong)
    const itemsToOrder = (mrList || []).filter((m) => !m.kdout);
    if (itemsToOrder.length === 0) {
      openNotification({ open: true, message: 'Tidak ada item yang bisa di-order', alert: { color: 'info', variant: 'filled' }, variant: 'alert' });
      return;
    }
    const mroIds = itemsToOrder.map((m) => m.id).join(',');
    router.push(`/purchasing-request/create?wo=${woId}&mro=${mroIds}`);
  };

  // Aksi global "Keluarkan Barang" — bawa semua item yang belum keluar (hanya item dengan barang_id)
  const handleKeluarkanSemua = async () => {
    const itemsToIssue = (mrList || []).filter((m) => !m.kdout && m.barang_id);
    if (itemsToIssue.length === 0) {
      openNotification({ open: true, message: 'Tidak ada item yang bisa dikeluarkan', alert: { color: 'info', variant: 'filled' }, variant: 'alert' });
      return;
    }

    setGiPreparing(true);
    try {
      // Fetch prepare-gi untuk semua item secara paralel
      const results = await Promise.all(
        itemsToIssue.map(async (m) => {
          try {
            const data = await prepareGoodsIssue(m.id);
            return { ok: true, m, data };
          } catch {
            return { ok: false, m, data: null };
          }
        })
      );

      // Filter item yang berhasil & punya stok (qty_to_issue > 0)
      const prepared = results
        .filter((r) => r.ok && r.data && Number(r.data.qty_to_issue || 0) > 0)
        .map((r) => ({
          mro_id: r.m.id,
          kdwo: r.data.kdwo,
          barang: r.data.barang,
          gudang: r.data.gudang,
          uom_used: r.data.uom_used,
          qty_requested: Number(r.data.qty_requested || 0),
          qty_available: Number(r.data.qty_available || 0),
          qty_to_issue: Number(r.data.qty_to_issue || 0)
        }));

      const skippedStok0 = results
        .filter((r) => r.ok && r.data && Number(r.data.qty_to_issue || 0) <= 0)
        .map((r) => r.data.barang?.nama || r.data.barang?.kode || r.m.id);

      if (prepared.length === 0) {
        openNotification({ open: true, message: 'Semua item stok habis. Gunakan Order Barang (Purchase Request).', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
        return;
      }

      const hasShortage = prepared.some((p) => p.qty_to_issue < p.qty_requested);

      if (hasShortage) {
        // Dialog ringkasan
        setGiConfirm({
          mroIds: prepared.map((p) => p.mro_id),
          items: prepared,
          skipped: skippedStok0
        });
        return;
      }

      // Semua stok cukup → redirect langsung
      goToGoodsIssue(prepared.map((p) => p.mro_id));
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menyiapkan pengeluaran barang';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setGiPreparing(false);
    }
  };

  const handleConfirmKeluarkan = () => {
    if (!giConfirm) return;
    const mroIds = giConfirm.mroIds;
    setGiConfirm(null);
    goToGoodsIssue(mroIds);
  };

  if (dataLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 5 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Memuat material request...</Typography>
      </Stack>
    );
  }

  if (dataError) {
    return <Alert severity="error">{dataError?.message || 'Gagal memuat material request'}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {mrList.length} Item Material Request
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Permintaan barang dari gudang untuk perbaikan WO ini
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {!woClosed && mrList.length > 0 && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={giPreparing ? <CircularProgress size={16} color="inherit" /> : <Share size={16} />}
                onClick={handleKeluarkanSemua}
                disabled={giPreparing}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Barang Keluar
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ShoppingBag size={16} />}
                onClick={handleOrderBarang}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Order Barang
              </Button>
            </>
          )}
          {!woClosed && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Add size={18} />}
              onClick={() => { setShowForm(true); setFormStep(0); }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Add Sparepart
            </Button>
          )}
        </Stack>
      </Stack>

      {woClosed && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Work Order berstatus <strong>CLOSE</strong> — tidak dapat membuat material request baru.
          REOPEN work order jika masih ada kebutuhan part.
        </Alert>
      )}

      {/* List MR Items */}
      {mrList.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700, width: 40 }}>No</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 180 }}>Kode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nama Barang & Gudang</TableCell>
                <TableCell sx={{ fontWeight: 700, align: 'center', width: 70 }} align="center">Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Sat</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Stok</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Keluar</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 100 }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 70 }} align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mrList.map((m, idx) => {
                const stokAvailable = Number(m.stok_available ?? -1);
                const isOut = !!m.kdout;
                return (
                  <TableRow key={m.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{m.barang?.kode || (m.narasi ? '*' : '-')}</Typography>
                      {m.barang?.num_part && <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10 }}>{m.barang.num_part}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{m.barang?.nama || m.narasi || '-'}</Typography>
                      {m.gudang?.nama && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                          <BoxIcon size={11} color="text.secondary" />
                          <Typography variant="caption" color="text.secondary">{m.gudang.nama}</Typography>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{m.qty || 0}</TableCell>
                    <TableCell align="center">{m.uom_used || m.barang?.stn_pakai || '-'}</TableCell>
                    <TableCell align="center">
                      {m.barang_id ? (
                        <Typography variant="body2" fontWeight={700} color={stokAvailable > 0 ? 'success.main' : 'error.main'}>
                          {stokAvailable >= 0 ? stokAvailable : '-'}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {m.qtyout > 0 ? <Typography variant="body2" color="success.main" fontWeight={600}>{m.qtyout}</Typography> : <Typography color="text.disabled">-</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={STATUS_LABEL[m.status] || m.status || '-'}
                        size="small"
                        color={STATUS_COLOR[m.status] || 'default'}
                        variant={m.status === 'done' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {isOut ? (
                        <Tooltip title={`Sudah dikeluarkan: ${m.kdout}`}>
                          <Chip icon={<TickSquare size={14} />} label="Selesai" size="small" color="success" />
                        </Tooltip>
                      ) : !woClosed ? (
                        <Tooltip title="Hapus item ini">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog(m)}>
                            <Trash size={15} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !showForm && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
            <BoxIcon size={48} color="text.disabled" />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Belum ada material request untuk WO ini
            </Typography>
            {!woClosed && (
              <Button variant="contained" startIcon={<Add size={18} />} onClick={() => { setShowForm(true); setFormStep(0); }}>
                Buat Material Request Pertama
              </Button>
            )}
          </Paper>
        )
      )}

      {/* ===== FORM WIZARD: Buat Material Request ===== */}
      {showForm && !woClosed && (
        <Paper variant="outlined" sx={{ mt: 2.5, borderRadius: 2, overflow: 'hidden' }}>
          {/* Stepper Header */}
          <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2.5, py: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight={700}>Buat Material Request</Typography>
              <IconButton size="small" sx={{ color: 'white' }} onClick={resetForm}>
                <CloseCircle size={20} />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              {['Pilih Gudang', 'Cari & Pilih Barang', 'Review & Submit'].map((label, idx) => (
                <Stack key={idx} direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      bgcolor: formStep >= idx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                      fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    {formStep > idx ? <TickSquare size={12} /> : idx + 1}
                  </Box>
                  <Typography variant="caption" sx={{ opacity: formStep >= idx ? 1 : 0.5, fontWeight: formStep === idx ? 700 : 400 }}>
                    {label}
                  </Typography>
                  {idx < 2 && <Box sx={{ flex: 1, height: 1, bgcolor: 'rgba(255,255,255,0.2)', ml: 0.5 }} />}
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Step Content */}
          <Box sx={{ p: 2.5, minHeight: 300 }}>
            {/* STEP 0: Pilih Gudang */}
            {formStep === 0 && (
              <Stack spacing={2}>
                <Alert severity="info" icon={<BoxIcon size={18} />}>
                  Pilih gudang sebagai sumber barang. Stok akan ditampilkan berdasarkan gudang yang dipilih.
                </Alert>
                <Autocomplete
                  options={gudangRows || []}
                  getOptionLabel={(opt) => opt?.nama ? `${opt.nama}${opt?.kode ? ` (${opt.kode})` : ''}` : ''}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={selectedGudang}
                  onChange={(_e, val) => setSelectedGudang(val)}
                  loading={gudangLoading}
                  renderOption={(props, opt) => (
                    <Box component="li" {...props} key={opt.id}>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                          <BoxIcon size={18} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={opt.nama}
                        secondary={opt.kode || '-'}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Gudang Request (wajib)"
                      placeholder="Ketik nama gudang untuk mencari..."
                      size="medium"
                      required
                      helperText={selectedGudang ? `Terpilih: ${selectedGudang.nama}` : 'Stok barang per gudang akan ditampilkan di langkah berikutnya'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <BoxIcon size={18} color="text.secondary" />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
                {gudangLoading && <LinearProgress />}
              </Stack>
            )}

            {/* STEP 1: Cari & Pilih Barang */}
            {formStep === 1 && (
              <Stack spacing={2}>
                {/* Toggle mode: Cari Barang / Sparepart Manual */}
                <ToggleButtonGroup
                  value={itemMode}
                  exclusive
                  fullWidth
                  size="small"
                  onChange={(_e, val) => val && setItemMode(val)}
                  sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}
                >
                  <ToggleButton value="search">
                    <SearchNormal1 size={16} style={{ marginRight: 6 }} />
                    Cari Barang
                  </ToggleButton>
                  <ToggleButton value="manual">
                    <Warning2 size={16} style={{ marginRight: 6 }} />
                    Sparepart Manual (tidak ditemukan)
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* MODE: Cari Barang dari master */}
                {itemMode === 'search' && (
                  <>
                    <TextField
                      label="Cari barang (kode, nama, atau nomor part)"
                      placeholder="Contoh: kampas kopling, oli, filter..."
                      size="medium"
                      fullWidth
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      helperText={`Menampilkan stok di gudang: ${selectedGudang?.nama || '-'}${debouncedKeyword !== keyword ? ' (mencari...)' : ''} — klik baris barang untuk menambah ke keranjang`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchNormal1 size={20} color="text.secondary" />
                          </InputAdornment>
                        ),
                        endAdornment: keyword && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setKeyword('')}>
                              <CloseCircle size={16} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </>
                )}

                {/* MODE: Sparepart Manual */}
                {itemMode === 'manual' && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, bgcolor: 'warning.lighter' }}>
                    <Stack spacing={1.5}>
                      <Alert severity="info" icon={<Warning2 size={18} />}>
                        Gunakan ini jika barang/sparepart <strong>tidak ditemukan</strong> di master.
                        Deskripsi akan disimpan ke kolom <code>description</code> saat dibuat Purchasing Request.
                      </Alert>
                      <TextField
                        label="Deskripsi Barang / Sparepart *"
                        placeholder="Contoh: Seal hydraulic OEM EX-200 (custom)"
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        value={manualForm.narasi}
                        onChange={(e) => setManualForm((p) => ({ ...p, narasi: e.target.value }))}
                        helperText="Wajib diisi — deskripsi ini akan menjadi item di Purchasing Request"
                      />
                      <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <TextField
                          label="Qty *"
                          type="number"
                          size="small"
                          value={manualForm.qty}
                          onChange={(e) => setManualForm((p) => ({ ...p, qty: e.target.value }))}
                          sx={{ width: 100 }}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                        />
                        <TextField
                          label="Satuan"
                          size="small"
                          value={manualForm.uom_used}
                          onChange={(e) => setManualForm((p) => ({ ...p, uom_used: e.target.value }))}
                          placeholder="pcs / set / ltr"
                          sx={{ width: 140 }}
                        />
                        <TextField
                          label="Part No / Alias (opsional)"
                          size="small"
                          value={manualForm.aliaspart}
                          onChange={(e) => setManualForm((p) => ({ ...p, aliaspart: e.target.value }))}
                          placeholder="PN-xxx"
                          sx={{ flex: 1, minWidth: 160 }}
                        />
                      </Stack>
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Add size={16} />}
                          onClick={handleAddManualToCart}
                        >
                          Tambah ke Keranjang
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )}

                {/* Layout 2 kolom: hasil pencarian (kiri) + keranjang (kanan) */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  {/* Kiri: Hasil pencarian (hanya saat mode search) */}
                  {itemMode === 'search' && (
                  <Box sx={{ flex: 1.4, minWidth: 0 }}>
                    {barangLoading && (
                      <Stack alignItems="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Mencari barang...</Typography>
                      </Stack>
                    )}

                    {barangError && !barangLoading && (
                      <Alert severity="error">Gagal memuat daftar barang. Coba ganti kata kunci atau periksa koneksi.</Alert>
                    )}

                    {!barangLoading && !barangError && barangList.length > 0 && (
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          {barangList.length} barang ditemukan — klik baris untuk tambah
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: 1 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 700, width: 100 }}>Kode</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Nama Barang</TableCell>
                                <TableCell sx={{ fontWeight: 700, align: 'center', width: 80 }} align="center">Stok</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">Sat</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">+</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {barangList.map((b) => {
                                const inCart = cart.find((c) => c.barang_id === b.id);
                                const stokNum = Number(b.stok_pakai || 0);
                                return (
                                  <TableRow
                                    key={b.id}
                                    hover
                                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: inCart ? 'primary.lighter' : 'grey.50' }, bgcolor: inCart ? 'primary.lighter' : 'inherit' }}
                                    onClick={() => handleAddToCart(b)}
                                  >
                                    <TableCell>
                                      <Typography variant="body2" fontWeight={700}>{b.kode}</Typography>
                                      {b.num_part && <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10 }}>{b.num_part}</Typography>}
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight={500}>{b.nama}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        color={stokNum > 0 ? 'success.main' : 'error.main'}
                                      >
                                        {stokNum}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography variant="caption">{b.satuan_pakai || b.satuan_order || '-'}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      {inCart ? (
                                        <Chip label={`${inCart.qty}`} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 28 }} />
                                      ) : (
                                        <IconButton size="small" color="primary" sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1, p: 0.3 }}>
                                          <Add size={15} />
                                        </IconButton>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}

                    {!barangLoading && !barangError && barangList.length === 0 && debouncedKeyword && (
                      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                        <SearchNormal1 size={32} color="text.disabled" />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Barang tidak ditemukan untuk "{debouncedKeyword}"
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Coba kata kunci lain, atau cek apakah gudang yang dipilih benar.
                        </Typography>
                      </Paper>
                    )}

                    {!barangLoading && !barangError && barangList.length === 0 && !debouncedKeyword && (
                      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
                        <SearchNormal1 size={32} color="text.disabled" />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Ketik kata kunci untuk mencari barang
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cari berdasarkan kode, nama, atau nomor part di gudang {selectedGudang?.nama}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                  )}

                  {/* Kanan: Keranjang (selalu visible) */}
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Paper variant="outlined" sx={{ borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header keranjang */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1, bgcolor: cart.length > 0 ? 'primary.lighter' : 'grey.100', borderBottom: '1px solid', borderColor: 'divider', borderRadius: '4px 4px 0 0' }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ShoppingBag size={16} color={cart.length > 0 ? 'primary.main' : 'text.disabled'} />
                          <Typography variant="subtitle2" fontWeight={700} color={cart.length > 0 ? 'primary.main' : 'text.secondary'}>
                            Keranjang ({cart.length})
                          </Typography>
                        </Stack>
                        {cart.length > 0 && (
                          <Typography variant="caption" fontWeight={600} color="primary.main">
                            {cartTotalQty} qty
                          </Typography>
                        )}
                      </Stack>

                      {/* Isi keranjang */}
                      <Box sx={{ flex: 1, maxHeight: 350, overflowY: 'auto', p: cart.length > 0 ? 1 : 0 }}>
                        {cart.length === 0 ? (
                          <Stack alignItems="center" justifyContent="center" sx={{ py: 4, px: 2, textAlign: 'center' }}>
                            <ShoppingBag size={36} color="text.disabled" />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Keranjang kosong
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Klik barang di kiri untuk menambahkan
                            </Typography>
                          </Stack>
                        ) : (
                          <Stack spacing={1}>
                            {cart.map((c, idx) => {
                              const stokNum = Number(c.stok || 0);
                              const qtyNum = Number(c.qty || 0);
                              const kurang = stokNum < qtyNum;
                              return (
                                <Paper key={c.uid} variant="outlined" sx={{ p: 1, borderRadius: 1, borderLeft: '3px solid', borderLeftColor: kurang ? 'warning.main' : 'primary.main' }}>
                                  <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: 'primary.lighter', color: 'primary.main', flexShrink: 0 }}>
                                      {idx + 1}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      {c.isManual ? (
                                        <Chip label="Manual" size="small" color="warning" sx={{ mb: 0.25, height: 18, fontSize: 10 }} />
                                      ) : (
                                        <Typography variant="body2" fontWeight={700} noWrap>
                                          {c.kode || '-'}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} noWrap>
                                        {c.nama}
                                      </Typography>
                                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.2, border: '1px solid', borderColor: 'divider', borderRadius: 0.5, width: 22, height: 22 }}
                                            onClick={() => handleCartQtyChange(c.uid, Math.max(1, qtyNum - 1))}
                                          >
                                            <Typography variant="caption" fontWeight={700}>-</Typography>
                                          </IconButton>
                                          <TextField
                                            type="number"
                                            size="small"
                                            value={c.qty}
                                            onChange={(e) => handleCartQtyChange(c.uid, e.target.value)}
                                            sx={{ width: 50 }}
                                            inputProps={{ min: 1, style: { textAlign: 'center', fontWeight: 700, padding: '2px 0' } }}
                                          />
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.2, border: '1px solid', borderColor: 'divider', borderRadius: 0.5, width: 22, height: 22 }}
                                            onClick={() => handleCartQtyChange(c.uid, qtyNum + 1)}
                                          >
                                            <Typography variant="caption" fontWeight={700}>+</Typography>
                                          </IconButton>
                                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{c.satuan}</Typography>
                                        </Stack>
                                        <IconButton size="small" color="error" onClick={() => handleRemoveFromCart(c.uid)} sx={{ p: 0.3 }}>
                                          <Trash size={14} />
                                        </IconButton>
                                      </Stack>
                                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                        {c.isManual ? (
                                          <Chip label="Manual" size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                                        ) : stokNum <= 0 ? (
                                          <Chip label={`Stok habis`} size="small" color="error" sx={{ height: 18, fontSize: 10 }} />
                                        ) : kurang ? (
                                          <Chip label={`Stok ${stokNum} (kurang)`} size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
                                        ) : (
                                          <Chip label={`Stok ${stokNum}`} size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                                        )}
                                      </Stack>
                                    </Box>
                                  </Stack>
                                </Paper>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>

                      {/* Footer keranjang */}
                      {cart.length > 0 && (
                        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', borderRadius: '0 0 4px 4px' }}>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Trash size={14} />}
                            onClick={() => setCart([])}
                            sx={{ textTransform: 'none' }}
                          >
                            Kosongkan keranjang
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
              </Stack>
            )}

            {/* STEP 2: Review & Submit */}
            {formStep === 2 && (
              <Stack spacing={2}>
                {/* Info gudang */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 36, height: 36 }}>
                    <BoxIcon size={20} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Gudang Request</Typography>
                    <Typography variant="body2" fontWeight={700}>{selectedGudang?.nama || '-'} {selectedGudang?.kode ? `(${selectedGudang.kode})` : ''}</Typography>
                  </Box>
                </Stack>

                {/* Tabel review */}
                {cart.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Barang</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Stok</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">Sat</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">×</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cart.map((c) => (
                          <TableRow key={c.uid}>
                            <TableCell>
                              {c.isManual ? (
                                <Chip label="Manual" size="small" color="warning" sx={{ mb: 0.5 }} />
                              ) : (
                                <Typography variant="body2" fontWeight={600}>{c.kode || '-'}</Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" display="block">{c.nama}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {c.isManual ? <Chip label="N/A" size="small" variant="outlined" /> : <StokBadge stok={c.stok} qty={c.qty} />}
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={c.qty}
                                onChange={(e) => handleCartQtyChange(c.uid, e.target.value)}
                                sx={{ width: 70 }}
                                inputProps={{ min: 1, style: { textAlign: 'center', fontWeight: 700 } }}
                              />
                            </TableCell>
                            <TableCell align="center">{c.satuan || '-'}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleRemoveFromCart(c.uid)}>
                                <Trash size={15} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="warning">Daftar barang masih kosong. Kembali ke langkah 2 untuk menambah barang.</Alert>
                )}

                {cartHasInsufficientStok && cart.length > 0 && (
                  <Alert severity="warning" icon={<Warning2 size={18} />}>
                    Beberapa barang stoknya kurang dari qty yang diminta. Anda masih bisa submit —
                    gudang akan mengeluarkan barang sesuai stok yang tersedia, sisanya bisa di-order via Purchase Request.
                  </Alert>
                )}

                {cart.length > 0 && (
                  <Stack direction="row" spacing={2} sx={{ p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Item</Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">{cart.length}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Qty</Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">{cartTotalQty}</Typography>
                    </Box>
                  </Stack>
                )}
              </Stack>
            )}
          </Box>

          {/* Footer Navigation */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                startIcon={formStep === 0 ? <CloseCircle size={18} /> : <ArrowLeft2 size={18} />}
                onClick={() => formStep === 0 ? resetForm() : setFormStep(formStep - 1)}
                sx={{ textTransform: 'none' }}
              >
                {formStep === 0 ? 'Batal' : 'Kembali'}
              </Button>

              {/* Step indicator dots */}
              <Stack direction="row" spacing={0.5}>
                {[0, 1, 2].map((i) => (
                  <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: formStep === i ? 'primary.main' : formStep > i ? 'success.main' : 'grey.300', transition: 'all 0.2s' }} />
                ))}
              </Stack>

              {formStep < 2 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowRight2 size={18} />}
                  disabled={(formStep === 0 && !selectedGudang) || (formStep === 1 && cart.length === 0)}
                  onClick={() => setFormStep(formStep + 1)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {formStep === 0 ? 'Lanjut ke Pilih Barang' : `Lanjut (${cart.length} item)`}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Send2 size={18} />}
                  disabled={submitting || cart.length === 0}
                  onClick={handleSubmit}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {submitting ? 'Menyimpan...' : 'Submit Material Request'}
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={!!deleteDialog} onClose={() => !deleting && setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Item Material Request?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog?.barang?.nama || deleteDialog?.narasi || '-'}
            <br />
            Qty: {deleteDialog?.qty} {deleteDialog?.uom_used || ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} disabled={deleting}>Batal</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Ringkasan Stok Kurang (Keluarkan Barang global) */}
      <Dialog open={!!giConfirm} onClose={() => setGiConfirm(null)} maxWidth="sm" fullWidth>
        {giConfirm && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning2 size={20} color="#f59e0b" /> Ringkasan Pengeluaran Barang
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {giConfirm.items.length} item akan dikeluarkan. Berikut rincian per barang:
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Barang</TableCell>
                        <TableCell sx={{ fontWeight: 700, align: 'center' }}>Diminta</TableCell>
                        <TableCell sx={{ fontWeight: 700, align: 'center' }}>Stok</TableCell>
                        <TableCell sx={{ fontWeight: 700, align: 'center' }}>Keluar</TableCell>
                        <TableCell sx={{ fontWeight: 700, align: 'center' }}>Sisa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {giConfirm.items.map((p) => {
                        const sisa = p.qty_requested - p.qty_to_issue;
                        return (
                          <TableRow key={p.mro_id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{p.barang?.kode}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{p.barang?.nama}</Typography>
                            </TableCell>
                            <TableCell align="center">{p.qty_requested} {p.uom_used}</TableCell>
                            <TableCell align="center">{p.qty_available}</TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={700} color="primary.main">{p.qty_to_issue}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {sisa > 0 ? (
                                <Typography variant="body2" fontWeight={600} color="warning.main">{sisa}</Typography>
                              ) : (
                                <Typography color="text.disabled">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {giConfirm.skipped?.length > 0 && (
                  <Alert severity="warning" icon={<Warning2 size={16} />}>
                    <Typography variant="body2" fontWeight={600}>Item stok habis (di-skip):</Typography>
                    <Typography variant="caption">{giConfirm.skipped.join(', ')}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Gunakan tombol "Order Barang" untuk item tersebut.
                    </Typography>
                  </Alert>
                )}

                <Alert severity="info" icon={<ShoppingBag size={16} />}>
                  Sisa qty (jika ada) bisa di-order via tombol "Order Barang" setelah dialog ditutup.
                </Alert>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGiConfirm(null)}>Batal</Button>
              <Button variant="contained" color="primary" onClick={handleConfirmKeluarkan}>
                Lanjut, Keluarkan {giConfirm.items.length} Item
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Footer hint */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Stok ditampilkan saat membuat MR berdasarkan gudang terpilih. Stok akan diverifikasi ulang saat Goods Issue di-POST.
      </Typography>
    </Box>
  );
}