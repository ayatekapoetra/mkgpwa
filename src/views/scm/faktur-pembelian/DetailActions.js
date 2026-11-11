"use client";

import { useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { decideVoidRequest, useVoidRequests, requestVoidFakturPembelian, rollbackFakturPembelian, sendFakturToPayment, updateFakturPembelian } from "api/faktur-pembelian";

const isOn = (value) => value === true || value === 1 || ["Y", "1", "TRUE"].includes(String(value).toUpperCase());
const administrative = "Approval administratif saja. Tidak membatalkan faktur atau membalik jurnal.";

export default function DetailActions({ id, header, permissions = {}, refresh }) {
  const [dialog, setDialog] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [narasi, setNarasi] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [inactive, setInactive] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const voidRequests = useVoidRequests(id);
  const { current, history, loading, validating, error } = voidRequests;
  const pending = current?.status === "PENDING" ? current : null;
  const latest = current || history[0];
  const refreshAll = async () => {
    const [, result] = await Promise.all([refresh(), voidRequests.refresh()]);
    if (!result || !Array.isArray(result.history)) throw new Error("Riwayat belum terkonfirmasi");
  };
  const reload = async () => {
    try {
      await refreshAll();
      setNeedsRefresh(false);
    } catch {
      setNeedsRefresh(true);
      setMessage({ severity: "error", text: "Gagal memuat ulang detail atau riwayat. Periksa koneksi sebelum melanjutkan." });
    }
  };
  const lock = useRef(false);
  const disabled = busy || inactive || needsRefresh;
  const voidDisabled = disabled || loading || validating || Boolean(error);
  const canSend = isOn(permissions.can_send_payment) && !planned;
  const canRollback = isOn(permissions.can_rollback);
  const canVoid = isOn(permissions.can_request_void) && !pending;
  const canDecide = isOn(permissions.can_approve_void) && Boolean(pending);
  const decision = dialog === "approve" ? "APPROVED" : "REJECTED";

  const openDialog = (action) => {
    setReason("");
    setDueDate(String(header.next_due_date || header.due_date || "").slice(0, 10));
    setNarasi(header.narasi || "");
    setRequestId(pending?.id ?? null);
    setMessage(null);
    setDialog(action);
  };

  const submit = async (action) => {
    if (lock.current || inactive || needsRefresh) return;
    if (action === "edit" && (!isOn(permissions.can_update) || !dueDate)) return;
    if (action === "payment" && !canSend) return;
    if (action === "rollback" && (!canRollback || !reason.trim())) return;
    if (action === "void" && (!canVoid || voidDisabled || !reason.trim())) return;
    if (["approve", "reject"].includes(action) && (!canDecide || voidDisabled || !reason.trim() || requestId !== pending?.id)) return;
    lock.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if (action === "edit") {
        await updateFakturPembelian(id, { next_due_date: dueDate, narasi });
        setMessage({ severity: "success", text: "Jatuh tempo dan narasi disimpan." });
      } else if (action === "payment") {
        const result = await sendFakturToPayment(id);
        if (result?.failed?.length || result?.created?.length !== 1) throw new Error(result?.failed?.map((item) => item.message).join("; ") || "Rencana pembayaran belum terkonfirmasi. Muat ulang detail sebelum mencoba lagi.");
        setPlanned(true);
        setMessage({ severity: "success", text: "Satu rencana pembayaran draft dibuat." });
      } else if (action === "rollback") {
        await rollbackFakturPembelian(id, reason.trim());
        setInactive(true);
        setMessage({ severity: "success", text: "Faktur dinonaktifkan. Dokumen sumber PO/PD tetap close, tidak dibuka kembali." });
      } else if (action === "void") {
        await requestVoidFakturPembelian(id, reason.trim());
        setMessage({ severity: "success", text: `Request Void dikirim. ${administrative}` });
      } else if (["approve", "reject"].includes(action)) {
        await decideVoidRequest(id, requestId, { decision: action === "approve" ? "APPROVED" : "REJECTED", reason: reason.trim() });
        setMessage({ severity: "success", text: `Keputusan tersimpan. ${administrative}` });
      }
      setDialog("");
      if (action !== "rollback") {
        try { await refreshAll(); } catch { setNeedsRefresh(true); setMessage({ severity: "warning", text: "Aksi berhasil, tetapi detail atau riwayat gagal dimuat ulang. Muat ulang sebelum tindakan berikutnya." }); }
      }
    } catch (error) {
      setNeedsRefresh(true);
      setDialog("");
      setMessage({ severity: "error", text: `${error.message} Muat ulang detail untuk memastikan status sebelum mencoba kembali.` });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "divider", mt: 2 }}>
      <Stack spacing={1.5} sx={{ p: 2 }}>
        <Typography variant="subtitle2">Approval Request Void</Typography>
        <Typography variant="caption">{administrative}</Typography>
        {loading && <Typography role="status">Memuat riwayat Request Void…</Typography>}
        {error && <Alert severity="warning">{error.code === "VOID_SCHEMA_MISSING" ? "fitur belum tersedia" : error.message || "Gagal memuat riwayat Request Void. Muat ulang untuk mencoba lagi."}</Alert>}
        {!loading && !error && <>
          <Typography role="status">Status approval Request Void: {latest?.status || "Belum ada permintaan"}</Typography>
          {history.length > 0 && <Box component="ul" aria-label="Riwayat Request Void" sx={{ m: 0, pl: 3, maxHeight: 240, overflow: "auto" }}>
            {history.map((item) => <Box component="li" key={item.id} sx={{ mb: 1 }}>
              <Typography variant="body2">{item.status} — {item.requested_by_nama || item.requested_by} — {item.requested_at}</Typography>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>Alasan: {item.reason}</Typography>
              {item.decided_at && <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>Keputusan: {item.decided_by_nama || item.decided_by} — {item.decided_at} — {item.decision_reason}</Typography>}
            </Box>)}
          </Box>}
        </>}
      </Stack>
      <Box sx={{ position: "sticky", bottom: 0, zIndex: 10, bgcolor: "background.paper", p: 2 }}>
        <Stack spacing={1.5}>
          {message && <Alert severity={message.severity}>{message.text}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
            <Button variant="contained" disabled={disabled || !canSend} onClick={() => submit("payment")}>Kirim Ke Pembayaran</Button>
            {isOn(permissions.can_update) && <Button variant="outlined" disabled={disabled} onClick={() => openDialog("edit")}>Edit Jatuh Tempo / Narasi</Button>}
            {canRollback && <Button color="error" variant="outlined" disabled={disabled} onClick={() => openDialog("rollback")}>Rollback</Button>}
            {canVoid && <Button color="warning" variant="outlined" disabled={voidDisabled} onClick={() => openDialog("void")}>Request Void</Button>}
            {canDecide && <>
              <Button color="success" variant="contained" disabled={voidDisabled} onClick={() => openDialog("approve")}>Setujui</Button>
              <Button color="error" variant="outlined" disabled={voidDisabled} onClick={() => openDialog("reject")}>Tolak</Button>
            </>}
            <Button disabled={busy || validating} onClick={reload}>Muat ulang detail</Button>
          </Stack>
          {!canSend && <Typography variant="caption">Kirim pembayaran tidak tersedia berdasarkan izin/status server atau aksi yang baru dilakukan.</Typography>}
        </Stack>
      </Box>
      <Dialog open={Boolean(dialog)} onClose={() => { if (!busy) setDialog(""); }} fullWidth maxWidth="sm" aria-labelledby="faktur-action-title">
        <Box component="form" onSubmit={(event) => { event.preventDefault(); return submit(dialog); }}>
          <DialogTitle id="faktur-action-title">{dialog === "edit" ? "Edit terbatas" : dialog === "rollback" ? "Konfirmasi Rollback" : ["approve", "reject"].includes(dialog) ? `${decision === "APPROVED" ? "Setujui" : "Tolak"} Request Void` : "Request Void"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {dialog === "edit" ? <>
                <TextField autoFocus required label="Jatuh Tempo" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} InputLabelProps={{ shrink: true }} disabled={busy} />
                <TextField label="Catatan / Narasi" multiline minRows={3} value={narasi} onChange={(event) => setNarasi(event.target.value)} disabled={busy} />
                <Typography variant="body2">Nilai, qty, harga, PPN, item, dan nominal termin tidak dapat diubah.</Typography>
              </> : <>
                <Alert severity="warning">{dialog === "rollback" ? "Faktur akan dinonaktifkan. PO/PD tetap close. Tindakan ini tidak membuka kembali dokumen sumber." : administrative}</Alert>
                <TextField autoFocus required label="Alasan" multiline minRows={3} value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy} />
              </>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setDialog("")}>Batal</Button>
            <Button type="submit" variant="contained" disabled={busy || (dialog === "edit" ? !dueDate : !reason.trim())}>{busy ? "Menyimpan…" : "Konfirmasi"}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
