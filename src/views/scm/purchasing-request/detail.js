"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

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
import { calculateItemTotals, formatCurrency } from "./utils";
import { groupApprovalItems } from "./approvalGrouping";

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
    {},
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
  const [approvalMetodeOverrides, setApprovalMetodeOverrides] = useState({});
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

  const selectedItemsToApprove = useMemo(() => {
    return items.filter((item) => selectedApproval.includes(item.id));
  }, [items, selectedApproval]);

  const approvalGroups = useMemo(() => {
    return groupApprovalItems(selectedItemsToApprove, approvalMetodeOverrides);
  }, [selectedItemsToApprove, approvalMetodeOverrides]);

  const setAllMetode = (metodeVal) => {
    const updated = {};
    selectedItemsToApprove.forEach((item) => {
      updated[item.id] = metodeVal;
    });
    setApprovalMetodeOverrides(updated);
  };

  const handleItemMetodeChange = (itemId, nextMetode) => {
    setApprovalMetodeOverrides((prev) => ({
      ...prev,
      [itemId]: nextMetode,
    }));
  };

  const approveSelectedItems = () => {
    const payloadItems = selectedApproval.map((id) => {
      const it = items.find((x) => x.id === id);
      const metode =
        approvalMetodeOverrides[id] !== undefined
          ? approvalMetodeOverrides[id]
          : it?.metode || "kredit";
      return { id, metode };
    });

    executeAction(
      () => approvePurchasingRequest(payloadItems),
      `Approval berhasil, ${approvalGroups.length} Purchase Order telah dibuat`,
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
        title="Approval Purchasing Request & Pembuatan PO"
        maxWidth="md"
        confirmLabel={`Approve & Buat ${approvalGroups.length} Dokumen PO`}
        color="success"
        loading={loading}
        onClose={() => setDialog(null)}
        onConfirm={approveSelectedItems}
      >
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="info" variant="outlined">
            Sesuai <b>PRD-SCM-002</b>, item yang disetujui akan dikelompokkan ke Purchase Order terpisah berdasarkan kombinasi: <b>Pemasok</b>, <b>Tarif PPN</b>, dan <b>Metode Pembayaran (Tunai vs Kredit)</b>.
          </Alert>

          {/* Table seleksi metode item */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Konfigurasi Metode Bayar Item ({selectedItemsToApprove.length} Item Dipilih)
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => setAllMetode("tunai")}
                  sx={{ textTransform: "none", py: 0.2, px: 1, fontSize: "0.75rem" }}
                >
                  Set Semua Tunai
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={() => setAllMetode("kredit")}
                  sx={{ textTransform: "none", py: 0.2, px: 1, fontSize: "0.75rem" }}
                >
                  Set Semua Kredit
                </Button>
              </Stack>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Item Sparepart</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Qty / PPN</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 150 }}>Metode Bayar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedItemsToApprove.map((item) => {
                    const currentMetode =
                      approvalMetodeOverrides[item.id] !== undefined
                        ? approvalMetodeOverrides[item.id]
                        : (item.metode || "kredit");
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.barang?.nama || item.barang?.nm_barang || item.nama_barang || item.description || `Item #${item.id}`}
                          </Typography>
                          {item.kdbarang && (
                            <Typography variant="caption" color="text.secondary">
                              Kode: {item.kdbarang}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.pemasok?.nama_pemasok || item.pemasok?.nama || item.pemasok?.name || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {item.qty_acc || item.qty} {item.stn}
                          </Typography>
                          <Chip
                            size="small"
                            label={Number(item.ppn) > 0 ? `PPN ${item.ppn}%` : "Non-PPN"}
                            color={Number(item.ppn) > 0 ? "warning" : "default"}
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.6875rem", mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(item.subtotal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={currentMetode}
                            onChange={(e) => handleItemMetodeChange(item.id, e.target.value)}
                            sx={{ fontSize: "0.8125rem", height: 32 }}
                            fullWidth
                          >
                            <MenuItem value="tunai">Tunai (CASH)</MenuItem>
                            <MenuItem value="kredit">Kredit (CREDIT)</MenuItem>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Preview Pembentukan Dokumen PO */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Simulasi Dokumen PO yang Akan Diterbitkan ({approvalGroups.length} Purchase Order):
            </Typography>
            <Stack spacing={1.5}>
              {approvalGroups.map((group, idx) => (
                <Paper
                  key={group.group_key}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: "background.paper",
                    borderLeft: 4,
                    borderLeftColor: group.metode === "tunai" ? "success.main" : "info.main",
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          PO #{idx + 1}: {group.pemasok_name}
                        </Typography>
                        <Chip
                          size="small"
                          label={group.metode_label.toUpperCase()}
                          color={group.metode === "tunai" ? "success" : "info"}
                          sx={{ fontWeight: 600, height: 22 }}
                        />
                        <Chip
                          size="small"
                          label={group.ppn_label}
                          color={group.is_ppn ? "warning" : "default"}
                          variant="outlined"
                          sx={{ height: 22 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {group.items.length} item sparepart · {group.default_top.label} ({group.default_top.description})
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { sm: "right" } }}>
                      <Typography variant="caption" color="text.secondary">
                        Estimasi Grand Total
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                        {formatCurrency(group.grandtotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Stack>
      </ActionDialog>
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
