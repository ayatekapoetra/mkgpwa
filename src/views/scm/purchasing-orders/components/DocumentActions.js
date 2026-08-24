"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import {
  ArrowCircleLeft,
  DocumentText,
  Refresh,
  TickCircle,
  Trash,
} from "iconsax-react";

const ACTION_HELPS = [
  {
    key: "can_prepare",
    label: "Simpan Persiapan",
    color: "text.primary",
    text: "Simpan perubahan item/header saat status open (rekening, prioritas, qty, harga, dsb).",
  },
  {
    key: "can_submit",
    label: "Ajukan Verifikasi",
    color: "text.primary",
    text: "Ubah status open → verify. Mengisi verifiedby & verified_at, sts_code = 2.",
  },
  {
    key: "can_verify",
    label: "Verifikasi & Finalisasi",
    color: "success.main",
    text: "Finalisasi PO (verify → close). Menutup dokumen dan memicu proses hilir (faktur/downstream).",
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

/** Action bar driven by document permissions for the 3-status PO lifecycle. */
export default function DocumentActions({
  permissions,
  loading,
  onPrepare,
  onSubmitVerification,
  onVerify,
  onReturn,
  onShowRollback,
  onCancel,
  onPrint,
}) {
  const helps = ACTION_HELPS.filter((item) => permissions?.[item.key]);

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
      {permissions.can_submit && (
        <Button
          variant="outlined"
          onClick={onSubmitVerification}
          disabled={loading}
        >
          Ajukan Verifikasi
        </Button>
      )}
      {permissions.can_verify && (
        <Button
          variant="contained"
          color="success"
          startIcon={<TickCircle />}
          onClick={onVerify}
          disabled={loading}
        >
          Verifikasi & Finalisasi
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
