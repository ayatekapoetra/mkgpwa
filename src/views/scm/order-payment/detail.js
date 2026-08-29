"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Link as MuiLink,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  fetchCashAccounts,
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

  const [cashAccounts, setCashAccounts] = useState([]);
  const [coaKredit, setCoaKredit] = useState("");
  const [trxDate, setTrxDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [narasi, setNarasi] = useState("");
  const [posting, setPosting] = useState(false);

  const pending = row?.status === "pending";

  useEffect(() => {
    if (!row?.bisnis_id) return;
    let alive = true;
    fetchCashAccounts(row.bisnis_id)
      .then((list) => {
        if (!alive) return;
        setCashAccounts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setCashAccounts([]);
      });
    return () => {
      alive = false;
    };
  }, [row?.bisnis_id]);

  useEffect(() => {
    if (!row) return;
    setNarasi(row.narasi || "");
    if (row.trx_date) {
      const d = new Date(row.trx_date);
      if (!Number.isNaN(d.getTime())) setTrxDate(d.toISOString().slice(0, 10));
    }
    if (row.coa_kredit) setCoaKredit(String(row.coa_kredit));
  }, [row]);

  const canPost = permissions.can_post && pending;

  const accountOptions = useMemo(
    () =>
      cashAccounts.map((a) => ({
        value: String(a.id),
        label: a.label || `${a.kode} — ${a.name}`,
        type: a.type,
      })),
    [cashAccounts],
  );

  const handlePost = async () => {
    if (!coaKredit) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Pilih akun kas/bank terlebih dahulu",
        alert: { color: "warning" },
      });
      return;
    }
    if (
      !window.confirm(
        "Posting pembayaran ini? Status akan menjadi Sudah Bayar dan jurnal kas akan dicatat.",
      )
    ) {
      return;
    }
    setPosting(true);
    try {
      await postOrderPayment(id, {
        coa_kredit: Number(coaKredit),
        trx_date: trxDate,
        narasi,
      });
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

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Item
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Faktur</TableCell>
              <TableCell>Barang / Deskripsi</TableCell>
              <TableCell>Akun Debit</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Harga</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(row.items || []).map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.faktur_kode || it.trx_beli || "—"}</TableCell>
                <TableCell>
                  {it.barang_nama || it.description || it.barang_kode || "—"}
                </TableCell>
                <TableCell>
                  {it.debit_kode
                    ? `${it.debit_kode} — ${it.debit_name || ""}`
                    : "—"}
                </TableCell>
                <TableCell align="right">{it.qty}</TableCell>
                <TableCell align="right">{money(it.harga_stn)}</TableCell>
                <TableCell align="right">{money(it.subtotal)}</TableCell>
              </TableRow>
            ))}
            {!(row.items || []).length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">Tidak ada item</Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        {canPost ? (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Posting pembayaran
            </Typography>
            <Grid container spacing={2} maxWidth={720}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Akun Kas / Bank"
                  value={coaKredit}
                  onChange={(e) => setCoaKredit(e.target.value)}
                  helperText={
                    accountOptions.length
                      ? "Pilih sumber dana"
                      : "Tidak ada akun kas/bank untuk unit ini"
                  }
                >
                  {accountOptions.map((a) => (
                    <MenuItem key={a.value} value={a.value}>
                      {a.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal bayar"
                  InputLabelProps={{ shrink: true }}
                  value={trxDate}
                  onChange={(e) => setTrxDate(e.target.value)}
                />
              </Grid>
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
                    disabled={posting || !coaKredit}
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
