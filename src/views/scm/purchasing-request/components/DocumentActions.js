"use client";

import Link from "next/link";
import { Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { DocumentDownload, Edit, Refresh, TickCircle } from "iconsax-react";

/** Renders document actions allowed by the resolved request permissions. */
export default function DocumentActions({
  row,
  permissions,
  mode,
  pendingValidationCount,
  pendingApprovalCount,
  selectedValidationCount,
  selectedApprovalCount,
  loading,
  onPrint,
  onToggleValidation,
  onValidate,
  onStartApproval,
  onApprove,
  onRollback,
}) {
  const rollbackTargets = {
    active: "Draft",
    approved: "Active",
  };
  const rollbackTarget = rollbackTargets[String(row.status || "").toLowerCase()];

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Typography variant="h5">Aksi Dokumen</Typography>
        <Divider />
        {permissions.can_update && (
          <Button
            component={Link}
            href={`/purchasing-request/${row.id}/edit`}
            variant="outlined"
            startIcon={<Edit />}
          >
            Edit PR
          </Button>
        )}
        {permissions.can_print && (
          <Button
            variant="outlined"
            startIcon={<DocumentDownload />}
            onClick={onPrint}
          >
            Print PDF
          </Button>
        )}
        {permissions.can_validate && pendingValidationCount > 0 && (
          <Button
            color="warning"
            variant="contained"
            startIcon={<Refresh />}
            onClick={onToggleValidation}
          >
            {mode === "validate"
              ? "Batal Validasi"
              : `Pilih Item Validasi (${pendingValidationCount})`}
          </Button>
        )}
        {mode === "validate" && (
          <Button
            variant="contained"
            onClick={onValidate}
            disabled={!selectedValidationCount || loading}
          >
            Validasi {selectedValidationCount} Item
          </Button>
        )}
        {permissions.can_approve && pendingApprovalCount > 0 && (
          <Button
            color="info"
            variant="contained"
            startIcon={<TickCircle />}
            onClick={onStartApproval}
          >
            Pilih Item Approval ({pendingApprovalCount})
          </Button>
        )}
        {mode === "approve" && (
          <Button
            color="success"
            variant="contained"
            disabled={!selectedApprovalCount || loading}
            onClick={onApprove}
          >
            Approve {selectedApprovalCount} Item & Buat PO
          </Button>
        )}
        {permissions.can_rollback && rollbackTarget && (
          <Button
            color="error"
            variant="outlined"
            onClick={onRollback}
          >
            Rollback ke {rollbackTarget}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
