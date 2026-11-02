"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  cancelPurchaseOrder,
  deleteAttachment,
  getPurchaseOrderError,
  printPurchaseOrder,
  returnPurchaseOrder,
  rollbackPurchaseOrder,
  savePreparation,
  submitVerificationDirect,
  uploadAttachments,
  usePurchaseOrderAccess,
  usePurchaseOrderAuditTrail,
  usePurchaseOrderPermissions,
  usePurchaseOrderReconciliation,
  usePurchaseOrderRollbackPreview,
  useShowPurchaseOrder,
  verifyPurchaseOrder,
} from "api/purchase-orders";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import {
  ActionDialog,
  AttachmentCard,
  AuditTimeline,
  DirectSubmitDialog,
  DocumentActions,
  DocumentHeader,
  DownstreamLinks,
  PurchaseOrderItemCard,
  RollbackDialog,
} from "./components";
import {
  buildDirectSubmitSummary,
  canDirectSubmitVerification,
} from "./directSubmit";
import { calculateHeaderTotals } from "./utils";

/** Purchase order detail page coordinating the 3-status lifecycle workflow. */
export default function PurchaseOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const [dialog, setDialog] = useState(null);
  const {
    permissions: access,
    loading: accessLoading,
    error: accessError,
  } = usePurchaseOrderAccess();
  const canRead = !accessLoading && !accessError && access.can_read;
  const { row, rowLoading, rowError, mutate } = useShowPurchaseOrder(
    params.id,
    canRead,
  );
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    mutate: refreshPermissions,
  } = usePurchaseOrderPermissions(params.id, canRead);
  const rollbackPreview = usePurchaseOrderRollbackPreview(
    params.id,
    Boolean(row && permissions.can_rollback && dialog === 'rollback'),
  );
  const reconciliation = usePurchaseOrderReconciliation(
    params.id,
    Boolean(row && row.status === "close"),
  );
  const audit = usePurchaseOrderAuditTrail(params.id, Boolean(row));

  const [mode, setMode] = useState("view");
  const [drafts, setDrafts] = useState({});
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const items = useMemo(
    () => (row?.items || []).filter((item) => item.aktif !== "N"),
    [row],
  );
  const headerTotals = useMemo(() => calculateHeaderTotals(items), [items]);

  // SCM-005 (Q-03 B + Q-06 B): direct "Ajukan Verifikasi" button gating.
  // canUpdate/canInsert from feature access, canValidate mirrors the
  // backend feature permission map (can_verify: permissions.validate).
  const canDirectSubmit = useMemo(
    () =>
      canDirectSubmitVerification({
        status: row?.status,
        canUpdate: access.can_update,
        canInsert: access.can_insert,
        canValidate: access.can_verify,
      }),
    [row?.status, access.can_update, access.can_insert, access.can_verify],
  );

  // SCM-005 (Q-04 A): pre-action summary for the confirmation dialog.
  const directSubmitSummary = useMemo(
    () => buildDirectSubmitSummary({ row, items }),
    [row, items],
  );

  const notify = (color, message, title) => {
    openNotification({
      open: true,
      title: title || (color === "error" ? "Proses gagal" : "Berhasil"),
      message,
      alert: { color },
    });
  };

  const getItemDraft = (item) =>
    drafts[item.id] || {
      ...item,
      qty: item.qty || 0,
      harga: item.harga || 0,
      potongan: item.potongan || 0,
      ppn: item.ppn || 0,
      narasi: item.narasi || "",
    };

  const updateDraft = (item, field, value) =>
    setDrafts((current) => ({
      ...current,
      [item.id]: { ...getItemDraft(item), [field]: value },
    }));

  const runAction = async (
    callback,
    successMessage,
    action = "Proses",
    redirectTo,
  ) => {
    setLoading(true);
    try {
      await callback();
      await Promise.all([mutate(), refreshPermissions()]);
      notify("success", successMessage);
      setMode("view");
      setDialog(null);
      setReason("");
      if (redirectTo) router.push(redirectTo);
    } catch (error) {
      const apiError = getPurchaseOrderError(error, `${action} gagal`);
      notify("error", apiError.message, `${action} gagal`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreparation = () => {
    const payload = {
      narasi: row?.narasi || "",
      prioritas: row?.prioritas || "",
      gudang_id: row?.gudang_id,
      rekening_id: row?.rekening_id,
      items: items.map((item) => {
        const draft = getItemDraft(item);
        return {
          id: item.id,
          qty: Number(draft.qty),
          harga: Number(draft.harga),
          potongan: Number(draft.potongan),
          ppn: Number(draft.ppn),
          narasi: draft.narasi,
          coa_id: draft.coa_id,
          metode: draft.metode,
        };
      }),
    };
    runAction(
      () => savePreparation(params.id, payload),
      "Persiapan tersimpan",
      "Persiapan",
    );
  };

  // SCM-005: "Ajukan Verifikasi" now runs the direct atomic action
  // (validate + close + faktur beli + rencana pembayaran) behind the
  // Q-04 A confirmation dialog instead of the legacy open→verify step.
  const handleSubmitVerification = () => {
    setDialog("direct-submit");
  };

  const handleDirectSubmit = () => {
    runAction(
      () =>
        submitVerificationDirect(params.id, {
          rekening_id: row?.rekening_id,
        }),
      "PO berhasil diajukan dan difinalisasi",
      "Ajukan Verifikasi",
      "/purchasing-orders",
    );
  };

  // verify = final check + close + downstream (legacy path, verify docs only)
  const handleVerify = () => {
    runAction(
      () => verifyPurchaseOrder(params.id, { rekening_id: row?.rekening_id }),
      "PO berhasil diverifikasi dan difinalisasi",
      "Verifikasi",
      "/purchasing-orders",
    );
  };

  // verify → open: set null verifiedby/verified_at
  const handleReturn = () => {
    runAction(
      () => returnPurchaseOrder(params.id, { reason }),
      "PO dikembalikan ke open",
      "Return",
    );
  };

  // rollback: open → PR (soft delete) or verify → open
  const handleShowRollback = () => {
    setDialog("rollback");
  };

  const handleRollback = (rollbackReason) => {
    runAction(
      () => rollbackPurchaseOrder(params.id, rollbackReason),
      "Rollback berhasil",
      "Rollback",
    );
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelPurchaseOrder(params.id, reason);
      notify("success", "PO dibatalkan");
      setDialog(null);
      setReason("");
      router.push("/purchasing-orders");
    } catch (error) {
      const apiError = getPurchaseOrderError(error, "Cancel gagal");
      notify("error", apiError.message, "Cancel gagal");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await printPurchaseOrder(params.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      notify("error", error?.message || "Cetak gagal");
    }
  };

  const handleUploadAttachments = async (files) => {
    setUploading(true);
    try {
      await uploadAttachments(params.id, files);
      await mutate();
      notify("success", "Lampiran berhasil diunggah");
    } catch (error) {
      const apiError = getPurchaseOrderError(error, "Upload gagal");
      notify("error", apiError.message, "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (fileId) => {
    try {
      await deleteAttachment(params.id, fileId);
      await mutate();
      notify("success", "Lampiran dihapus");
    } catch (error) {
      const apiError = getPurchaseOrderError(error, "Hapus gagal");
      notify("error", apiError.message, "Hapus gagal");
    }
  };

  if (accessLoading || (canRead && rowLoading)) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (accessError || rowError) {
    return (
      <Alert severity="error">
        Gagal memuat Purchase Order. {(accessError || rowError)?.message}
      </Alert>
    );
  }

  if (!access.can_read) {
    return (
      <Alert severity="warning">
        Anda tidak memiliki hak akses untuk melihat Purchase Order.
      </Alert>
    );
  }

  if (!row) {
    return <Alert severity="error">Purchase Order tidak ditemukan.</Alert>;
  }

  const attachments = row.files || [];
  const canManageAttachments = access.can_update && access.can_remove;

  return (
    <>
      <Breadcrumbs
        custom
        heading={row.kdpo || "Purchase Order"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchase Order", to: "/purchasing-orders" },
          { title: row.kdpo || "Detail" },
        ]}
      />
      <MainCard title={<BtnBack href="/purchasing-orders" />} content>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 290px" },
            gap: 3,
          }}
        >
          <Stack spacing={3}>
            <DocumentHeader
              row={row}
              canEdit={
                !permissionsLoading &&
                !permissionsError &&
                (row.status === "open" || row.status === "verify") &&
                (permissions.can_prepare || permissions.can_update || permissions.can_verify || access?.can_update || access?.can_insert)
              }
              onUpdated={mutate}
            />
            <Stack spacing={1.5}>
              <Typography variant="h5">Item ({items.length})</Typography>
              {mode === "prepare" && (
                <Typography variant="caption" color="text.secondary">
                  Mode persiapan — ubah nilai item lalu simpan. Backend akan
                  menghitung ulang seluruh nilai finansial.
                </Typography>
              )}
              {items.map((item, index) => (
                <PurchaseOrderItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  mode={mode}
                  value={mode === "prepare" ? getItemDraft(item) : undefined}
                  onChange={updateDraft}
                />
              ))}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Ringkasan Finansial (dihitung backend)
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {headerTotals.gross.toLocaleString("id-ID")}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Diskon</Typography>
                  <Typography variant="body2">
                    {headerTotals.discount.toLocaleString("id-ID")}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">PPN</Typography>
                  <Typography variant="body2">
                    {headerTotals.tax_amount.toLocaleString("id-ID")}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1">Grand Total</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    {headerTotals.grand_total.toLocaleString("id-ID")}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <AttachmentCard
              files={attachments}
              canUpload={canManageAttachments}
              canDelete={canManageAttachments}
              onUpload={handleUploadAttachments}
              onDelete={handleDeleteAttachment}
              uploading={uploading}
            />
            {row.status === "close" && (
              <DownstreamLinks row={row} reconciliation={reconciliation.data} />
            )}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Audit Trail
              </Typography>
              {audit.loading ? (
                <CircularProgress size={20} />
              ) : audit.error ? (
                <Alert severity="error">
                  Gagal memuat audit trail. {audit.error?.message || "Terjadi kesalahan pada server."}
                </Alert>
              ) : (
                <AuditTimeline rows={audit.rows} />
              )}
            </Box>
          </Stack>
          <Stack spacing={2} sx={{ height: "fit-content", position: { lg: "sticky" }, top: { lg: 88 } }}>
            <Typography variant="overline" color="text.secondary">
              Aksi
            </Typography>
            {mode === "view" && permissions.can_prepare && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Ubah ke mode persiapan untuk mengedit item.
                </Typography>
              </Box>
            )}
            {permissionsLoading ? (
              <CircularProgress size={22} />
            ) : permissionsError ? (
              <Alert severity="error">Gagal memuat izin aksi. {permissionsError.message}</Alert>
            ) : (
              <DocumentActions
                permissions={permissions}
                canDirectSubmit={canDirectSubmit}
                status={row.status}
                loading={loading}
                onPrepare={mode === "prepare" ? handleSavePreparation : () => setMode("prepare")}
                onSubmitVerification={handleSubmitVerification}
                onVerify={handleVerify}
                onReturn={() => setDialog("return")}
                onShowRollback={handleShowRollback}
                onCancel={() => setDialog("cancel")}
                onPrint={handlePrint}
              />
            )}
          </Stack>
        </Box>
      </MainCard>

      <DirectSubmitDialog
        open={dialog === "direct-submit"}
        loading={loading}
        summary={directSubmitSummary}
        onClose={() => setDialog(null)}
        onConfirm={handleDirectSubmit}
      />

      <ActionDialog
        open={dialog === "return"}
        title="Kembalikan PO ke Open"
        description="verifiedby dan verified_at akan di-null-kan, status kembali ke open (sts_code=0)."
        confirmLabel="Kembalikan"
        color="warning"
        loading={loading}
        reason={reason}
        onReasonChange={setReason}
        requireReason
        onClose={() => setDialog(null)}
        onConfirm={handleReturn}
      />
      <ActionDialog
        open={dialog === "cancel"}
        title="Batalkan PO"
        description="Status berkas diubah menjadi reject (sts_code=5). Tidak dapat dibatalkan jika sudah close."
        confirmLabel="Batalkan"
        color="error"
        loading={loading}
        reason={reason}
        onReasonChange={setReason}
        requireReason
        onClose={() => setDialog(null)}
        onConfirm={handleCancel}
      />

      <RollbackDialog
        open={dialog === "rollback"}
        loading={loading || rollbackPreview.validating || rollbackPreview.loading}
        preview={rollbackPreview.data}
        onRollback={handleRollback}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
