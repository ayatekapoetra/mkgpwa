'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CardActions,
  Chip, CircularProgress, Divider, InputAdornment, LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem, Skeleton, Stack, TextField, Typography
} from '@mui/material';
import {
  ArrowDown2, ArrowLeft2, ArrowRight2, Box1, Buildings2, Code1, DocumentDownload,
  DocumentText, InfoCircle, MessageText, Mobile, Profile2User, Refresh, TickCircle, Trash, WalletMoney
} from 'iconsax-react';

import MainCard from 'components/MainCard';
import { DELIVERY_MODES, deliveryHasPoll, POLL_OPTIONS } from './polling';
import { getRelationName, getStatusMeta } from './utils';

const panelSx = { borderRadius: 3, overflow: 'hidden', minWidth: 0 };

function money(value, currency = 'IDR') {
  const [whole, fraction = ''] = String(value ?? '').split('.');
  if (!/^\d+$/.test(whole)) return '—';
  const amount = BigInt(whole).toLocaleString('id-ID');
  return `${currency === 'IDR' ? 'Rp' : currency} ${amount}${Number(fraction) ? `,${fraction.padEnd(2, '0')}` : ''}`;
}

function dateLabel(value) {
  if (!value) return 'Tanggal belum tersedia';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? 'Tanggal belum tersedia' : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function IconTile({ children, color = 'primary', small = false }) {
  return (
    <Box sx={(theme) => ({
      display: 'grid', placeItems: 'center', flexShrink: 0, width: small ? 34 : 42, height: small ? 34 : 42,
      borderRadius: small ? 1.5 : 2, color: theme.palette[color].main, bgcolor: alpha(theme.palette[color].main, 0.09)
    })}>{children}</Box>
  );
}

function SectionHeading({ icon, title, description, action }) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <IconTile>{icon}</IconTile>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>{description}</Typography>
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}

function Metric({ icon, label, value, caption, loading, color = 'primary' }) {
  return (
    <MainCard content={false} boxShadow={false} sx={{ ...panelSx, p: { xs: 2, md: 2.5 }, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
        <IconTile color={color} small>{icon}</IconTile>
      </Stack>
      {loading ? <Skeleton width="65%" height={42} /> : (
        <Typography variant="h3" fontWeight={700} sx={{ mt: 1.5, letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums', fontSize: { xs: 23, md: 27 }, overflowWrap: 'anywhere' }}>{value}</Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>{caption}</Typography>
    </MainCard>
  );
}

function ReadinessRow({ ready, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: ready ? 'success.main' : 'text.disabled', display: 'flex', flexShrink: 0 }}>
        {ready ? <TickCircle size={17} variant="Bold" /> : <Box sx={{ width: 15, height: 15, border: '1.5px solid', borderColor: 'divider', borderRadius: '50%' }} />}
      </Box>
      <Typography variant="body2" color={ready ? 'text.primary' : 'text.secondary'}>{children}</Typography>
    </Stack>
  );
}

const OrderCard = memo(function OrderCard({ row, index }) {
  const items = row.items.filter((item) => item.aktif !== 'N');
  const status = getStatusMeta(row.status);
  const currency = String(row.currency || 'IDR').toUpperCase();
  return (
    <Accordion
      disableGutters elevation={0} TransitionProps={{ unmountOnExit: true }}
      sx={(theme) => ({
        border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', overflow: 'hidden',
        '&::before': { display: 'none' }, '&.Mui-expanded': { m: 0, borderColor: alpha(theme.palette.primary.main, 0.4) },
        '& .MuiAccordionSummary-root': { px: { xs: 1.75, sm: 2.25 }, py: 0.75 },
        '& .MuiAccordionSummary-content': { minWidth: 0, mr: 1.5 }
      })}
    >
      <AccordionSummary expandIcon={<ArrowDown2 size={17} />} aria-controls={`po-${row.id}-details`} id={`po-${row.id}-summary`}>
        <Box sx={{ width: '100%', minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 }}>{String(index + 1).padStart(2, '0')}</Typography>
              <Typography variant="subtitle2" fontWeight={700} sx={{ overflowWrap: 'anywhere', lineHeight: 1.25 }}>{row.kdpo}</Typography>
            </Stack>
            <Chip size="small" label={status.label} color={status.color} variant="outlined" sx={{ height: 22, fontSize: 11, flexShrink: 0 }} />
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' }, gap: 0.75, columnGap: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: 'anywhere', lineHeight: 1.3 }}>{getRelationName(row.pemasok) || 'Pemasok belum tersedia'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.15, overflowWrap: 'anywhere', lineHeight: 1.3 }}>
                {[getRelationName(row.bisnis), getRelationName(row.cabang)].filter(Boolean).join(' · ') || 'Organisasi belum tersedia'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.25, overflowWrap: 'anywhere', lineHeight: 1.35 }}>
                {row.narasi || 'Tidak ada keterangan tambahan.'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{money(row.grandtotal, currency)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>{items.length} item · {dateLabel(row.request_date)}</Typography>
            </Box>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 2.5 }, pt: 0, pb: 2.5 }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip size="small" variant="outlined" label={`PR: ${row.kode_pr || '—'}`} />
          <Chip size="small" variant="outlined" label={`Prioritas: ${row.prioritas || '—'}`} />
          {row.top_type === 'CREDIT' && (
            <Chip size="small" variant="outlined" color="warning" label={`TOP: Kredit Net ${row.top_days || 30} Hari`} />
          )}
          {row.top_type === 'INSTALLMENT' && (
            <Chip size="small" variant="outlined" color="info" label={`TOP: Bertahap (DP ${row.dp_percent || 0}% + Pelunasan Net ${row.top_days || 14} Hari)`} />
          )}
          {(!row.top_type || row.top_type === 'CASH') && (
            <Chip size="small" variant="outlined" label="TOP: Tunai (CASH)" />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">KETERANGAN DOKUMEN</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, mb: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{row.narasi || 'Tidak ada keterangan tambahan.'}</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Rincian item</Typography>
        {!items.length && <Typography variant="body2" color="text.secondary">Tidak ada rincian item aktif.</Typography>}
        <Stack divider={<Divider />}>
          {items.map((item, itemIndex) => (
            <Stack key={item.id || itemIndex} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 1.25 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{item.barang?.nama || item.narasi || 'Non-part item'}</Typography>
                <Typography variant="caption" color="text.secondary">{item.barang?.kode || 'Tanpa kode barang'}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{item.qty} <Typography component="span" variant="caption" color="text.secondary">{item.stn || item.satuan || item.barang?.satuan || ''}</Typography></Typography>
            </Stack>
          ))}
        </Stack>
        <Button component={Link} href={`/purchasing-orders/${row.id}`} size="small" endIcon={<ArrowRight2 size={15} />} sx={{ mt: 2 }}>Lihat Detail PO</Button>
      </AccordionDetails>
    </Accordion>
  );
});

function PollIllustration({ count, ready }) {
  return (
    <Box sx={(theme) => ({ p: 2.5, borderRadius: 2.5, bgcolor: alpha(theme.palette.success.main, 0.045), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.12) })}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.75, color: 'success.main' }}>
        <MessageText size={19} variant="Bulk" />
        <Typography variant="caption" fontWeight={700}>ILUSTRASI POLLING WHATSAPP</Typography>
      </Stack>
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '2px 12px 12px 12px', p: 2 }}>
        <Typography variant="caption" color="text.secondary">Satu keputusan untuk {count} purchase order</Typography>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.75, mb: 1.75 }}>Bagaimana keputusan Anda untuk seluruh PO pada daftar berikut?</Typography>
        <Stack spacing={1}>
          {POLL_OPTIONS.map((option) => (
            <Stack key={option.id} direction="row" spacing={1.25} alignItems="center" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 1 }}>
              <Box sx={{ width: 15, height: 15, borderRadius: '50%', border: '1.5px solid', borderColor: 'text.disabled', flexShrink: 0 }} />
              <Typography variant="body2">{option.label}</Typography>
            </Stack>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>Pilih satu jawaban · Berlaku untuk seluruh PO</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, lineHeight: 1.7 }}>
        {ready ? 'Data siap dijadikan paket JSON untuk Hermes.' : 'Lengkapi penerima dan periksa dokumen sebelum menyiapkan JSON.'} Pesan WhatsApp belum dikirim.
      </Typography>
    </Box>
  );
}

export default function PollPreviewView({
  selection, details, canRead, accessLoading, accessError, phones, touched, senderError, recipientError,
  complete, summary, preview, currentArtifact, preparing, error, message, deliveryStatus, deliveryMode = 'pdf_poll', onEditPhone, onSavePhones, onPrepare, onReset
}) {
  const metrics = useMemo(() => ({
    items: details.rows.reduce((total, row) => total + row.items.filter((item) => item.aktif !== 'N').length, 0),
    suppliers: new Set(details.rows.map((row) => String(row.pemasok_id ?? row.pemasok?.id ?? getRelationName(row.pemasok) ?? '')).filter(Boolean)).size
  }), [details.rows]);
  const count = selection.data.items.length;
  const hasSelection = canRead && selection.ready && count > 0;
  const failed = Object.keys(details.errors).length;
  const senderReady = Boolean(phones.sender_phone && !senderError);
  const recipientReady = Boolean(phones.recipient_phone && !recipientError);
  const withPoll = deliveryHasPoll(deliveryMode);
  const modeLabel = DELIVERY_MODES.find((mode) => mode.id === deliveryMode)?.label;
  const [sendMenu, setSendMenu] = useState(null);

  return (
    <Stack spacing={3} sx={{ pb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip size="small" label={modeLabel} variant="outlined" />
          <Chip size="small" label={currentArtifact ? 'JSON telah disiapkan' : 'Mode persiapan JSON'} color="info" variant="outlined" />
        </Stack>
        <Button component={Link} href="/purchasing-orders" color="secondary" startIcon={<ArrowLeft2 size={16} />} disabled={preparing} size="small">Kembali ke List</Button>
      </Stack>

      {accessLoading || (canRead && !selection.ready) ? (
        <MainCard sx={panelSx}><Stack spacing={1.5} alignItems="center" sx={{ py: 5 }}><CircularProgress size={28} /><Typography color="text.secondary">Menyiapkan workspace polling…</Typography></Stack></MainCard>
      ) : accessError ? <Alert severity="error">Gagal memuat akses Purchase Order.</Alert>
        : !canRead ? <Alert severity="warning">Anda tidak memiliki akses untuk melihat Purchase Order.</Alert>
          : selection.error ? <Alert severity="error">{selection.error}</Alert>
            : !count ? (
              <MainCard sx={panelSx}>
                <Stack spacing={2} alignItems="center" sx={{ py: { xs: 4, md: 7 }, textAlign: 'center' }}>
                  <IconTile><DocumentText size={24} variant="Bulk" /></IconTile>
                  <Typography variant="h4" fontWeight={700}>Mulai dari PO pilihan Anda</Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 420 }}>Belum ada PO terpilih. Buka daftar Purchase Order dan gunakan checkbox untuk menyusun paket pengiriman.</Typography>
                  <Button component={Link} href="/purchasing-orders" variant="contained" endIcon={<ArrowRight2 size={17} />}>Pilih Purchase Order</Button>
                </Stack>
              </MainCard>
            ) : null}

      {hasSelection && <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 2 } }}>
          <Metric icon={<DocumentText size={19} />} label="PO terpilih" value={count} caption="Tersimpan di perangkat Anda" />
          <Metric icon={<Box1 size={19} />} label="Item aktif" value={metrics.items} caption={`${details.rows.length} dari ${count} PO termuat`} loading={details.loading} color="info" />
          <Metric icon={<Buildings2 size={19} />} label="Pemasok" value={metrics.suppliers} caption="Pemasok pada dokumen termuat" loading={details.loading} color="success" />
          <Metric icon={<WalletMoney size={19} />} label="Nilai pengadaan" value={summary ? money(summary.totals_by_currency[0].amount, summary.totals_by_currency[0].currency) : '—'}
            caption={summary?.totals_by_currency.length > 1 ? `${summary.totals_by_currency.length} mata uang · rincian di bawah` : 'Grand total dari dokumen terbaru'} loading={details.loading} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.65fr) minmax(340px, 1fr)' }, gap: 3, alignItems: 'start' }}>
          <Stack spacing={3} sx={{ minWidth: 0 }}>
            <MainCard id="poll-documents" content={false} sx={{ ...panelSx, scrollMarginTop: 96 }}>
              <Box sx={{ p: { xs: 2, md: 2.75 } }}>
                <SectionHeading icon={<DocumentText size={21} variant="Bulk" />} title="Dokumen terpilih" description="Periksa pemasok, nilai, dan rincian setiap PO."
                  action={<Button size="small" color="secondary" startIcon={<Refresh size={16} />} onClick={details.reload} disabled={details.loading || preparing} sx={{ flexShrink: 0 }}>Muat ulang</Button>} />
              </Box>
              <Divider />
              {details.loading && <><LinearProgress /><Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.75, pt: 2 }}><CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Memuat rincian PO terbaru…</Typography></Stack></>}
              <Stack spacing={1.5} sx={{ p: { xs: 2, md: 2.75 } }}>
                {selection.data.items.filter((item) => details.errors[item.id]).map((item) => (
                  <Alert key={item.id} severity="error" action={<Button color="inherit" size="small" onClick={() => selection.selectRows([item], false)} disabled={preparing}>Hapus Pilihan</Button>}>
                    <Typography variant="body2" fontWeight={700}>{item.kdpo}</Typography>
                    {details.errors[item.id]} Muat ulang atau hapus pilihan ini sebelum membuat JSON.
                  </Alert>
                ))}
                {details.rows.map((row, index) => <OrderCard key={row.id} row={row} index={index} />)}
                {details.loading && !details.rows.length && [1, 2, 3].map((index) => <Skeleton key={index} variant="rounded" height={118} sx={{ borderRadius: 2 }} />)}
                {summary && <Box sx={{ px: 2, py: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                    <Box><Typography variant="subtitle2">Total {summary.purchase_order_count} purchase order</Typography><Typography variant="caption" color="text.secondary">Nilai mengikuti grand total dari backend.</Typography></Box>
                    <Stack spacing={0.5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>{summary.totals_by_currency.map((total) => <Typography key={total.currency} variant="subtitle1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>{money(total.amount, total.currency)}</Typography>)}</Stack>
                  </Stack>
                </Box>}
              </Stack>
            </MainCard>

            <MainCard id="poll-json" content={false} sx={{ ...panelSx, scrollMarginTop: 96 }}>
              <Accordion disableGutters elevation={0} sx={{ '&::before': { display: 'none' } }} TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ArrowDown2 size={18} />} sx={{ px: { xs: 2, md: 2.75 }, py: 1 }}>
                   <SectionHeading icon={<Code1 size={21} />} title="Paket JSON Hermes" description={currentArtifact ? 'Paket sudah dikirim dan dapat dilacak melalui status Hermes.' : 'Pratinjau struktur data untuk integrasi.'} />
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, md: 2.75 }, pb: 2.75 }}>
                  {preview ? <Stack spacing={1.5}>
                    <Typography variant="caption" color="text.secondary">{currentArtifact ? `Request ID: ${currentArtifact.payload.request_id}` : 'Draft: request_id dan created_at ditambahkan saat Kirim Data.'}</Typography>
                    <TextField multiline fullWidth minRows={8} maxRows={22} value={JSON.stringify(currentArtifact?.payload || preview, null, 2)} InputProps={{ readOnly: true }}
                      inputProps={{ 'aria-label': 'JSON polling Hermes' }} sx={{ '& textarea': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.75 }, '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }} />
                  </Stack> : <Typography variant="body2" color="text.secondary">Lengkapi kedua nomor WhatsApp dan pastikan seluruh dokumen termuat untuk melihat draft JSON.</Typography>}
                </AccordionDetails>
              </Accordion>
            </MainCard>
          </Stack>

          <Stack spacing={2.5} sx={{ minWidth: 0, position: { lg: 'sticky' }, top: { lg: 96 } }}>
            <MainCard id="poll-recipients" sx={{ ...panelSx, scrollMarginTop: 96 }} contentSX={{ p: { xs: 2, md: 2.75 } }}>
              <Stack spacing={2.5}>
                  <SectionHeading icon={<Profile2User size={21} variant="Bulk" />} title="Atur penerima" description="Tentukan tujuan pesan dan laporan hasil polling." />
                <Box>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}><Typography variant="overline" color="text.secondary" fontWeight={700}>01 / TUJUAN PENGIRIMAN</Typography></Stack>
                  <TextField id="po-poll-recipient" name="recipient_phone" fullWidth required label="Nomor penerima pesan" placeholder="0812 3456 7890" value={phones.recipient_phone} disabled={!selection.ready || preparing}
                    onChange={(event) => onEditPhone('recipient_phone', event.target.value)} onBlur={onSavePhones}
                    error={touched && Boolean(recipientError)} helperText={touched && recipientError ? recipientError : 'Menerima PDF, polling, atau pesan teks sesuai pilihan pengiriman.'}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Mobile size={19} /></InputAdornment> }} inputProps={{ inputMode: 'tel', autoComplete: 'tel' }} />
                  {recipientReady && <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 1 }}><TickCircle size={14} />Format nomor valid</Typography>}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Divider sx={{ flex: 1 }} /><ArrowDown2 size={15} /><Typography variant="caption" color="text.secondary">Hasil diteruskan ke</Typography><Divider sx={{ flex: 1 }} /></Box>
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1.5 }}>02 / HASIL & REKOMENDASI</Typography>
                  <TextField id="po-poll-sender" name="sender_phone" fullWidth required={withPoll} label="Nomor penerima hasil polling" placeholder="0812 3456 7890" value={phones.sender_phone} disabled={!selection.ready || preparing || !withPoll}
                    onChange={(event) => onEditPhone('sender_phone', event.target.value)} onBlur={onSavePhones}
                    error={withPoll && touched && Boolean(senderError)} helperText={withPoll && touched && senderError ? senderError : withPoll ? 'Diisi untuk mode PDF dan Polling. Pilih mode pada dropdown Kirim Data.' : 'Tidak diperlukan untuk pengiriman tanpa polling.'}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Mobile size={19} /></InputAdornment> }} inputProps={{ inputMode: 'tel', autoComplete: 'tel' }} />
                  {withPoll && senderReady && <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 1 }}><TickCircle size={14} />Format nomor valid</Typography>}
                </Box>
                <Stack direction="row" spacing={1} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', color: 'text.secondary', pt: 0.2 }}><InfoCircle size={16} /></Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.7 }}>Gunakan 08…, 628…, atau format internasional +kode negara. Nomor dinormalisasi sebelum JSON dibuat.</Typography>
                </Stack>
              </Stack>
            </MainCard>

            {withPoll ? <PollIllustration count={count} ready={Boolean(preview)} /> : (
              <MainCard sx={panelSx}>
                <Stack spacing={1.5}>
                  <SectionHeading icon={deliveryMode === 'pdf' ? <DocumentDownload size={21} /> : <MessageText size={21} />} title={deliveryMode === 'pdf' ? 'Dokumen PDF' : 'Pratinjau pesan teks'} description={deliveryMode === 'pdf' ? `Satu PDF ringkasan gabungan untuk ${count} PO terpilih.` : 'Ringkasan seluruh PO untuk penerima pesan.'} />
                  {deliveryMode === 'text' && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 320, overflowY: 'auto', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>{preview?.delivery.text || 'Lengkapi nomor penerima untuk melihat pesan.'}</Typography>}
                   <Typography variant="caption" color="text.secondary">Mode ini tidak menyertakan polling. Status pengiriman tetap dapat dipantau dari request Hermes.</Typography>
                </Stack>
              </MainCard>
            )}

            <MainCard sx={panelSx} contentSX={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Kesiapan paket</Typography>
              <Stack spacing={1.25}>
                <ReadinessRow ready={complete}>{complete ? `${count} PO berhasil dimuat` : failed ? `${failed} PO perlu diperiksa` : 'Rincian dokumen siap'}</ReadinessRow>
                <ReadinessRow ready={recipientReady}>Nomor penerima pesan valid</ReadinessRow>
                {withPoll && <ReadinessRow ready={senderReady}>Nomor penerima hasil valid</ReadinessRow>}
              </Stack>
              <Divider sx={{ my: 2 }} />
               <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.8, display: 'block' }}>
                 {deliveryStatus ? `Status Hermes: ${deliveryStatus.status}.` : 'Kirim Data mengirim paket ke Hermes.'} Status PO tidak diubah.
               </Typography>
            </MainCard>
          </Stack>
        </Box>
      </>}

      {error && <Alert severity="error" sx={{ borderRadius: 2 }} role="alert">{error}</Alert>}
      {message && currentArtifact && <Alert severity={deliveryStatus?.status === 'failed' ? 'error' : 'success'} sx={{ borderRadius: 2 }} role="status">{deliveryStatus?.error || message}</Alert>}

      <Box sx={(theme) => ({
        position: 'sticky', bottom: { xs: 8, sm: 16 }, zIndex: 10, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
        borderRadius: 2.5, boxShadow: `0 -4px 24px ${alpha(theme.palette.common.black, 0.055)}`
      })}>
        <CardActions sx={{ px: { xs: 2, md: 2.75 }, py: 2, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, '& > :not(:first-of-type)': { ml: 0 } }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
            <IconTile color={preview ? 'success' : 'primary'} small>{preview ? <TickCircle size={19} /> : <DocumentDownload size={19} />}</IconTile>
            <Box sx={{ minWidth: 0 }}>
               <Typography variant="subtitle2" fontWeight={700}>{currentArtifact ? 'Request Hermes berhasil dibuat' : preview ? 'Paket siap dikirim' : 'Periksa paket pengiriman Anda'}</Typography>
               <Typography variant="caption" color="text.secondary">{hasSelection ? `${count} PO · ${withPoll ? '1 PDF ringkasan + polling' : deliveryMode === 'pdf' ? '1 PDF ringkasan' : 'Teks saja'}` : 'Pilih PO untuk memulai'} · Status pengiriman dipantau</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0 }}>
            <Button color="error" variant="outlined" startIcon={<Trash size={17} />} onClick={onReset} disabled={!selection.ready || preparing} sx={{ flex: { xs: 1, sm: 'initial' }, minWidth: 100 }}>Reset</Button>
            <Button id="po-send-data" variant="contained" startIcon={preparing ? <CircularProgress size={16} color="inherit" /> : <DocumentDownload size={18} />} endIcon={<ArrowDown2 size={16} />}
              aria-haspopup="menu" aria-controls={sendMenu ? 'po-send-menu' : undefined} aria-expanded={sendMenu ? 'true' : undefined}
              onClick={(event) => setSendMenu(event.currentTarget)} disabled={!complete || preparing} sx={{ flex: { xs: 1, sm: 'initial' }, minWidth: 145 }}>{preparing ? 'Menyiapkan JSON…' : 'Kirim Data'}</Button>
            <Menu id="po-send-menu" anchorEl={sendMenu} open={Boolean(sendMenu)} onClose={() => setSendMenu(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              MenuListProps={{ 'aria-labelledby': 'po-send-data' }} PaperProps={{ sx: { minWidth: 280, maxWidth: 'calc(100vw - 32px)', mb: 1 } }}>
              {DELIVERY_MODES.map((mode) => <MenuItem key={mode.id} selected={deliveryMode === mode.id} disabled={preparing} onClick={() => { setSendMenu(null); return onPrepare(mode.id); }} sx={{ py: 1.5, whiteSpace: 'normal' }}>
                <ListItemIcon>{mode.id === 'text' ? <MessageText size={20} /> : <DocumentDownload size={20} />}</ListItemIcon>
                <ListItemText primary={mode.label} secondary={mode.description} primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }} secondaryTypographyProps={{ variant: 'caption' }} />
              </MenuItem>)}
            </Menu>
          </Stack>
        </CardActions>
      </Box>
    </Stack>
  );
}
