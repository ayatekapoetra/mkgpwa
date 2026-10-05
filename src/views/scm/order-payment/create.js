"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Bank, CardReceive, Eye, Gallery, Receipt2, Trash } from "iconsax-react";

import { createOrderPayment, fetchWallets } from "api/order-payments";
import { usePurchaseOrderBisnis } from "api/purchase-orders";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import BtnBack from "components/BtnBack";
import { APP_DEFAULT_PATH } from "config";
import { getSelectedOption } from "views/scm/purchasing-orders/utils";
import OutstandingModal from "./outstanding-modal";

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const formatLongDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const fixed = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return fixed.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return String(v);
  }
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const today = () => new Date().toISOString().slice(0, 10);

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

/**
 * Add Pembayaran — multi-faktur, multi-pemasok, satu bisnis_id.
 *
 * ACCOUNTING (Fase B): on post, OPS will send AP_PAYMENT_POSTED with
 * allocations[] each carrying supplier_source_id + legacy_invoice_id.
 * See OrderPaymentService.buildAccountingPaymentPayload in be.
 */
export default function OrderPaymentCreatePage() {
  const router = useRouter();
  const { rows: bisnis = [] } = usePurchaseOrderBisnis({}, true);

  const [bisnisId, setBisnisId] = useState("");
  const [trxDate, setTrxDate] = useState(today());
  const [narasi, setNarasi] = useState("");
  const [walletType, setWalletType] = useState("bank");
  const [walletId, setWalletId] = useState("");
  const [wallets, setWallets] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // allocations: [{ ...faktur fields, amount }]
  const [allocations, setAllocations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleProofSelect = (id, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      openNotification({
        open: true,
        title: "Format tidak didukung",
        message: "Bukti pembayaran harus berupa file gambar.",
        alert: { color: "warning" },
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      openNotification({
        open: true,
        title: "Ukuran file terlalu besar",
        message: "Ukuran bukti pembayaran maksimal 5 MB.",
        alert: { color: "warning" },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAllocations((prev) =>
        prev.map((row) =>
          String(row.id) === String(id)
            ? {
                ...row,
                paymentProof: {
                  name: file.name,
                  type: file.type,
                  dataUrl: reader.result,
                },
              }
            : row,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const removeProof = (id) => {
    setAllocations((prev) =>
      prev.map((row) =>
        String(row.id) === String(id) ? { ...row, paymentProof: null } : row,
      ),
    );
  };

  useEffect(() => {
    if (!bisnisId) {
      setWallets([]);
      setWalletId("");
      return;
    }
    let alive = true;
    setLoadingWallet(true);
    fetchWallets(bisnisId, walletType)
      .then((rows) => {
        if (!alive) return;
        setWallets(rows);
        setWalletId("");
      })
      .catch(() => alive && setWallets([]))
      .finally(() => alive && setLoadingWallet(false));
    return () => {
      alive = false;
    };
  }, [bisnisId, walletType]);

  const openOutstandingModal = () => {
    if (!bisnisId) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Pilih bisnis unit terlebih dahulu",
        alert: { color: "warning" },
      });
      return;
    }
    setModalOpen(true);
  };

  const handleModalConfirm = (rows) => {
    setAllocations((prev) => {
      const map = new Map(prev.map((a) => [String(a.id), a]));
      rows.forEach((r) => {
        const key = String(r.id);
        if (!map.has(key)) {
          map.set(key, {
            ...r,
            amount: String(r.sisa ?? r.total ?? 0),
          });
        }
      });
      return [...map.values()];
    });
    setModalOpen(false);
  };

  const removeAlloc = (id) => {
    setAllocations((prev) => prev.filter((a) => String(a.id) !== String(id)));
  };

  const setAmount = (id, value, max) => {
    const n = Number(value);
    const capped =
      Number.isFinite(n) && n > Number(max) ? String(max) : value;
    setAllocations((prev) =>
      prev.map((a) =>
        String(a.id) === String(id) ? { ...a, amount: capped } : a,
      ),
    );
  };

  const payloadAllocations = useMemo(
    () =>
      allocations
        .map((a) => ({
          faktur_id: Number(a.id),
          amount: Number(a.amount) || 0,
          pemasok_id: a.pemasok_id,
          paymentProof: a.paymentProof,
        }))
        .filter((a) => a.amount > 0),
    [allocations],
  );

  const totalAlloc = payloadAllocations.reduce((s, a) => s + a.amount, 0);
  const pemasokCount = new Set(
    allocations.map((a) => a.pemasok_id).filter(Boolean),
  ).size;

  const selectedWallet = wallets.find(
    (w) => String(w.id) === String(walletId),
  );
  const previousAttachments = Array.isArray(detailRow?.attachments)
    ? detailRow.attachments
    : Array.isArray(detailRow?.lampiran)
      ? detailRow.lampiran
      : Array.isArray(detailRow?.files)
        ? detailRow.files
        : [];

  const canSubmit =
    bisnisId &&
    payloadAllocations.length > 0 &&
    totalAlloc > 0 &&
    walletId &&
    selectedWallet?.coa_id;

  const submit = async (post) => {
    if (!canSubmit) {
      openNotification({
        open: true,
        title: "Validasi",
        message: !selectedWallet?.coa_id
          ? "Wallet belum punya COA di master bank/kas"
          : "Lengkapi bisnis, wallet, dan alokasi faktur",
        alert: { color: "warning" },
      });
      return;
    }
    setSaving(true);
    try {
      const body = {
        bisnis_id: Number(bisnisId),
        trx_date: trxDate,
        narasi:
          narasi ||
          `Pembayaran ${payloadAllocations.length} faktur / ${pemasokCount} pemasok`,
        allocations: payloadAllocations.map((a) => ({
          faktur_id: a.faktur_id,
          amount: a.amount,
          bukti_pembayaran: a.paymentProof?.dataUrl || undefined,
        })),
        post: Boolean(post),
      };
      if (walletType === "bank") body.bank_id = Number(walletId);
      else body.kas_id = Number(walletId);

      const data = await createOrderPayment(body);
      const proofs = Object.fromEntries(
        allocations
          .filter((allocation) => allocation.paymentProof?.dataUrl)
          .map((allocation) => [String(allocation.id), allocation.paymentProof]),
      );
      if (data?.id && Object.keys(proofs).length && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            `order-payment-proofs:${data.id}`,
            JSON.stringify(proofs),
          );
        } catch (_) {
          // The payment is already saved; storage limits should not block navigation.
        }
      }
      openNotification({
        open: true,
        title: "Berhasil",
        message: post
          ? "Pembayaran dibuat & diposting"
          : "Draft pembayaran dibuat",
        alert: { color: "success" },
      });
      router.push(`/orders-payments/${data?.id}`);
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal",
        message: err?.message || "Gagal menyimpan pembayaran",
        alert: { color: "error" },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumbs
        custom
        heading="Add Pembayaran"
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Orders Payments", to: "/orders-payments" },
          { title: "Add Pembayaran" },
        ]}
      />

      <MainCard title={<BtnBack href="/orders-payments" />} content>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Pembayaran multi-faktur (multi-pemasok, satu bisnis)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Pilih bisnis → muat outstanding → centang faktur → alokasi nominal →
          posting dari satu kas/bank.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={bisnis}
              value={getSelectedOption(bisnis, bisnisId)}
              getOptionLabel={(o) => o.name || o.kode || ""}
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
              onChange={(_, o) => {
                setBisnisId(o?.id || "");
                setAllocations([]);
              }}
              renderInput={(p) => (
                <TextField {...p} label="Bisnis Unit *" required />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal bayar"
              InputLabelProps={{ shrink: true }}
              value={trxDate}
              onChange={(e) => setTrxDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
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
                wallets.find((w) => String(w.id) === String(walletId)) || null
              }
              getOptionLabel={(o) => o.label || o.name || ""}
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
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
                      : bisnisId
                        ? "Pilih rekening/kas"
                        : "Pilih bisnis dulu"
                  }
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
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

        <Stack direction="row" spacing={1.5} mt={2} mb={2}>
          <Button
            variant="contained"
            onClick={openOutstandingModal}
            disabled={!bisnisId}
          >
            Muat faktur outstanding
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Alokasi faktur
        </Typography>

        {!allocations.length ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Belum ada alokasi. Klik &quot;Muat faktur outstanding&quot; lalu
            centang faktur yang akan dibayar.
          </Alert>
        ) : (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {allocations.map((row) => {
              const invoiceCode = row.kdfb || row.faktur_kode || `Faktur #${row.id}`;
              const gross = Number(row.grandtotal ?? row.total) || 0;
              const remaining = Number(row.sisa) || 0;
              const amount = Number(row.amount) || 0;
              const status = row.status_label || row.sts_paid || "Outstanding";
              const proof = row.paymentProof;

              return (
                <Card
                  key={row.id}
                  variant="outlined"
                  sx={{
                    overflow: "hidden",
                    borderRadius: 2.5,
                    borderColor: "divider",
                    transition: "box-shadow 180ms ease, border-color 180ms ease",
                    "&:hover": {
                      borderColor: "primary.light",
                      boxShadow: "0 8px 24px rgba(31, 41, 55, 0.08)",
                    },
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      px: { xs: 1.5, sm: 2 },
                      py: 1.25,
                      background: `linear-gradient(100deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.info.main, 0.025)})`,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    })}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ sm: "center" }}
                      spacing={1}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          }}
                        >
                          <Receipt2 size={18} />
                        </Box>
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={800} noWrap>
                            {invoiceCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {row.pemasok_nama || "Pemasok belum tersedia"}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Chip
                          size="small"
                          label={status}
                          color={String(status).toLowerCase().includes("lunas") ? "success" : "warning"}
                          variant="outlined"
                        />
                        <Tooltip title="Lihat detail faktur">
                          <IconButton size="small" color="primary" onClick={() => setDetailRow(row)}>
                            <Eye size={17} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus dari alokasi">
                          <IconButton size="small" color="error" onClick={() => removeAlloc(row.id)}>
                            <Trash size={17} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={7}>
                        <Grid container spacing={1.25}>
                          <Grid item xs={12} sm={6}>
                            <InfoField label="Purchase Order" value={row.no_po || "—"} bold />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoField label="Pengajuan Dana" value={row.no_pd || "—"} bold />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoField label="Cabang" value={row.cabang_nama || "—"} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoField label="Metode" value={row.metode || "—"} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoField label="Tanggal faktur" value={formatLongDate(row.date_faktur)} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoField label="Jatuh tempo" value={formatLongDate(row.due_date)} accent={remaining > 0 ? "warning.dark" : "success.main"} />
                          </Grid>
                          <Grid item xs={12}>
                            <InfoField
                              label="Rekening tujuan"
                              value={[row.bank, row.norekening, row.penerima].filter(Boolean).join(" · ") || "Belum tersedia"}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} md={5}>
                        <Box
                          sx={{
                            height: "100%",
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "grey.50",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <InfoField label="Total faktur" value={money(gross)} />
                            <InfoField label="Sisa" value={money(remaining)} accent="warning.dark" />
                          </Stack>
                          <Divider sx={{ my: 1.25 }} />
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Nominal dibayar
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={row.amount}
                            onChange={(e) => setAmount(row.id, e.target.value, row.sisa)}
                            inputProps={{ min: 0, max: row.sisa, step: "0.01" }}
                            InputProps={{ startAdornment: <Typography color="text.secondary" mr={1}>Rp</Typography> }}
                          />
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                            Maksimal {money(remaining)} · {amount > 0 ? `${((amount / Math.max(remaining, 1)) * 100).toFixed(1)}% dari sisa` : "Belum dialokasikan"}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Box
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            border: "1px dashed",
                            borderColor: proof ? "success.main" : "divider",
                            bgcolor: proof ? "success.lighter" : "background.default",
                          }}
                        >
                          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.25}>
                            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                              <Gallery size={19} color={proof ? "#2e7d32" : "#64748b"} />
                              <Box minWidth={0}>
                                <Typography variant="body2" fontWeight={700}>
                                  Bukti pembayaran <Typography component="span" variant="caption" color="text.secondary">(opsional)</Typography>
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                  {proof?.name || "Upload foto / screenshot bukti transfer"}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button component="label" size="small" variant={proof ? "outlined" : "contained"} startIcon={<Gallery size={15} />}>
                                {proof ? "Ganti bukti" : "Upload bukti"}
                                <input hidden type="file" accept="image/*" onChange={(e) => handleProofSelect(row.id, e)} />
                              </Button>
                              {proof && (
                                <Button size="small" color="error" onClick={() => removeProof(row.id)}>
                                  Hapus
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                          {proof?.dataUrl && (
                            <Box
                              component="img"
                              src={proof.dataUrl}
                              alt={`Bukti pembayaran ${invoiceCode}`}
                              sx={{ mt: 1.25, width: 92, height: 64, objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={2}
        >
          <Alert severity="info" sx={{ flex: 1 }}>
            Total alokasi: <strong>{money(totalAlloc)}</strong> ·{" "}
            {payloadAllocations.length} faktur · {pemasokCount} pemasok
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              disabled={saving}
              onClick={() => router.push("/orders-payments")}
            >
              Batal
            </Button>
            <Button
              variant="outlined"
              disabled={saving || !canSubmit}
              onClick={() => submit(false)}
            >
              {saving ? "Menyimpan…" : "Simpan draft"}
            </Button>
            <Button
              variant="contained"
              disabled={saving || !canSubmit}
              onClick={() => submit(true)}
            >
              {saving ? "Memposting…" : "Posting bayar"}
            </Button>
          </Stack>
        </Stack>
      </MainCard>

      <OutstandingModal
        open={modalOpen}
        bisnisId={bisnisId}
        excludeIds={allocations.map((a) => a.id)}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />

      <Dialog
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: "primary.main"
                }}
              >
                <Receipt2 size={22} />
              </Box>
              <Stack>
                <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                  Detail Faktur
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {detailRow?.kdfb || detailRow?.faktur_kode || "—"}
                </Typography>
              </Stack>
            </Stack>
            <Chip
              size="small"
              label={detailRow?.status_label || detailRow?.sts_paid || "bersisa"}
              color={detailRow?.status_label === "Lunas" ? "success" : "warning"}
              variant="outlined"
              sx={{ textTransform: "capitalize" }}
            />
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3 }}>
          {detailRow ? (
            <Stack spacing={2.5}>
              {/* Sumber berkas PO & PD */}
              <SectionCard
                icon={<CardReceive size={18} />}
                title="Sumber Berkas"
                accent="#6366f1"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Purchase Order (PO)" value={detailRow.no_po || "—"} bold />
                    {detailRow.reff_po ? (
                      <Typography variant="caption" color="text.secondary">
                        Ref: {detailRow.reff_po}
                      </Typography>
                    ) : null}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Pengajuan Dana (PD)" value={detailRow.no_pd || "—"} bold />
                    {detailRow.reff_pd ? (
                      <Typography variant="caption" color="text.secondary">
                        Ref: {detailRow.reff_pd}
                      </Typography>
                    ) : null}
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Informasi Pemasok */}
              <SectionCard
                icon={<Receipt2 size={18} />}
                title="Informasi Faktur"
                accent="#0ea5e9"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Pemasok" value={detailRow.pemasok_nama || "—"} bold />
                    <Typography variant="caption" color="text.secondary">
                      {detailRow.pemasok_alamat || detailRow.pemasok_kode || ""}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Metode" value={detailRow.metode || "—"} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Unit Bisnis"
                      value={
                        detailRow.bisnis_kode && detailRow.bisnis_nama
                          ? `${detailRow.bisnis_kode} — ${detailRow.bisnis_nama}`
                          : detailRow.bisnis_nama || detailRow.bisnis_kode || "—"
                      }
                      bold
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Cabang" value={detailRow.cabang_nama || "—"} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Tanggal Faktur"
                      value={formatLongDate(detailRow.date_faktur || detailRow.created_at)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Jatuh Tempo" value={formatLongDate(detailRow.due_date)} />
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Rekening tujuan transfer */}
              <SectionCard
                icon={<Bank size={18} />}
                title="Rekening Tujuan Transfer"
                accent="#10b981"
              >
                {detailRow.norekening || detailRow.bank || detailRow.penerima ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="Bank" value={detailRow.bank || "—"} bold />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="Nomor Rekening" value={detailRow.norekening || "—"} bold />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="Atas Nama" value={detailRow.penerima || "—"} />
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada informasi rekening tujuan.
                  </Typography>
                )}
              </SectionCard>

              {/* Berkas dari proses sebelumnya */}
              <SectionCard
                icon={<Gallery size={18} />}
                title="Berkas dari Proses Sebelumnya"
                accent="#f59e0b"
              >
                {previousAttachments.length > 0 ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
                    {previousAttachments.map((att, idx) => {
                      const url = attachmentUrl(att);
                      if (!url) return null;
                      const name = attachmentName(att, idx);
                      return isImageAttachment(att) ? (
                        <Tooltip key={`${url}-${idx}`} title={`${name} · Klik untuk membuka`}>
                          <Box
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: "block",
                              width: { xs: "100%", sm: 138 },
                              height: 110,
                              borderRadius: 2,
                              overflow: "hidden",
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "grey.100",
                              "&:hover img": { transform: "scale(1.05)" },
                            }}
                          >
                            <Box
                              component="img"
                              src={url}
                              alt={name}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          </Box>
                        </Tooltip>
                      ) : (
                        <Box
                          key={`${url}-${idx}`}
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: { xs: "100%", sm: 250 },
                            minHeight: 64,
                            px: 1.25,
                            py: 1,
                            borderRadius: 2,
                            color: "text.primary",
                            textDecoration: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                            "&:hover": { borderColor: "primary.main", bgcolor: "primary.lighter" },
                          }}
                        >
                          <Gallery size={22} />
                          <Typography variant="body2" fontWeight={600} noWrap title={name}>
                            {name}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada berkas dari proses sebelumnya.
                    </Typography>
                  </Stack>
                )}
              </SectionCard>

              {/* Ringkasan nominal */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                  border: "1px solid",
                  borderColor: "divider"
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <InfoField label="Total" value={money(detailRow.grandtotal ?? detailRow.total)} bold />
                  </Grid>
                  <Grid item xs={4}>
                    <InfoField label="Sisa" value={money(detailRow.sisa ?? detailRow.total)} bold accent="error.main" />
                  </Grid>
                  <Grid item xs={4}>
                    <InfoField label="Kode Bayar" value={detailRow.kdbayar || "Belum ada"} />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setDetailRow(null)}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SectionCard({ icon, title, accent, children }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Box sx={{ color: accent, display: "flex" }}>{icon}</Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoField({ label, value, bold = false, accent = "text.primary" }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={bold ? 700 : 500}
        color={accent}
        sx={{ wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Box>
  );
}
