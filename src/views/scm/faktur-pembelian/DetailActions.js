"use client";

import { useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { requestVoidFakturPembelian, rollbackFakturPembelian, sendFakturToPayment, updateFakturPembelian } from "api/faktur-pembelian";

const isOn = (value) => value === true || value === 1 || ["Y", "1", "TRUE"].includes(String(value).toUpperCase());

export default function DetailActions({ id, header, permissions = {}, refresh }) {
  const [dialog, setDialog] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [narasi, setNarasi] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [inactive, setInactive] = useState(false);
  const [voidStatus, setVoidStatus] = useState("");
  const [planned, setPlanned] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const reload = async () => {
    try {
      await refresh();
      setNeedsRefresh(false);
    } catch {
      setMessage({ severity: "error", text: "Gagal memuat ulang detail. Periksa koneksi sebelum melanjutkan." });
    }
  };
  const lock = useRef(false);
  const hasPayment = isOn(header.has_payment);
  const disabled = busy || inactive || needsRefresh;
  const canSend = isOn(permissions.can_send_payment) && !isOn(header.planned) && !planned && Number(header.sisa) > 0;
  const canRollback = !hasPayment && isOn(permissions.can_rollback);
  const canVoid = hasPayment && isOn(permissions.can_request_void) && !voidStatus;

  const openDialog = (action) => {
    setReason("");
    setDueDate(String(header.next_due_date || header.due_date || "").slice(0, 10));
    setNarasi(header.narasi || "");
    setMessage(null);
    setDialog(action);
  };

  const submit = async (action) => {
    if (lock.current || inactive || needsRefresh) return;
    if (action === "edit" && (!isOn(permissions.can_update) || !dueDate)) return;
    if (action === "payment" && !canSend) return;
    if (action === "rollback" && (!canRollback || !reason.trim())) return;
    if (action === "void" && (!canVoid || !reason.trim())) return;
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
        const result = await requestVoidFakturPembelian(id, reason.trim());
        setVoidStatus(result?.status || "PENDING");
        setMessage({ severity: "success", text: `Request Void: ${result?.status || "PENDING"} (menunggu persetujuan). Tidak ada perubahan faktur, sumber, atau jurnal.` });
      }
      setDialog("");
      if (action !== "rollback") {
        try { await refresh(); } catch { setNeedsRefresh(true); setMessage({ severity: "warning", text: "Aksi berhasil, tetapi detail gagal dimuat ulang. Muat ulang sebelum tindakan berikutnya." }); }
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
    <Box sx={{ position: "sticky", bottom: 0, zIndex: 10, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", p: 2, mt: 2 }}>
      <Stack spacing={1.5}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        {voidStatus && <Typography role="status">Status approval Request Void: {voidStatus}</Typography>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
          <Button variant="contained" disabled={disabled || !canSend} onClick={() => submit("payment")}>Kirim Ke Pembayaran</Button>
          {isOn(permissions.can_update) && <Button variant="outlined" disabled={disabled} onClick={() => openDialog("edit")}>Edit Jatuh Tempo / Narasi</Button>}
          {canRollback && <Button color="error" variant="outlined" disabled={disabled} onClick={() => openDialog("rollback")}>Rollback</Button>}
          {canVoid && <Button color="warning" variant="outlined" disabled={disabled} onClick={() => openDialog("void")}>Request Void</Button>}
          <Button disabled={busy} onClick={reload}>Muat ulang detail</Button>
        </Stack>
        {(isOn(header.planned) || planned || Number(header.sisa) <= 0) && <Typography variant="caption">Pembayaran tidak tersedia: faktur sudah direncanakan atau tidak memiliki sisa tagihan.</Typography>}
      </Stack>
      <Dialog open={Boolean(dialog)} onClose={() => { if (!busy) setDialog(""); }} fullWidth maxWidth="sm" aria-labelledby="faktur-action-title">
        <Box component="form" onSubmit={(event) => { event.preventDefault(); return submit(dialog); }}>
          <DialogTitle id="faktur-action-title">{dialog === "edit" ? "Edit terbatas" : dialog === "rollback" ? "Konfirmasi Rollback" : "Request Void"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {message?.severity === "error" && <Alert severity="error">{message.text}</Alert>}
              {dialog === "edit" ? <>
                <TextField autoFocus required label="Jatuh Tempo" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} InputLabelProps={{ shrink: true }} disabled={busy} />
                <TextField label="Catatan / Narasi" multiline minRows={3} value={narasi} onChange={(event) => setNarasi(event.target.value)} disabled={busy} />
                <Typography variant="body2">Nilai, qty, harga, PPN, item, dan nominal termin tidak dapat diubah.</Typography>
              </> : <>
                <Alert severity="warning">{dialog === "rollback" ? "Faktur akan dinonaktifkan. PO/PD tetap close. Tindakan ini tidak membuka kembali dokumen sumber." : "Hanya mengajukan approval pembatalan. Tidak membatalkan faktur atau membalik jurnal."}</Alert>
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
