"use client";

import { useState } from "react";
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  approveInvoiceCorrection,
  rejectInvoiceCorrection,
  useCorrectionQueue,
  useFakturPembelianAccess,
} from "api/faktur-pembelian";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";

const STATUS_COLOR = {
  MENUNGGU_VERIFIKASI: "warning",
  DISETUJUI: "success",
  DITOLAK: "error",
};

const STATUS_LABEL = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const TIPE_LABEL = {
  FULL: "Koreksi penuh",
  NARASI_REKENING: "Narasi / rekening",
};

const dateId = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const money = (value) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    Number(value) || 0,
  );

/**
 * Antrian approval koreksi faktur (PRD-APINV-002 AC-14).
 *
 * Accounting menyetujui/menolak. Backend menolak self-approval (BR-08),
 * jadi tombol tetap ditampilkan; pesan error dari server yang menjelaskan.
 */
export default function KoreksiAntrianPage() {
  const [status, setStatus] = useState("MENUNGGU_VERIFIKASI");
  const { rows, loading, error, refresh } = useCorrectionQueue({ status, limit: 50 });
  const { permissions } = useFakturPembelianAccess();

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const canApprove = Boolean(permissions?.can_reschedule_due_date);

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setBusy(true);
      const result = await approveInvoiceCorrection(approveTarget.id, {});
      openNotification({
        open: true,
        title: "Berhasil",
        message: result?.nominal_changed
          ? "Koreksi disetujui. Jurnal koreksi dikirim ke AkunApp."
          : "Koreksi disetujui.",
        alert: { color: "success" },
      });
      setApproveTarget(null);
      await refresh();
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal",
        message: err?.message || "Gagal menyetujui koreksi",
        alert: { color: "error" },
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Alasan penolakan wajib diisi",
        alert: { color: "warning" },
      });
      return;
    }
    try {
      setBusy(true);
      await rejectInvoiceCorrection(rejectTarget.id, rejectReason.trim());
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Pengajuan koreksi ditolak",
        alert: { color: "success" },
      });
      setRejectTarget(null);
      setRejectReason("");
      await refresh();
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal",
        message: err?.message || "Gagal menolak koreksi",
        alert: { color: "error" },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Breadcrumbs
        custom
        heading="Antrian Koreksi Faktur"
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Faktur Pembelian", to: "/faktur-pembelian" },
          { title: "Antrian Koreksi" },
        ]}
      />

      <MainCard title={<BtnBack href="/faktur-pembelian" />} content>
        <Stack direction="row" spacing={1} mb={2}>
          {["MENUNGGU_VERIFIKASI", "DISETUJUI", "DITOLAK"].map((value) => (
            <Button
              key={value}
              size="small"
              variant={status === value ? "contained" : "outlined"}
              onClick={() => setStatus(value)}
            >
              {STATUS_LABEL[value]}
            </Button>
          ))}
        </Stack>

        {!canApprove && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Anda dapat melihat antrian, tetapi hanya role dengan hak approval
            (Accounting/Finance) yang dapat menyetujui atau menolak.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat antrian: {error?.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : rows.length === 0 ? (
          <Alert severity="success">Tidak ada pengajuan koreksi pada status ini.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Faktur</TableCell>
                  <TableCell>Tipe</TableCell>
                  <TableCell>Alasan</TableCell>
                  <TableCell>Pengaju</TableCell>
                  <TableCell>Diajukan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {row.faktur_kode || `#${row.faktur_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rp {money(row.faktur_grandtotal)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {TIPE_LABEL[row.tipe_koreksi] || row.tipe_koreksi}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={row.alasan}>
                        {row.alasan}
                      </Typography>
                      {row.alasan_penolakan && (
                        <Typography variant="caption" color="error">
                          Ditolak: {row.alasan_penolakan}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.requested_by_nama || `#${row.requested_by}`}</TableCell>
                    <TableCell>{dateId(row.requested_at)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABEL[row.status] || row.status}
                        color={STATUS_COLOR[row.status] || "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {row.status === "MENUNGGU_VERIFIKASI" && (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={!canApprove || busy}
                            onClick={() => setApproveTarget(row)}
                          >
                            Setujui
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={!canApprove || busy}
                            onClick={() => {
                              setRejectTarget(row);
                              setRejectReason("");
                            }}
                          >
                            Tolak
                          </Button>
                        </Stack>
                      )}
                      {row.approved_by_nama && row.status !== "MENUNGGU_VERIFIKASI" && (
                        <Typography variant="caption" color="text.secondary">
                          oleh {row.approved_by_nama}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>

      <Dialog open={Boolean(approveTarget)} onClose={() => setApproveTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Setujui Koreksi?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Faktur <strong>{approveTarget?.faktur_kode}</strong> akan diterapkan
            perubahannya dan audit trail dicatat.
          </Typography>
          {approveTarget?.tipe_koreksi === "FULL" && (
            <Alert severity="warning">
              Perubahan nominal akan memicu reversal + repost jurnal di AkunApp.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveTarget(null)} disabled={busy}>
            Batal
          </Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={busy}>
            {busy ? <CircularProgress size={16} /> : "Setujui"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Tolak Koreksi</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            minRows={3}
            required
            label="Alasan penolakan"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)} disabled={busy}>
            Batal
          </Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={busy}>
            {busy ? <CircularProgress size={16} /> : "Tolak"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
