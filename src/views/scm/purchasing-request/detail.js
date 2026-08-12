"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";

import {
  approvePurchasingRequest,
  getPurchasingRequestError,
  printPurchasingRequest,
  rollbackPurchasingRequest,
  usePurchasingRequestAccess,
  usePurchasingRequestBarang,
  usePurchasingRequestPemasok,
  usePurchasingRequestPermissions,
  useShowPurchasingRequest,
  validatePurchasingRequest,
} from "api/purchasing-request";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import {
  ActionDialog,
  AttachmentsCard,
  DocumentActions,
  DocumentHeader,
  ProgressCard,
  RequestItemCard,
  SelectionToolbar,
} from "./components";
import { calculateItemTotals } from "./utils";

/** Displays a purchasing request and coordinates its permitted workflow actions. */
export default function PurchasingRequestDetail() {
  const params = useParams();
  const { permissions: access } = usePurchasingRequestAccess();
  const { row, rowLoading, rowError, mutate } = useShowPurchasingRequest(
    params.id,
    access.can_read,
  );
  const { permissions } = usePurchasingRequestPermissions(row);
  const { rows: suppliers = [] } = usePurchasingRequestPemasok(
    { page: 1, limit: 100 },
    Boolean(row),
  );
  const { rows: barangOptions = [] } = usePurchasingRequestBarang(
    {},
    Boolean(row),
  );
  const [mode, setMode] = useState("view");
  const [drafts, setDrafts] = useState({});
  const [selectedValidation, setSelectedValidation] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(
    () => (row?.items || []).filter((item) => item.aktif !== "N"),
    [row],
  );
  const pendingValidation = items.filter(
    (item) => !item.user_validated && !item.date_validated,
  );
  const pendingApproval = items.filter(
    (item) =>
      (item.user_validated || item.date_validated) &&
      !item.user_approved &&
      !item.date_approved,
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
      qty_acc: item.qty_acc || item.qty_req || 1,
      currency: item.currency || "IDR",
      kurs: item.kurs || 1,
      harga: item.harga || 0,
      potongan: item.potongan || 0,
      ppn: item.ppn || 0,
      metode: item.metode || "kredit",
    };

  const updateItemDraft = (item, field, value) => {
    setDrafts((current) => ({
      ...current,
      [item.id]: {
        ...getItemDraft(item),
        [field]: value,
      },
    }));
  };

  const executeAction = async (callback, successMessage, action = "Proses") => {
    setLoading(true);
    try {
      await callback();
      await mutate();
      notify("success", successMessage);
      setMode("view");
      setSelectedValidation([]);
      setSelectedApproval([]);
      setDialog(null);
      setReason("");
    } catch (error) {
      const apiError = getPurchasingRequestError(error, `${action} gagal`);
      notify("error", apiError.message, `${action} gagal`);
    } finally {
      setLoading(false);
    }
  };

  const validateSelectedItems = () => {
    const selectedItems = pendingValidation.filter((item) =>
      selectedValidation.includes(item.id),
    );
    const payload = selectedItems.map((item) => {
      const value = getItemDraft(item);

      return {
        id: item.id,
        barang_id: value.barang_id || item.barang_id || null,
        description: value.description || item.description || "",
        pemasok_id: value.pemasok_id,
        equipment_id: item.equipment_id,
        qty_acc: Number(value.qty_acc),
        harga: Number(value.harga),
        ppn: Number(value.ppn),
        potongan: Number(value.potongan),
        metode: value.metode,
        currency: value.currency,
        kurs: Number(value.kurs),
        ...calculateItemTotals(value),
      };
    });

    if (!payload.length) {
      notify(
        "error",
        "Pilih minimal satu item untuk divalidasi",
        "Item belum dipilih",
      );
      return;
    }

    const hasIncompleteItem = payload.some(
      (item) =>
        !item.pemasok_id ||
        item.qty_acc <= 0 ||
        item.harga <= 0 ||
        (item.currency === "USD" && item.kurs <= 0),
    );

    if (hasIncompleteItem) {
      notify(
        "error",
        "Lengkapi supplier, qty, harga, dan kurs pada item yang dipilih",
        "Data validasi belum lengkap",
      );
      return;
    }

    executeAction(
      () => validatePurchasingRequest(payload),
      `${payload.length} item berhasil divalidasi`,
      "Validasi",
    );
  };

  const approveSelectedItems = () => {
    executeAction(
      () => approvePurchasingRequest(selectedApproval),
      "Approval berhasil, Purchase Order telah dibuat",
      "Approval",
    );
  };

  const rollbackItems = () => {
    executeAction(
      () => rollbackPurchasingRequest(row.id, reason),
      "Rollback berhasil",
      "Rollback",
    );
  };

  const printDocument = async () => {
    try {
      const blob = await printPurchasingRequest(row.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      notify("error", error.message || "Endpoint print belum tersedia");
    }
  };

  const toggleValidationMode = () => {
    const nextMode = mode === "validate" ? "view" : "validate";
    setMode(nextMode);
    setSelectedValidation([]);
    setSelectedApproval([]);
  };

  const startApprovalMode = () => {
    setMode("approve");
    setSelectedApproval([]);
    setSelectedValidation([]);
  };

  const updateValidationSelection = (itemId, event) => {
    setSelectedValidation((current) =>
      event.target.checked
        ? [...current, itemId]
        : current.filter((id) => id !== itemId),
    );
  };

  const updateApprovalSelection = (itemId, event) => {
    setSelectedApproval((current) =>
      event.target.checked
        ? [...current, itemId]
        : current.filter((id) => id !== itemId),
    );
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
        Gagal memuat Purchasing Request. {rowError?.message}
      </Alert>
    );
  }

  const hasAttachedFiles = row.attachments?.length || row.files?.length;
  const attachedFiles = row.attachments || row.files;
  const rollbackTargets = {
    active: "draft",
    approved: "active",
  };
  const rollbackTarget = rollbackTargets[String(row.status || "").toLowerCase()];
  const rollbackDescription = `Status dokumen akan dikembalikan menjadi ${rollbackTarget || "tahap sebelumnya"}.`;

  return (
    <>
      <Breadcrumbs
        custom
        heading={row.kode || "Purchasing Request"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing Request", to: "/purchasing-request" },
          { title: row.kode || "Detail" },
        ]}
      />
      <MainCard title={<BtnBack href="/purchasing-request" />} content>
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
              <Typography variant="h5">
                Item Sparepart ({items.length})
              </Typography>
              {mode === "validate" && (
                <SelectionToolbar
                  mode={mode}
                  selectedCount={selectedValidation.length}
                  totalCount={pendingValidation.length}
                  onSelectAll={() =>
                    setSelectedValidation(
                      pendingValidation.map((item) => item.id),
                    )
                  }
                  onClear={() => setSelectedValidation([])}
                />
              )}
              {mode === "approve" && (
                <SelectionToolbar
                  mode={mode}
                  selectedCount={selectedApproval.length}
                  totalCount={pendingApproval.length}
                  onSelectAll={() =>
                    setSelectedApproval(pendingApproval.map((item) => item.id))
                  }
                  onClear={() => setSelectedApproval([])}
                />
              )}
              {items.map((item, index) => (
                <RequestItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  mode={mode}
                  suppliers={suppliers}
                  barangOptions={barangOptions}
                  value={getItemDraft(item)}
                  eligibleValidation={pendingValidation.some(
                    (pendingItem) => pendingItem.id === item.id,
                  )}
                  eligibleApproval={pendingApproval.some(
                    (pendingItem) => pendingItem.id === item.id,
                  )}
                  validationSelected={selectedValidation.includes(item.id)}
                  approvalSelected={selectedApproval.includes(item.id)}
                  onValidationChange={updateValidationSelection}
                  onApprovalChange={updateApprovalSelection}
                  onDraftChange={updateItemDraft}
                />
              ))}
            </Stack>
            {hasAttachedFiles ? (
              <AttachmentsCard files={attachedFiles} />
            ) : null}
          </Stack>
          <Stack
            spacing={2}
            sx={{
              height: "fit-content",
              position: { lg: "sticky" },
              top: { lg: 88 },
            }}
          >
            <DocumentActions
              row={row}
              permissions={permissions}
              mode={mode}
              pendingValidationCount={pendingValidation.length}
              pendingApprovalCount={pendingApproval.length}
              selectedValidationCount={selectedValidation.length}
              selectedApprovalCount={selectedApproval.length}
              loading={loading}
              onPrint={printDocument}
              onToggleValidation={toggleValidationMode}
              onValidate={validateSelectedItems}
              onStartApproval={startApprovalMode}
              onApprove={() => setDialog("approve")}
              onRollback={() => setDialog("rollback")}
            />
            <ProgressCard items={items} />
          </Stack>
        </Box>
      </MainCard>
      <ActionDialog
        open={dialog === "approve"}
        title="Approval Purchasing Request"
        description={`Approve ${selectedApproval.length} dari ${pendingApproval.length} item? Purchase Order hanya dibuat untuk item yang dipilih, berdasarkan supplier dan PPN.`}
        confirmLabel={`Approve ${selectedApproval.length} Item & Buat PO`}
        color="success"
        loading={loading}
        onClose={() => setDialog(null)}
        onConfirm={approveSelectedItems}
      />
      <ActionDialog
        open={dialog === "rollback"}
        title="Rollback Purchasing Request"
        description={rollbackDescription}
        confirmLabel="Rollback"
        color="error"
        loading={loading}
        reason={reason}
        onReasonChange={setReason}
        requireReason
        onClose={() => setDialog(null)}
        onConfirm={rollbackItems}
      />
    </>
  );
}
