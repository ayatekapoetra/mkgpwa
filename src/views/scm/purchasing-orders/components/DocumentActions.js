"use client";

import { Button, Stack } from "@mui/material";
import {
  ArrowCircleLeft,
  DocumentText,
  Refresh,
  TickCircle,
  Trash,
} from "iconsax-react";

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
    </Stack>
  );
}