"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  submitVerification,
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
  DocumentActions,
  DocumentHeader,
  DownstreamLinks,
  PurchaseOrderItemCard,
  RollbackDialog,
} from "./components";
import { calculateHeaderTotals } from "./utils";

/** Purchase order detail page coordinating the 3-status lifecycle workflow. */
export default function PurchaseOrderDetail() {
  const params = useParams();
  const { permissions: access } = usePurchaseOrderAccess();
  const { row, rowLoading, rowError, mutate } = useShowPurchaseOrder(
    params.id,
    access.can_read,
  );
  const { permissions } = usePurchaseOrderPermissions(row);
  const rollbackPreview = usePurchaseOrderRollbackPreview(
    params.id,
    Boolean(row && permissions.can_rollback),
  );
  const reconciliation = usePurchaseOrderReconciliation(
    params.id,
    Boolean(row && row.status === "close"),
  );
  const audit = usePurchaseOrderAuditTrail(params.id, Boolean(row));

  const [mode, setMode] = useState("view");
  const [drafts, setDrafts] = useState({});
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const items = useMemo(
    () => (row?.items || []).filter((item) => item.aktif !== "N"),
    [row],
  );
  const headerTotals = useMemo(() => calculateHeaderTotals(items), [items]);

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

  const runAction = async (callback, successMessage, action = "Proses") => {
    setLoading(true);
    try {
      await callback();
      await mutate();
      notify("success", successMessage);
      setMode("view");
      setDialog(null);
      setReason("");
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

  const handleSubmitVerification = () => {
    runAction(
      () => submitVerification(params.id),
      "PO diajukan untuk verifikasi",
      "Submit",
    );
  };

  // verify = final check + close + downstream
  const handleVerify = () => {
    runAction(
      () => verifyPurchaseOrder(params.id, { rekening_id: row?.rekening_id }),
      "PO berhasil diverifikasi dan difinalisasi",
      "Verifikasi",
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
    rollbackPreview.mutate();
    setDialog("rollback");
  };

  const handleRollback = (rollbackReason) => {
    runAction(
      () => rollbackPurchaseOrder(params.id, rollbackReason),
      "Rollback berhasil",
      "Rollback",
    );
  };

  const handleCancel = () => {
    runAction(
      () => cancelPurchaseOrder(params.id, reason),
      "PO dibatalkan",
      "Cancel",
    );
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

  if (rowLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (rowError || !row) {
    return (
      <Alert severity="error">
        Gagal memuat Purchase Order. {rowError?.message}
      </Alert>
    );
  }

  const attachments = row.files || [];

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
            <DocumentHeader row={row} />
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
              canUpload={permissions.can_upload_attachment}
              canDelete={permissions.can_attachment && row.status === "open"}
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
            <DocumentActions
              permissions={permissions}
              loading={loading}
              onPrepare={mode === "prepare" ? handleSavePreparation : () => setMode("prepare")}
              onSubmitVerification={handleSubmitVerification}
              onVerify={handleVerify}
              onReturn={() => setDialog("return")}
              onShowRollback={handleShowRollback}
              onCancel={() => setDialog("cancel")}
              onPrint={handlePrint}
            />
          </Stack>
        </Box>
      </MainCard>

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
        description="PO akan dinonaktifkan (soft cancel). Tidak dapat dibatalkan jika sudah close."
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
        loading={rollbackPreview.validating}
        preview={rollbackPreview.data}
        onRollback={handleRollback}
        onClose={() => setDialog(null)}
      />
    </>
  );
}