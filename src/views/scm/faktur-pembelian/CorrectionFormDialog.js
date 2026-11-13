"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { openNotification } from "api/notification";
import { requestInvoiceCorrection } from "api/faktur-pembelian";

const TIPE = {
  FULL: "FULL",
  NARASI_REKENING: "NARASI_REKENING",
};

const TIPE_LABEL = {
  FULL: "Koreksi penuh (item, qty, harga, PPN)",
  NARASI_REKENING: "Narasi / rekening saja (nominal terkunci)",
};

const money = (value) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    Number(value) || 0,
  );

const round2 = (value) =>
  Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;

/**
 * Form pengajuan koreksi faktur pembelian.
 *
 * Aturan yang ditampilkan ke user (PRD-APINV-002):
 * - FULL hanya bila belum dibayar DAN belum diterima (BR-04)
 * - NARASI_REKENING bila sudah dibayar/diterima; nominal terkunci (BR-05)
 * - Alasan wajib (AC-04)
 */
export default function CorrectionFormDialog({
  open,
  onClose,
  faktur,
  items = [],
  onSuccess,
}) {
  const readOnlyNominal = Boolean(faktur?.is_paid || faktur?.is_received);
  const [tipe, setTipe] = useState(readOnlyNominal ? TIPE.NARASI_REKENING : TIPE.FULL);
  const [alasan, setAlasan] = useState("");
  const [header, setHeader] = useState({
    kode: "",
    title: "",
    norekening: "",
    bank: "",
    penerima: "",
    date_faktur: "",
  });
  const [lines, setLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTipe(readOnlyNominal ? TIPE.NARASI_REKENING : TIPE.FULL);
    setAlasan("");
    setError("");
    setHeader({
      kode: faktur?.kode ?? "",
      title: faktur?.title ?? "",
      norekening: faktur?.norekening ?? "",
      bank: faktur?.bank ?? "",
      penerima: faktur?.penerima ?? "",
      date_faktur: (faktur?.date_faktur || "").slice(0, 10),
    });
    setLines(
      (items || []).map((item) => ({
        faktur_item_id: item.id,
        qty: item.qty ?? 0,
        harga_stn: item.harga_stn ?? 0,
        ppn_rp: item.ppn_rp ?? 0,
        description: item.description ?? "",
        sebelum: {
          qty: Number(item.qty) || 0,
          harga_stn: Number(item.harga_stn) || 0,
          ppn_rp: Number(item.ppn_rp) || 0,
          description: item.description ?? "",
        },
      })),
    );
  }, [open, faktur, items, readOnlyNominal]);

  const totalsAfter = useMemo(() => {
    const subtotal = round2(
      lines.reduce(
        (sum, line) => sum + (Number(line.qty) || 0) * (Number(line.harga_stn) || 0),
        0,
      ),
    );
    const ppn = round2(lines.reduce((sum, line) => sum + (Number(line.ppn_rp) || 0), 0));
    return { subtotal, ppn, grandtotal: round2(subtotal + ppn) };
  }, [lines]);

  const changedLines = useMemo(
    () =>
      lines.filter((line) => {
        const b = line.sebelum;
        return (
          Number(line.qty) !== b.qty ||
          Number(line.harga_stn) !== b.harga_stn ||
          Number(line.ppn_rp) !== b.ppn_rp ||
          String(line.description || "") !== String(b.description || "")
        );
      }),
    [lines],
  );

  const headerChanged = useMemo(() => {
    const original = {
      kode: faktur?.kode ?? "",
      title: faktur?.title ?? "",
      norekening: faktur?.norekening ?? "",
      bank: faktur?.bank ?? "",
      penerima: faktur?.penerima ?? "",
      date_faktur: (faktur?.date_faktur || "").slice(0, 10),
    };
    return Object.keys(header).some(
      (key) => String(header[key] || "") !== String(original[key] || ""),
    );
  }, [header, faktur]);

  const canSubmit =
    alasan.trim().length > 0 &&
    (headerChanged || changedLines.length > 0) &&
    !submitting;

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!alasan.trim()) {
      setError("Alasan koreksi wajib diisi.");
      return;
    }
    if (!headerChanged && changedLines.length === 0) {
      setError("Tidak ada perubahan yang diajukan.");
      return;
    }

    const body = {
      alasan: alasan.trim(),
      tipe_koreksi: tipe,
    };

    if (headerChanged) {
      const patch = {};
      Object.keys(header).forEach((key) => {
        const original =
          key === "date_faktur"
            ? (faktur?.date_faktur || "").slice(0, 10)
            : (faktur?.[key] ?? "");
        if (String(header[key] || "") !== String(original || "")) {
          patch[key] = header[key] === "" ? null : header[key];
        }
      });
      Object.assign(body, patch);
    }

    if (tipe === TIPE.FULL && changedLines.length > 0) {
      body.items = changedLines.map((line) => ({
        faktur_item_id: line.faktur_item_id,
        qty_sesudah: Number(line.qty),
        harga_sesudah: Number(line.harga_stn),
        ppn_sesudah: Number(line.ppn_rp),
        description: line.description,
      }));
    }

    if (tipe === TIPE.NARASI_REKENING && changedLines.length > 0) {
      body.items = changedLines.map((line) => ({
        faktur_item_id: line.faktur_item_id,
        description: line.description,
      }));
    }

    try {
      setSubmitting(true);
      await requestInvoiceCorrection(faktur.id, body);
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Pengajuan koreksi dikirim, menunggu verifikasi Accounting",
        alert: { color: "success" },
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Gagal mengajukan koreksi");
    } finally {
      setSubmitting(false);
    }
  };

  if (!faktur) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Ajukan Koreksi Faktur</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Faktur <strong>{faktur.kdfb || faktur.id}</strong>
            {readOnlyNominal
              ? " sudah dibayar / diterima — hanya narasi & rekening yang dapat diubah (nominal terkunci)."
              : " belum dibayar dan belum diterima — item, qty, harga, dan PPN dapat diubah."}
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <FormControl>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Tipe koreksi
            </Typography>
            <RadioGroup
              row
              value={tipe}
              onChange={(e) => setTipe(e.target.value)}
            >
              <FormControlLabel
                value={TIPE.FULL}
                control={<Radio size="small" />}
                label={TIPE_LABEL.FULL}
                disabled={readOnlyNominal}
              />
              <FormControlLabel
                value={TIPE.NARASI_REKENING}
                control={<Radio size="small" />}
                label={TIPE_LABEL.NARASI_REKENING}
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          <Typography variant="subtitle2">Data faktur</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="No. faktur pemasok"
                value={header.kode}
                onChange={(e) => setHeader((p) => ({ ...p, kode: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Tanggal faktur"
                value={header.date_faktur}
                onChange={(e) =>
                  setHeader((p) => ({ ...p, date_faktur: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Nama bank"
                value={header.bank}
                onChange={(e) => setHeader((p) => ({ ...p, bank: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="No. rekening"
                value={header.norekening}
                onChange={(e) =>
                  setHeader((p) => ({ ...p, norekening: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Atas nama"
                value={header.penerima}
                onChange={(e) =>
                  setHeader((p) => ({ ...p, penerima: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Catatan"
                value={header.title}
                onChange={(e) => setHeader((p) => ({ ...p, title: e.target.value }))}
              />
            </Grid>
          </Grid>

          {lines.length > 0 && (
            <>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Item faktur</Typography>
                <Chip
                  size="small"
                  label={`${changedLines.length} baris berubah`}
                  color={changedLines.length ? "warning" : "default"}
                />
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                  <Box component="thead">
                    <Box component="tr">
                      {["Deskripsi", "Qty", "Harga", "PPN", "Subtotal"].map((h) => (
                        <Box
                          component="th"
                          key={h}
                          sx={{
                            textAlign: "left",
                            py: 1,
                            px: 1,
                            borderBottom: 1,
                            borderColor: "divider",
                            typography: "caption",
                            color: "text.secondary",
                          }}
                        >
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {lines.map((line, index) => {
                      const subtotal = round2(
                        (Number(line.qty) || 0) * (Number(line.harga_stn) || 0),
                      );
                      return (
                        <Box component="tr" key={line.faktur_item_id}>
                          <Box component="td" sx={{ py: 1, px: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={line.description}
                              onChange={(e) =>
                                updateLine(index, "description", e.target.value)
                              }
                            />
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1, width: 100 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={line.qty}
                              disabled={tipe === TIPE.NARASI_REKENING}
                              onChange={(e) => updateLine(index, "qty", e.target.value)}
                            />
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1, width: 140 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={line.harga_stn}
                              disabled={tipe === TIPE.NARASI_REKENING}
                              onChange={(e) =>
                                updateLine(index, "harga_stn", e.target.value)
                              }
                            />
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1, width: 120 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={line.ppn_rp}
                              disabled={tipe === TIPE.NARASI_REKENING}
                              onChange={(e) => updateLine(index, "ppn_rp", e.target.value)}
                            />
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1, width: 130 }}>
                            <Typography variant="body2">{money(subtotal)}</Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={3} justifyContent="flex-end">
                <Typography variant="body2">
                  Subtotal: <strong>{money(totalsAfter.subtotal)}</strong>
                </Typography>
                <Typography variant="body2">
                  PPN: <strong>{money(totalsAfter.ppn)}</strong>
                </Typography>
                <Typography variant="body2">
                  Grand total: <strong>{money(totalsAfter.grandtotal)}</strong>
                </Typography>
              </Stack>
            </>
          )}

          <Divider />
          <TextField
            fullWidth
            multiline
            minRows={3}
            required
            label="Alasan koreksi"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            helperText="Wajib diisi — akan tercatat di audit trail"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={submitting}>
          Batal
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {submitting ? <CircularProgress size={16} /> : "Ajukan Koreksi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
