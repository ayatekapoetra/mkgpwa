"use client";

import { useState } from "react";
import DetailActions from "./DetailActions";
import { useParams } from "next/navigation";
import {
  Alert,
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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DocumentText, Edit, Gallery, Receipt2 } from "iconsax-react";

import {
  updateFakturPembelian,
  useFakturPembelianDetail,
} from "api/faktur-pembelian";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";


import {
  formatDate,
  INSTALLMENT_LABELS,
  money,
  TOP_TYPE_LABELS,
} from "./utils";

const Field = ({ label, value }) => (
  <Stack spacing={0.25}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value ?? "—"}
    </Typography>
  </Stack>
);

export default function FakturPembelianDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { row, loading, error, refresh } = useFakturPembelianDetail(id, Boolean(id));
  const permissions = row?.permissions || {};
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kode: "", date_faktur: "", title: "", penerima: "" });

  const header = row?.header || null;
  const termins = row?.termins || [];
  const payments = row?.payments || [];
  const logs = row?.reschedule_logs || [];
  const attachments = row?.attachments || [];
  const items = row?.items || [];



  const canEdit = Boolean(row?.permissions?.can_update);

  const openEdit = () => {
    setForm({
      kode: header?.kode || "",
      date_faktur: header?.date_faktur ? String(header.date_faktur).slice(0, 10) : "",
      title: header?.title || "",
      penerima: header?.penerima || "",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateFakturPembelian(header.id, {
        kode: form.kode,
        date_faktur: form.date_faktur || null,
        title: form.title,
        penerima: form.penerima,
      });
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Faktur berhasil diperbarui",
        alert: { color: "success" },
      });
      setEditOpen(false);
      await refresh();
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal",
        message: err?.message || "Gagal memperbarui faktur",
        alert: { color: "error" },
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box py={8} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !header) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Gagal memuat faktur pembelian. {error?.message}
      </Alert>
    );
  }

  return (
    <>
      <Breadcrumbs
        custom
        heading={header.kdfb || "Faktur Pembelian"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Chasier" },
          { title: "Faktur Pembelian", to: "/faktur-pembelian" },
          { title: header.kdfb || String(id) },
        ]}
      />

      <MainCard
        title={<BtnBack href="/faktur-pembelian" />}
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            {canEdit ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Edit size={16} />}
                onClick={openEdit}
              >
                Edit
              </Button>
            ) : null}
            <Chip
              size="small"
              color={Number(header.sisa) > 0 ? "warning" : "success"}
              label={Number(header.sisa) > 0 ? "Belum Lunas" : "Lunas"}
            />
          </Stack>
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
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,.16)",
                }}
              >
                <Receipt2 size={26} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.72, letterSpacing: 1.2 }}>
                  Faktur Pembelian
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {header.kdfb || `#${header.id}`}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.78, mt: 0.25 }}>
                  {header.pemasok_nama || "Pemasok tidak tersedia"}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" sx={{ opacity: 0.72 }}>
                Sisa tagihan
              </Typography>
              <Typography variant="h3" fontWeight={900}>
                Rp {money(header.sisa)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.78 }}>
                dari Rp {money(header.grandtotal)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Grid container spacing={2} mt={1.5}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" mb={1.5}>
                  Informasi Dokumen
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Field
                      label="Sumber"
                      value={
                        header.source_type === "po"
                          ? `PO ${header.no_po || ""}`.trim()
                          : header.source_type === "pd"
                            ? `PD ${header.nopd || ""}`.trim()
                            : "Manual"
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Field label="No. Invoice Vendor" value={header.kode} />
                      {canEdit ? (
                        <Tooltip title="Edit No. Invoice Vendor">
                          <IconButton size="small" onClick={openEdit}>
                            <Edit size={14} />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Field label="Catatan / Narasi" value={header.narasi} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field label="Bisnis Unit" value={header.bisnis_nama} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field label="Cabang" value={header.cabang_nama} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field label="Tanggal Faktur" value={formatDate(header.date_faktur)} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      label="Jatuh Tempo"
                      value={formatDate(header.next_due_date || header.due_date)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Field label="Skema" value={TOP_TYPE_LABELS[header.top_type] || header.top_type} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field label="Metode" value={header.metode} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      label="Status Termin"
                      value={INSTALLMENT_LABELS[header.installment_status] || header.installment_status}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      label="Umur"
                      value={header.aging_days ? `${header.aging_days} hari` : "—"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      label="Rencana Pembayaran"
                      value={header.planned ? header.planned_kdbayar : "Belum direncanakan"}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <DocumentText size={18} />
                  <Typography variant="h6">Nilai</Typography>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Grand Total</Typography>
                    <Typography variant="body2" fontWeight={600}>{money(header.grandtotal)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Potongan</Typography>
                    <Typography variant="body2" fontWeight={600}>{money(header.potongan)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">PPN</Typography>
                    <Typography variant="body2" fontWeight={600}>{money(header.ppn_rp)}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Sisa</Typography>
                    <Typography variant="body2" fontWeight={800} color="warning.main">
                      {money(header.sisa)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" mb={1.5}>
              Item Faktur
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <Box component="thead">
                  <Box component="tr">
                    {["Barang", "COA", "Qty", "Satuan", "Harga", "PPN", "Subtotal"].map((h) => (
                      <Box
                        component="th"
                        key={h}
                        sx={{ textAlign: "left", p: 1, borderBottom: "1px solid", borderColor: "divider" }}
                      >
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {items.map((it) => (
                    <Box component="tr" key={it.id}>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                        {it.barang_kode ? `${it.barang_kode} — ` : ""}
                        {it.barang_nama || it.description || "—"}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                        {it.kode_coa || "—"}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                        {it.qty}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                        {it.stn || "—"}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider", textAlign: "right" }}>
                        {money(it.harga_stn)}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider", textAlign: "right" }}>
                        {money(it.ppn_rp)}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider", textAlign: "right" }}>
                        {money(it.subtotal)}
                      </Box>
                    </Box>
                  ))}
                  {!items.length ? (
                    <Box component="tr">
                      <Box component="td" colSpan={7} sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                        Tidak ada item.
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={2} mt={0.5}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" mb={1.5}>Termin</Typography>
                {termins.length ? (
                  <Stack spacing={1}>
                    {termins.map((t) => (
                      <Stack key={t.id} direction="row" justifyContent="space-between">
                        <Typography variant="body2">
                          Termin {t.termin_no} ({t.termin_type})
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Typography variant="body2" fontWeight={600}>{money(t.nominal)}</Typography>
                          <Chip size="small" label={t.status} />
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Faktur ini tidak memiliki termin.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" mb={1.5}>Riwayat Pembayaran</Typography>
                {payments.length ? (
                  <Stack spacing={1}>
                    {payments.map((p) => (
                      <Stack key={`${p.payment_id}-${p.kdbayar}`} direction="row" justifyContent="space-between">
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>{p.kdbayar}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(p.date_paid || p.trx_date)} · {p.tipe_paid || "—"}
                          </Typography>
                        </Stack>
                        <Stack alignItems="flex-end">
                          <Typography variant="body2">{money(p.nilai)}</Typography>
                          <Chip
                            size="small"
                            color={p.status === "posted" ? "success" : "warning"}
                            label={p.status === "posted" ? "Posted" : "Rencana"}
                          />
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Belum ada pembayaran.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" mb={1.5}>Riwayat Penjadwalan Ulang</Typography>
                {logs.length ? (
                  <Stack spacing={1}>
                    {logs.map((l) => (
                      <Stack key={l.id} spacing={0.25}>
                        <Typography variant="body2">
                          {formatDate(l.old_due_date)} → {formatDate(l.new_due_date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.reason || "—"} · {l.rescheduled_at || "—"}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Belum ada perubahan jatuh tempo.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <Gallery size={18} />
                  <Typography variant="h6">Lampiran</Typography>
                </Stack>
                {attachments.length ? (
                  <Stack spacing={1}>
                    {attachments.map((a) => (
                      <Box
                        key={a.id}
                        component="a"
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "primary.main", fontSize: 13 }}
                      >
                        {a.name || `Lampiran ${a.id}`}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Belum ada lampiran.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </MainCard>

      <DetailActions key={id} id={id} header={header} permissions={permissions} refresh={refresh} />

      <Dialog
        open={editOpen}
        onClose={() => (saving ? null : setEditOpen(false))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Faktur Pembelian</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} mt={0.5}>
            <TextField
              fullWidth
              size="small"
              label="No. Invoice Vendor"
              value={form.kode}
              onChange={(e) => setForm((p) => ({ ...p, kode: e.target.value }))}
              helperText="Nomor faktur dari pemasok (boleh dikosongkan)"
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Tanggal Faktur"
              InputLabelProps={{ shrink: true }}
              value={form.date_faktur}
              onChange={(e) => setForm((p) => ({ ...p, date_faktur: e.target.value }))}
            />
            <TextField
              fullWidth
              size="small"
              label="Penerima"
              value={form.penerima}
              onChange={(e) => setForm((p) => ({ ...p, penerima: e.target.value }))}
            />
            <TextField
              fullWidth
              size="small"
              label="Catatan"
              multiline
              minRows={2}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <Alert severity="info">
              Tanggal jatuh tempo tidak diubah di sini. Gunakan tombol
              <strong> Edit Jatuh Tempo / Narasi</strong> agar perubahan tercatat
              di audit dan memerlukan persetujuan.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button variant="contained" onClick={submitEdit} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
