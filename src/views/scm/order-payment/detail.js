"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Gallery, Receipt2 } from "iconsax-react";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  fetchWallets,
  postOrderPayment,
  removeOrderPayment,
  useOrderPaymentAccess,
  useOrderPaymentDetail,
} from "api/order-payments";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import BtnBack from "components/BtnBack";
import { APP_DEFAULT_PATH } from "config";
import PaymentProofManager from './PaymentProofManager';
import { paymentProofStorageKey, applyPaymentAttachmentChange } from './payment-proofs';

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const dateId = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
};

const attachmentUrl = (attachment) =>
  attachment?.url ||
  attachment?.file_url ||
  attachment?.download_url ||
  attachment?.path ||
  "";

const attachmentName = (attachment, index) =>
  attachment?.name ||
  attachment?.filename ||
  attachment?.original_name ||
  attachment?.file_name ||
  `Berkas ${index + 1}`;

const isImageAttachment = (attachment) => {
  const type = String(attachment?.datatype || attachment?.mime_type || attachment?.type || "").toLowerCase();
  const url = attachmentUrl(attachment).toLowerCase();
  return type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic)(\?|$)/i.test(url);
};

function Field({ label, value, inverse = false, children }) {
  return (
    <Box
      sx={{
        minHeight: 64,
        p: 1.25,
        borderRadius: 1.75,
        bgcolor: inverse ? "rgba(255,255,255,.09)" : "secondary.lighter",
        border: "1px solid",
        borderColor: inverse ? "rgba(255,255,255,.12)" : "divider",
      }}
    >
      <Typography
        variant="caption"
        color={inverse ? "inherit" : "text.secondary"}
        display="block"
        sx={{
          mb: 0.45,
          opacity: inverse ? 0.68 : 1,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.7,
          lineHeight: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      {children || (
        <Typography
          variant="body2"
          fontWeight={700}
          color={inverse ? "inherit" : "text.primary"}
          sx={{ lineHeight: 1.45, overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {value ?? "—"}
        </Typography>
      )}
    </Box>
  );
}

function ReferenceLink({ href, children, inverse = false }) {
  return (
    <MuiLink
      component={NextLink}
      href={href}
      variant="body1"
      color={inverse ? "inherit" : "primary"}
      fontWeight={600}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        textDecoration: "none",
        "&:hover": { textDecoration: "underline" },
      }}
    >
      <LinkOutlinedIcon sx={{ fontSize: 17 }} />
      {children}
    </MuiLink>
  );
}

function AttachmentGallery({ attachments = [], empty = "Belum ada dokumen", accent = "divider" }) {
  const visible = attachments.filter((attachment) => attachmentUrl(attachment));
  if (!visible.length) {
    return <Typography variant="caption" color="text.secondary">{empty}</Typography>;
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {visible.map((attachment, index) => {
        const url = attachmentUrl(attachment);
        const name = attachmentName(attachment, index);
        return isImageAttachment(attachment) ? (
          <Tooltip key={`${url}-${index}`} title={`${name} · Buka berkas`}>
            <Box
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "block",
                width: 86,
                height: 64,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "1px solid",
                borderColor: accent,
                "&:hover img": { transform: "scale(1.05)" },
              }}
            >
              <Box component="img" src={url} alt={name} sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s ease" }} />
            </Box>
          </Tooltip>
        ) : (
          <Box
            key={`${url}-${index}`}
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 0.75, p: 0.85, border: "1px solid", borderColor: accent, borderRadius: 1.5, color: "text.primary", textDecoration: "none", maxWidth: "100%" }}
          >
            <Gallery size={17} />
            <Typography variant="caption" noWrap>{name}</Typography>
            <OpenInNewOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          </Box>
        );
      })}
    </Stack>
  );
}

export default function OrderPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { permissions } = useOrderPaymentAccess();
  const { row, loading, error, refresh } = useOrderPaymentDetail(
    id,
    Boolean(id),
  );

  const [walletType, setWalletType] = useState("bank");
  const [walletId, setWalletId] = useState("");
  const [wallets, setWallets] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [trxDate, setTrxDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [narasi, setNarasi] = useState("");
  const [posting, setPosting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const mutationLock = useRef(false);
  const busy = posting || removing || attachmentBusy;

  const pending = row?.status === "pending";

  useEffect(() => {
    if (!row?.bisnis_id) {
      setWallets([]);
      setWalletId("");
      return;
    }
    let alive = true;
    setLoadingWallet(true);
    fetchWallets(row.bisnis_id, walletType)
      .then((rows) => {
        if (!alive) return;
        setWallets(Array.isArray(rows) ? rows : []);
        setWalletId("");
      })
      .catch(() => {
        if (alive) {
          setWallets([]);
          setWalletId("");
        }
      })
      .finally(() => {
        if (alive) setLoadingWallet(false);
      });
    return () => {
      alive = false;
    };
  }, [row?.bisnis_id, walletType]);

  useEffect(() => {
    setNarasi(row?.narasi || "");
    if (row?.trx_date) {
      const d = new Date(row.trx_date);
      if (!Number.isNaN(d.getTime())) setTrxDate(d.toISOString().slice(0, 10));
    }
  }, [id, row?.narasi, row?.trx_date]);

  const updatePaymentAttachments = (change) => refresh(
    (current) => applyPaymentAttachmentChange(current, row, change),
    { revalidate: false },
  );

  const previousAttachments = useMemo(() => {
    const seen = new Set();
    return (row?.items || []).flatMap((item) => item.attachments || []).filter((attachment) => {
      const key = attachmentUrl(attachment);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [row?.items]);

  const itemSummary = useMemo(() => {
    const items = Array.isArray(row?.items) ? row.items : [];

    // `faktur_grandtotal`, `faktur_potongan`, `faktur_ppn_rp` adalah nilai level faktur
    // (dari trx_faktur_belis). Satu faktur bisa punya beberapa baris item (beda barang),
    // jadi nilai faktur harus dijumlahkan per faktur unik agar tidak dobel.
    const invoices = [];
    const seenInvoice = new Set();
    items.forEach((item) => {
      const key = String(item.trx_beli ?? item.faktur_kode ?? '');
      if (key && seenInvoice.has(key)) return;
      if (key) seenInvoice.add(key);
      invoices.push(item);
    });

    const totalAfterPpn = invoices.reduce((total, item) => total + (Number(item.faktur_grandtotal) || Number(item.subtotal) || 0), 0);
    const ppn = invoices.reduce((total, item) => total + (Number(item.faktur_ppn_rp) || Number(item.ppn_rp) || 0), 0);
    const discount = invoices.reduce((total, item) => total + (Number(item.faktur_potongan) || Number(item.potongan) || 0), 0);

    return {
      invoices: items.length,
      discount,
      ppn,
      beforePpn: totalAfterPpn - ppn,
      afterPpn: totalAfterPpn,
    };
  }, [row?.items]);

  const selectedWallet = useMemo(
    () => wallets.find((w) => String(w.id) === String(walletId)),
    [wallets, walletId],
  );

  const handlePost = async () => {
    if (mutationLock.current) return;
    if (!walletId) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Pilih bank/kas terlebih dahulu",
        alert: { color: "warning" },
      });
      return;
    }
    if (!selectedWallet?.coa_id) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Wallet belum punya COA di master bank/kas",
        alert: { color: "warning" },
      });
      return;
    }
    if (
      !window.confirm(
        "Posting pembayaran ini? Status akan menjadi Sudah Bayar dan jurnal kas/bank akan dicatat.",
      )
    ) {
      return;
    }
    mutationLock.current = true;
    setPosting(true);
    try {
      const body = { trx_date: trxDate, narasi };
      if (walletType === "bank") body.bank_id = Number(walletId);
      else body.kas_id = Number(walletId);
      await postOrderPayment(id, body);
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Pembayaran berhasil diposting",
        alert: { color: "success" },
      });
      await refresh();
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal posting",
        message: err?.message || "Gagal memposting pembayaran",
        alert: { color: "error" },
      });
    } finally {
      mutationLock.current = false;
      setPosting(false);
    }
  };

  const handleRollback = async () => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setRemoving(true);
    try {
      await removeOrderPayment(id);
      setRollbackOpen(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(paymentProofStorageKey(id));
      }
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Pembayaran berhasil di-rollback",
        alert: { color: "success" },
      });
      router.push("/orders-payments");
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal rollback",
        message: err?.message || "Gagal melakukan rollback pembayaran",
        alert: { color: "error" },
      });
    } finally {
      mutationLock.current = false;
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Box py={8} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !row) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Gagal memuat Orders Payments. {error?.message}
      </Alert>
    );
  }

  const sourceIsPo = Boolean(row.no_po || row.reff);
  const sourceLabel = sourceIsPo ? "Purchase Order" : "Pengajuan Dana";
  const sourceValue = sourceIsPo
    ? row.no_po && row.reff
      ? <ReferenceLink inverse href={`/purchasing-orders/${row.reff}`}>{row.no_po}</ReferenceLink>
      : row.no_po || "—"
    : row.no_pd && row.reff_pd
      ? <ReferenceLink inverse href={`/pengajuan-dana/${row.reff_pd}`}>{row.no_pd}</ReferenceLink>
      : row.no_pd || "—";
  const canPost = permissions.can_post && pending;
  const canRemove = permissions.can_delete && pending;

  return (
    <>
      <Breadcrumbs
        custom
        heading={row.kdbayar || "Orders Payments"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Orders Payments", to: "/orders-payments" },
          { title: row.kdbayar || String(id) },
        ]}
      />

      <MainCard
        title={<BtnBack href="/orders-payments" />}
        secondary={
          <Chip
            label={row.status_label || row.status}
            color={row.status === "paid" ? "success" : "warning"}
          />
        }
        content
      >
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            color: "common.white",
            background: "linear-gradient(135deg, #19324d 0%, #285f78 58%, #2b8b87 100%)",
            boxShadow: "0 16px 36px rgba(25, 50, 77, .18)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.16)" }}>
                <Receipt2 size={26} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.72, letterSpacing: 1.2 }}>Order Payment</Typography>
                <Typography variant="h4" fontWeight={800}>{row.kdbayar || `Pembayaran #${id}`}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.78, mt: 0.25 }}>{row.party_name || "Pihak pembayaran belum tersedia"}</Typography>
              </Box>
            </Stack>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" sx={{ opacity: 0.72 }}>Total pembayaran</Typography>
              <Typography variant="h3" fontWeight={900}>Rp {money(row.roundtotal || row.total)}</Typography>
              <Chip size="small" label={row.status_label || row.status} sx={{ mt: 0.75, color: "common.white", bgcolor: row.status === "paid" ? "rgba(46, 190, 125, .82)" : "rgba(245, 177, 66, .9)", fontWeight: 800 }} />
            </Box>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 1.5 }}>
            <Grid item xs={6} sm={6} md={3}><Field inverse label={sourceLabel} value={sourceValue} /></Grid>
            <Grid item xs={6} sm={6} md={3}><Field inverse label="Faktur" value={row.faktur_kode || "—"} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field inverse label="Tanggal transaksi" value={dateId(row.trx_date)} /></Grid>
            <Grid item xs={6} sm={6} md={3}><Field inverse label="Cabang" value={`${row.cabang_kode || ""}${row.cabang_kode && row.cabang_nama ? " · " : ""}${row.cabang_nama || "—"}`} /></Grid>
            <Grid item xs={6} sm={6} md={4}><Field inverse label="Unit Bisnis" value={`${row.bisnis_nama || "—"}`} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field inverse label="Rekening tujuan" value={row.nm_bank ? `${row.nm_bank} · ${row.no_rekening || ""} · ${row.an_rekening || row.penerima || ""}` : row.penerima || "—"} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field inverse label="Akun kas / bank" value={row.coa_kode ? `${row.coa_kode} — ${row.coa_name || ""}` : "Belum dipilih"} /></Grid>
          </Grid>
        </Box>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Gallery size={21} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Dokumen Pembayaran</Typography>
                <Typography variant="caption" color="text.secondary">Semua berkas pendukung pembayaran dalam satu header dokumen</Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1}>Berkas dari proses sebelumnya</Typography>
                <AttachmentGallery attachments={previousAttachments} empty="Tidak ada berkas sebelumnya" />
              </Grid>
              <PaymentProofManager key={id} paymentId={id} attachments={row.payment_attachments || []} permissions={permissions}
                busy={busy} mutationLock={mutationLock} onBusyChange={setAttachmentBusy} onChanged={updatePaymentAttachments} />
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Alokasi Faktur</Typography>
                <Typography variant="caption" color="text.secondary">Rincian nilai yang dialokasikan ke setiap faktur</Typography>
              </Box>
              <Chip size="small" label={`${(row.items || []).length} Items`} variant="outlined" />
            </Stack>
            <Stack spacing={1.5}>
              {(row.items || []).map((it) => (
                <Card key={it.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                  <Box sx={{ px: 2, py: 1.25, bgcolor: "primary.lighter", borderBottom: "1px solid", borderColor: "divider" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                        <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", flexShrink: 0 }}><Receipt2 size={18} /></Box>
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={800} noWrap>{it.faktur_kode || `Faktur #${it.trx_beli}`}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">{it.barang_nama || it.description || it.barang_kode || "Alokasi pembayaran"}</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="subtitle1" fontWeight={800} color="primary.main">Rp {money(it.subtotal)}</Typography>
                    </Stack>
                  </Box>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6} md={4}><Field label="Barang / deskripsi" value={it.barang_nama || it.description || it.barang_kode || "—"} /></Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Field label="Akun debit">
                          {it.debit_kode ? (
                            <Stack spacing={0}>
                              <Typography variant="caption" color="error.main" fontWeight={700} sx={{ lineHeight: 1.2, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                {it.debit_kode}
                              </Typography>
                              <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ lineHeight: 1, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                {it.debit_name || ""}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" fontWeight={700} color="text.primary">—</Typography>
                          )}
                        </Field>
                      </Grid>
                      <Grid item xs={6} sm={3} md={1}><Field label="Qty" value={it.qty} /></Grid>
                      <Grid item xs={6} sm={3} md={2}><Field label="Harga satuan" value={`Rp ${money(it.harga_stn)}`} /></Grid>
                      <Grid item xs={12} md={2}><Field label="Subtotal" value={`Rp ${money(it.subtotal)}`} /></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              {!(row.items || []).length ? <Alert severity="info">Tidak ada alokasi faktur pada pembayaran ini.</Alert> : null}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5, bgcolor: "secondary.lighter" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Summary Items</Typography>
                <Typography variant="caption" color="text.secondary">Ringkasan nilai faktur sebelum pembayaran diposting</Typography>
              </Box>
              <Chip size="small" color="primary" variant="outlined" label={`${itemSummary.invoices} alokasi`} />
            </Stack>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total potongan</Typography>
                  <Typography variant="h5" fontWeight={800}>Rp {money(itemSummary.discount)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total PPN</Typography>
                  <Typography variant="h5" fontWeight={800}>Rp {money(itemSummary.ppn)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Nilai sebelum PPN</Typography>
                  <Typography variant="h5" fontWeight={800} color="primary.main">Rp {money(itemSummary.beforePpn)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Nilai setelah PPN</Typography>
                  <Typography variant="h5" fontWeight={800} color="success.main">Rp {money(itemSummary.afterPpn)}</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

         {canPost ? (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Posting pembayaran
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal bayar"
                  InputLabelProps={{ shrink: true }}
                  value={trxDate}
                  onChange={(e) => setTrxDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Tipe sumber dana"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                >
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="kas">Kas</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  loading={loadingWallet}
                  options={wallets}
                  value={
                    wallets.find((w) => String(w.id) === String(walletId)) ||
                    null
                  }
                  getOptionLabel={(o) => o.label || o.name || ""}
                  isOptionEqualToValue={(a, b) =>
                    String(a.id) === String(b.id)
                  }
                  onChange={(_, o) => setWalletId(o?.id || "")}
                  renderInput={(p) => (
                    <TextField
                      {...p}
                      label={walletType === "bank" ? "Rekening bank *" : "Kas *"}
                      required
                      helperText={
                        selectedWallet
                          ? selectedWallet.coa_id
                            ? `COA: ${selectedWallet.coa_kode || ""} — ${selectedWallet.coa_name || ""}`
                            : "Wallet belum punya COA"
                          : wallets.length
                            ? "Pilih rekening/kas"
                            : `Tidak ada ${walletType === "bank" ? "bank" : "kas"} untuk unit ini`
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6} />
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Narasi"
                  value={narasi}
                  onChange={(e) => setNarasi(e.target.value)}
                />
              </Grid>
             </Grid>
           </>
         ) : null}

         <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={{ mt: 3 }}>
           <Stack direction="row" spacing={1.5}>
             {canPost ? (
               <Button
                 variant="contained"
                  disabled={busy || !walletId || !selectedWallet?.coa_id}
                 onClick={handlePost}
               >
                 {posting ? "Memposting…" : "Posting Bayar"}
               </Button>
             ) : null}
           </Stack>
           <Stack direction="row" spacing={1.5}>
             <Button
               variant="outlined"
               onClick={() => router.push("/orders-payments")}
             >
               Kembali
             </Button>
             {canRemove ? (
               <Button
               variant="outlined"
               color="error"
                disabled={busy}
                onClick={() => setRollbackOpen(true)}
               >
                 {removing ? "Rollback..." : "Rollback Pembayaran"}
               </Button>
             ) : null}
           </Stack>
         </Stack>

         {!pending ? (
           <Alert severity="success" sx={{ mt: 3 }}>
             Pembayaran sudah diposting
             {row.coa_kode ? ` ke ${row.coa_kode} — ${row.coa_name || ""}` : ""}.
           </Alert>
         ) : null}

         <Dialog
           open={rollbackOpen}
           onClose={() => (removing ? null : setRollbackOpen(false))}
           fullWidth
           maxWidth="sm"
           PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
         >
           <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, pb: 1 }}>
             <Box
               sx={{
                 width: 42,
                 height: 42,
                 borderRadius: "50%",
                 display: "grid",
                 placeItems: "center",
                 bgcolor: "error.lighter",
                 color: "error.main",
               }}
             >
               <WarningAmberRoundedIcon />
             </Box>
             <Box>
               <Typography variant="h5">Rollback pembayaran?</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                 {row.kdbayar || `Pembayaran #${id}`}
               </Typography>
             </Box>
           </DialogTitle>
           <DialogContent>
             <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
               Tindakan ini tidak dapat dibatalkan setelah berhasil diproses.
             </Alert>
             <Typography variant="body2" color="text.secondary">
               Sistem akan menghapus pembayaran pending beserta data alokasinya dan mengembalikan dokumen sumber ke tahap sebelumnya.
             </Typography>
             <List dense disablePadding sx={{ mt: 1.25 }}>
               <ListItem disableGutters>
                 <ListItemIcon sx={{ minWidth: 34, color: "error.main" }}>
                   <DeleteSweepOutlinedIcon fontSize="small" />
                 </ListItemIcon>
                 <ListItemText primary="Data pembayaran dan alokasi faktur akan dihapus." />
               </ListItem>
               <ListItem disableGutters>
                 <ListItemIcon sx={{ minWidth: 34, color: "primary.main" }}>
                   <RestoreOutlinedIcon fontSize="small" />
                 </ListItemIcon>
                 <ListItemText primary="PO dikembalikan ke status verify dan PD ke approval." />
               </ListItem>
             </List>
           </DialogContent>
           <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
             <Button
               variant="text"
               onClick={() => setRollbackOpen(false)}
                disabled={busy}
             >
               Batal
             </Button>
             <Button
               variant="contained"
               color="error"
               onClick={handleRollback}
                disabled={busy}
               startIcon={removing ? <CircularProgress size={16} color="inherit" /> : <RestoreOutlinedIcon />}
             >
               {removing ? "Memproses..." : "Ya, Rollback Pembayaran"}
             </Button>
           </DialogActions>
         </Dialog>

      </MainCard>
    </>
  );
}
