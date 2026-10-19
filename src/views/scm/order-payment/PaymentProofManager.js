'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Gallery, Trash } from 'iconsax-react';
import { uploadOrderPaymentAttachments, replaceOrderPaymentAttachment, deleteOrderPaymentAttachment } from 'api/order-payments';
import { openNotification } from 'api/notification';
import { PROOF_ACCEPT, validateProofFiles, paymentProofStorageKey, legacyPaymentProofs, legacyProofToFile } from './payment-proofs';

export default function PaymentProofManager({ paymentId, attachments = [], permissions, busy = false, mutationLock, onBusyChange, onChanged }) {
  const ownLock = useRef(false);
  const lock = mutationLock || ownLock;
  const [action, setAction] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftWarning, setDraftWarning] = useState('');
  const disabled = busy || !!action;

  useEffect(() => {
    setDrafts([]);
    setDraftWarning('');
    try {
      setDrafts(legacyPaymentProofs(JSON.parse(window.localStorage.getItem(paymentProofStorageKey(paymentId)) || 'null')));
    } catch (_) {
      setDraftWarning('Draft lokal tidak dapat dibaca. Data browser tetap dipertahankan.');
    }
  }, [paymentId]);

  useEffect(() => {
    if (!permissions.can_upload_attachment) return undefined;
    const preventDrop = (event) => event.preventDefault();
    window.addEventListener('dragover', preventDrop);
    window.addEventListener('drop', preventDrop);
    return () => {
      window.removeEventListener('dragover', preventDrop);
      window.removeEventListener('drop', preventDrop);
    };
  }, [permissions.can_upload_attachment]);

  const notify = (title, message, color) => openNotification({ open: true, title, message, alert: { color } });
  const updateProgress = (event) => { if (event.total) setProgress(Math.round((event.loaded / event.total) * 100)); };

  const sync = async (change) => {
    try { await onChanged(change); } catch (_) {
      notify('Bukti sudah tersimpan', 'Muat ulang halaman untuk menampilkan data lampiran terbaru.', 'warning');
    }
  };

  const perform = async (label, work) => {
    if (lock.current || busy) return;
    lock.current = true;
    setAction(label);
    setProgress(0);
    onBusyChange(true);
    try {
      await work();
      notify('Berhasil', `${label} berhasil`, 'success');
    } catch (error) {
      notify('Gagal', error?.message || 'Gagal memproses bukti pembayaran', 'error');
    } finally {
      lock.current = false;
      setAction('');
      onBusyChange(false);
    }
  };

  const upload = (files, fromDraft = false) => {
    if (!permissions.can_upload_attachment || disabled || lock.current) return;
    const list = Array.from(files || []);
    if (!list.length) return;
    const error = validateProofFiles(list);
    if (error) return notify('Validasi', error, 'warning');
    return perform('Upload bukti pembayaran', async () => {
      const saved = await uploadOrderPaymentAttachments(paymentId, list, updateProgress);
      if (fromDraft) {
        setDrafts([]);
        try { window.localStorage.removeItem(paymentProofStorageKey(paymentId)); } catch (_) {
          setDraftWarning('Bukti sudah tersimpan di server, tetapi draft browser tidak dapat dibersihkan.');
        }
      }
      await sync({ files: saved });
    });
  };

  const uploadDrafts = () => {
    try { return upload(drafts.map(legacyProofToFile), true); } catch (error) { notify('Draft tidak valid', error.message, 'warning'); }
  };

  const replace = (attachment, files) => {
    if (!permissions.can_replace_attachment || disabled || lock.current) return;
    const file = files?.[0];
    if (!file) return;
    const error = validateProofFiles([file]);
    if (error) return notify('Validasi', error, 'warning');
    return perform('Penggantian bukti pembayaran', async () => {
      const saved = await replaceOrderPaymentAttachment(paymentId, attachment.id, file, updateProgress);
      await sync({ removedId: attachment.id, files: [saved] });
    });
  };

  const remove = (attachment) => {
    if (!permissions.can_remove_attachment || disabled || lock.current) return;
    if (!window.confirm('Hapus bukti pembayaran ini dari dokumen?')) return;
    return perform('Hapus bukti pembayaran', async () => {
      await deleteOrderPaymentAttachment(paymentId, attachment.id);
      await sync({ removedId: attachment.id });
    });
  };

  return (
    <>
      <Grid item xs={12} sm={6} md={4}>
        <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1}>Bukti pembayaran dari sistem</Typography>
        {attachments.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {attachments.map((attachment) => {
              const image = /^(image\/|jpg$|jpeg$|png$|gif$|webp$|heic$|heif$)/i.test(attachment.datatype || '') || /\.(jpe?g|png|gif|webp|heic|heif)(\?|$)/i.test(attachment.url || '');
              const name = attachment.name || `Bukti #${attachment.id}`;
              return (
                <Box key={attachment.id || attachment.url} sx={{ width: 116 }}>
                  <Tooltip title={name}>
                    <Box component="a" href={attachment.url} target="_blank" rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 80, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                      {image ? <Box component="img" src={attachment.url} alt={name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Gallery size={26} />}
                    </Box>
                  </Tooltip>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    {permissions.can_replace_attachment && attachment.id ? (
                      <Button size="small" component="label" disabled={disabled}>
                        Ganti
                        <input hidden type="file" accept={PROOF_ACCEPT} disabled={disabled} aria-label={`Ganti ${name}`}
                          onChange={(event) => { replace(attachment, event.target.files); event.target.value = ''; }} />
                      </Button>
                    ) : <IconButton component="a" href={attachment.url} target="_blank" rel="noopener noreferrer" size="small" aria-label={`Buka ${name}`}><OpenInNewOutlinedIcon fontSize="small" /></IconButton>}
                    {permissions.can_remove_attachment && attachment.id ? (
                      <IconButton size="small" color="error" disabled={disabled} aria-label={`Hapus ${name}`} onClick={() => remove(attachment)}><Trash size={16} /></IconButton>
                    ) : null}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : <Typography variant="caption" color="text.secondary">Belum ada bukti dari sistem</Typography>}
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1}>Upload bukti pembayaran</Typography>
        {permissions.can_upload_attachment ? (
          <Box component="label"
            onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files); }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 80, px: 1.5, border: '1px dashed', borderColor: dragging ? 'primary.main' : 'divider', borderRadius: 2, bgcolor: dragging ? 'primary.lighter' : 'background.default', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
            <CloudUploadOutlinedIcon color="primary" />
            <Typography variant="caption">Tarik gambar atau klik untuk upload · maks. 5 MB/file</Typography>
            <input hidden type="file" multiple accept={PROOF_ACCEPT} disabled={disabled} aria-label="Upload bukti pembayaran"
              onChange={(event) => { upload(event.target.files); event.target.value = ''; }} />
          </Box>
        ) : <Typography variant="caption" color="text.secondary">Anda tidak memiliki izin upload bukti.</Typography>}
        {action ? <Stack spacing={1} sx={{ mt: 1 }} aria-live="polite"><Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={14} /><Typography variant="caption">{action}…</Typography></Stack><LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress} /></Stack> : null}
        {draftWarning ? <Alert severity="warning" sx={{ mt: 1 }}>{draftWarning}</Alert> : null}
        {drafts.length ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            {drafts.length} bukti lokal lama belum tersimpan ke server.
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {drafts.map((proof, index) => <Box key={index} component="img" src={proof.dataUrl} alt={proof.name || 'Draft bukti'} sx={{ width: 48, height: 40, objectFit: 'cover', borderRadius: 1 }} />)}
            </Stack>
            {permissions.can_upload_attachment ? <Button size="small" disabled={disabled} onClick={uploadDrafts}>Unggah draft ke server</Button> : null}
          </Alert>
        ) : null}
      </Grid>
    </>
  );
}
