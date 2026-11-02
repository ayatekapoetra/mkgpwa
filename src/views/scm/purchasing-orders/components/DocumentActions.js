"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import {
  ArrowCircleLeft,
  DocumentText,
  Refresh,
  TickCircle,
  Trash,
} from "iconsax-react";

import { canShowLegacyVerifyAction } from "../directSubmit";

const ACTION_HELPS = [
  {
    key: "can_prepare",
    label: "Simpan Persiapan",
    color: "text.primary",
    text: "Simpan perubahan item/header saat status open (rekening, prioritas, qty, harga, dsb).",
  },
  {
    key: "can_direct_submit",
    label: "Ajukan Verifikasi",
    color: "primary.main",
    text: "SCM-005: satu aksi atomik — validasi, finalisasi (status Diproses), dan pembentukan rencana pembayaran tunai/kredit/termin. Berlaku untuk dokumen open maupun verify. Konfirmasi diperlukan sebelum eksekusi.",
  },
  {
    key: "can_verify",
    label: "Verifikasi & Finalisasi (jalur lama)",
    color: "success.main",
    text: "Hanya untuk dokumen berstatus verify (legacy). Jalur kedua selain Ajukan Verifikasi. Menutup dokumen dan memicu proses hilir (faktur/downstream).",
  },
  {
    key: "can_return",
    label: "Kembalikan ke Open",
    color: "warning.main",
    text: "Hanya dari verify. Status kembali open, verifiedby/verified_at di-null, sts_code = 0. PO tetap aktif; PR tidak diubah.",
  },
  {
    key: "can_rollback",
    label: "Rollback",
    color: "error.main",
    text: "Dari verify: sama seperti kembalikan ke open. Dari open: soft-delete PO (aktif=N) dan PR induk dikembalikan ke approved. Alasan wajib.",
  },
  {
    key: "can_cancel",
    label: "Batalkan",
    color: "error.main",
    text: "Ubah status → reject, sts_code = 5. Alasan tercatat di audit. Tidak mengembalikan PR. Tidak bisa jika sudah close.",
  },
  {
    key: "can_print",
    label: "Cetak PDF",
    color: "text.primary",
    text: "Unduh/cetak dokumen PDF PO. Tidak mengubah data.",
  },
];

/** Action bar driven by document permissions for the PO lifecycle.
 * SCM-005 (PRD-SCM-005 v1.0): "Ajukan Verifikasi" is the direct atomic
 * action (open|verify → close + rencana pembayaran) behind a mandatory
 * confirmation dialog (Q-04 A), gated by update/insert + validate (Q-03 B)
 * via the `canDirectSubmit` prop computed in detail.js. The legacy
 * "Verifikasi & Finalisasi" button remains only for verify documents as the
 * second path (Q-06 B). */
export default function DocumentActions({
  permissions,
  canDirectSubmit = false,
  status = "",
  loading,
  onPrepare,
  onSubmitVerification,
  onVerify,
  onReturn,
  onShowRollback,
  onCancel,
  onPrint,
}) {
  const showLegacyVerify = canShowLegacyVerifyAction({
    status,
    canVerify: permissions?.can_verify,
  });
  const helpPermissions = {
    ...permissions,
    can_direct_submit: canDirectSubmit,
    can_verify: showLegacyVerify,
  };
  const helps = ACTION_HELPS.filter((item) => helpPermissions?.[item.key]);

  return (
    <Stack spacing={1.5}>
      {permissions.can_prepare && (
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onPrepare}
          disabled={loading}
        >
          Simpan Persiapan
        </Button>
      )}
      {canDirectSubmit && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<TickCircle />}
          onClick={onSubmitVerification}
          disabled={loading}
        >
          Ajukan Verifikasi
        </Button>
      )}
      {showLegacyVerify && (
        <Button
          variant="outlined"
          color="success"
          startIcon={<TickCircle />}
          onClick={onVerify}
          disabled={loading}
        >
          Verifikasi &amp; Finalisasi
        </Button>
      )}
      {permissions.can_return && (
        <Button variant="outlined" color="warning" onClick={onReturn} disabled={loading}>
          Kembalikan ke Open
        </Button>
      )}
      {permissions.can_rollback && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<ArrowCircleLeft />}
          onClick={onShowRollback}
          disabled={loading}
        >
          Rollback
        </Button>
      )}
      {permissions.can_cancel && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<Trash />}
          onClick={onCancel}
          disabled={loading}
        >
          Batalkan
        </Button>
      )}
      {permissions.can_print && (
        <Button
          variant="outlined"
          startIcon={<DocumentText />}
          onClick={onPrint}
          disabled={loading}
        >
          Cetak PDF
        </Button>
      )}

      {helps.length > 0 && (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Penjelasan aksi
          </Typography>
          <Stack spacing={1.25}>
            {helps.map((item) => (
              <Box key={item.key}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={item.color}
                  display="block"
                >
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
