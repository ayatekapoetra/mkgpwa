"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
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
  Grid,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Gallery, Receipt2 } from "iconsax-react";

import {
  fetchWallets,
  postOrderPayment,
  useOrderPaymentAccess,
  useOrderPaymentDetail,
} from "api/order-payments";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import BtnBack from "components/BtnBack";
import { APP_DEFAULT_PATH } from "config";

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const dateId = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toLocaleDateString("id-ID");
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

const paymentProofStorageKey = (id) => `order-payment-proofs:${id}`;

function Field({ label, value }) {
  return (
    <Box mb={1.5}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function ReferenceLink({ href, children }) {
  return (
    <MuiLink
      component={NextLink}
      href={href}
      variant="body1"
      color="primary"
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
  const [localProofs, setLocalProofs] = useState({});

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
    if (!row) return;
    setNarasi(row.narasi || "");
    if (row.trx_date) {
      const d = new Date(row.trx_date);
      if (!Number.isNaN(d.getTime())) setTrxDate(d.toISOString().slice(0, 10));
    }
  }, [row]);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(paymentProofStorageKey(id));
      setLocalProofs(stored ? JSON.parse(stored) : {});
    } catch (_) {
      setLocalProofs({});
    }
  }, [id]);

  const handleProofUpload = (invoiceId, event) => {
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
      const nextProofs = {
        ...localProofs,
        [String(invoiceId)]: {
          name: file.name,
          type: file.type,
          dataUrl: reader.result,
        },
      };
      setLocalProofs(nextProofs);
      if (id && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(paymentProofStorageKey(id), JSON.stringify(nextProofs));
        } catch (_) {
          // The preview remains available even if browser storage is full.
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const canPost = permissions.can_post && pending;

  const selectedWallet = useMemo(
    () => wallets.find((w) => String(w.id) === String(walletId)),
    [wallets, walletId],
  );

  const handlePost = async () => {
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
      setPosting(false);
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

  const paymentAttachments = Array.isArray(row.payment_attachments)
    ? row.payment_attachments
    : [];

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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Field label="No. Bayar" value={row.kdbayar} />
            <Field label="Party" value={row.party_name} />
            <Field
              label="PO"
              value={
                row.no_po && row.reff ? (
                  <ReferenceLink href={`/purchasing-orders/${row.reff}`}>
                    {row.no_po}
                  </ReferenceLink>
                ) : (
                  row.no_po || "—"
                )
              }
            />
            <Field
              label="PD"
              value={
                row.no_pd && row.reff_pd ? (
                  <ReferenceLink href={`/pengajuan-dana/${row.reff_pd}`}>
                    {row.no_pd}
                  </ReferenceLink>
                ) : (
                  row.no_pd || "—"
                )
              }
            />
            <Field label="Faktur" value={row.faktur_kode || "—"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Field
              label="Total"
              value={money(row.roundtotal || row.total)}
            />
            <Field
              label="Unit / Cabang"
              value={`${row.bisnis_kode || row.bisnis_nama || "—"} · ${row.cabang_nama || "—"}`}
            />
            <Field
              label="Rekening tujuan"
              value={
                row.nm_bank
                  ? `${row.nm_bank} · ${row.no_rekening || ""} · ${row.an_rekening || row.penerima || ""}`
                  : row.penerima || "—"
              }
            />
            <Field label="Tanggal" value={dateId(row.trx_date)} />
            <Field
              label="Akun kas/bank"
              value={
                row.coa_kode
                  ? `${row.coa_kode} — ${row.coa_name || ""}`
                  : "Belum dipilih"
              }
            />
          </Grid>
        </Grid>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Gallery size={20} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Dokumen Pembayaran
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Berkas sebelumnya, bukti sistem, dan upload baru
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              Alokasi Faktur
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dokumen sebelumnya dan bukti pembayaran per alokasi
            </Typography>
          </Box>
          <Chip size="small" label={`${(row.items || []).length} faktur`} variant="outlined" />
        </Stack>
            <Stack spacing={1.5}>
          {(row.items || []).map((it) => {
            const attachments = Array.isArray(it.attachments) ? it.attachments : [];
            const proof = localProofs[String(it.trx_beli)] || it.payment_proof || it.bukti_pembayaran;
            return (
              <Card key={it.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                <Box sx={{ px: 2, py: 1.25, bgcolor: "primary.lighter", borderBottom: "1px solid", borderColor: "divider" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", flexShrink: 0 }}>
                        <Receipt2 size={18} />
                      </Box>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={800} noWrap>
                          {it.faktur_kode || `Faktur #${it.trx_beli}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {it.barang_nama || it.description || it.barang_kode || "Alokasi pembayaran"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                      Rp {money(it.subtotal)}
                    </Typography>
                  </Stack>
                </Box>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Field label="Barang / deskripsi" value={it.barang_nama || it.description || it.barang_kode || "—"} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Field label="Akun debit" value={it.debit_kode ? `${it.debit_kode} — ${it.debit_name || ""}` : "—"} />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                      <Field label="Qty" value={it.qty} />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                      <Field label="Harga satuan" value={`Rp ${money(it.harga_stn)}`} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Field label="Subtotal" value={`Rp ${money(it.subtotal)}`} />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 0.5 }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                        Berkas dari proses sebelumnya
                      </Typography>
                      {attachments.length ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {attachments.map((attachment, index) => {
                            const url = attachmentUrl(attachment);
                            if (!url) return null;
                            const name = attachmentName(attachment, index);
                            return isImageAttachment(attachment) ? (
                              <Tooltip key={`${url}-${index}`} title={`${name} · Buka berkas`}>
                                <Box component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ display: "block", width: 78, height: 58, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.05)" } }}>
                                  <Box component="img" src={url} alt={name} sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s ease" }} />
                                </Box>
                              </Tooltip>
                            ) : (
                              <Box key={`${url}-${index}`} component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", alignItems: "center", gap: 0.75, p: 0.75, border: "1px solid", borderColor: "divider", borderRadius: 1.5, color: "text.primary", textDecoration: "none", maxWidth: "100%" }}>
                                <Gallery size={17} />
                                <Typography variant="caption" noWrap>{name}</Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Tidak ada berkas sebelumnya</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                        Bukti pembayaran dari sistem
                      </Typography>
                      {paymentAttachments.length ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {paymentAttachments.map((attachment, index) => {
                            const url = attachmentUrl(attachment);
                            if (!url) return null;
                            const name = attachmentName(attachment, index);
                            return isImageAttachment(attachment) ? (
                              <Tooltip key={`${url}-${index}`} title={`${name} · Buka berkas`}>
                                <Box component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ display: "block", width: 78, height: 58, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "success.main", "&:hover img": { transform: "scale(1.05)" } }}>
                                  <Box component="img" src={url} alt={name} sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s ease" }} />
                                </Box>
                              </Tooltip>
                            ) : (
                              <Box key={`${url}-${index}`} component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", alignItems: "center", gap: 0.75, p: 0.75, border: "1px solid", borderColor: "success.main", borderRadius: 1.5, color: "text.primary", textDecoration: "none", maxWidth: "100%" }}>
                                <Gallery size={17} />
                                <Typography variant="caption" noWrap>{name}</Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Belum ada bukti dari sistem</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                        Bukti pembayaran
                      </Typography>
                      {proof?.dataUrl || typeof proof === "string" ? (
                        <Box component="a" href={proof?.dataUrl || proof} target="_blank" rel="noopener noreferrer" sx={{ display: "inline-block", width: 110, height: 70, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "success.main" }}>
                          <Box component="img" src={proof?.dataUrl || proof} alt="Bukti pembayaran" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </Box>
                      ) : (
                        <Box
                          component="label"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            minHeight: 76,
                            px: 1.5,
                            border: "1px dashed",
                            borderColor: "primary.light",
                            borderRadius: 2,
                            color: "primary.main",
                            bgcolor: "primary.lighter",
                            cursor: "pointer",
                            transition: "background-color .2s ease, border-color .2s ease",
                            "&:hover": {
                              bgcolor: "primary.100",
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          <Gallery size={22} />
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              Upload bukti pembayaran
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Klik untuk memilih foto atau screenshot · opsional · maks. 5 MB
                            </Typography>
                          </Box>
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleProofUpload(it.trx_beli, event)}
                          />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
          {!(row.items || []).length ? (
            <Alert severity="info">Tidak ada alokasi faktur pada pembayaran ini.</Alert>
          ) : null}
            </Stack>
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
              <Grid item xs={12}>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    disabled={posting || !walletId || !selectedWallet?.coa_id}
                    onClick={handlePost}
                  >
                    {posting ? "Memposting…" : "Posting Bayar"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => router.push("/orders-payments")}
                  >
                    Kembali
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </>
        ) : null}

        {!pending ? (
          <Alert severity="success" sx={{ mt: 3 }}>
            Pembayaran sudah diposting
            {row.coa_kode ? ` ke ${row.coa_kode} — ${row.coa_name || ""}` : ""}.
          </Alert>
        ) : null}
      </MainCard>
    </>
  );
}
