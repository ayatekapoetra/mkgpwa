"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Calendar,
  Clock,
  DocumentText,
  Edit2,
  InfoCircle,
  Money,
  ReceiptItem,
  Setting2,
  TickCircle,
  Truck,
  TruckFast,
  Warning2,
} from "iconsax-react";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import { openNotification } from "api/notification";
import {
  approveRentalContract,
  cancelRentalContract,
  getErrorMessage,
  rejectRentalContract,
  requestRentalContractApproval,
  statusColor,
  statusLabel,
  useRentalContract,
  useRentalContractAudits,
  RENTAL_TOOLS,
} from "api/rental-contract";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const billingLabels = {
  HOUR: "Per Jam",
  DAY: "Per Hari",
  MONTH: "Per Bulan",
};

const minimumLabels = {
  DAY: "Hari",
  CALENDAR_MONTH: "Bulan Kalender",
  RENTAL_TERM: "Seluruh Masa Sewa",
};

const toolColorMap = {
  BUCKET: "primary",
  BREAKER: "warning",
  LONGARM: "secondary",
};

const getItemRates = (item) => {
  const rates = item.rates || item.tools_rates || [];
  if (Array.isArray(rates) && rates.length > 0) {
    return rates;
  }
  if (item.unit_price) {
    return [
      { tools_type: "BUCKET", unit_price: item.unit_price, is_active: "Y" },
    ];
  }
  return [];
};

function StatCard({ label, value, helper, icon: Icon, color = "primary" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        borderColor: `${color}.main`,
        borderWidth: 1,
        borderTopWidth: 3,
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          {helper && (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            color: `${color}.main`,
            bgcolor: `${color}.lighter`,
          }}
        >
          <Icon size={20} />
        </Box>
      </Stack>
    </Paper>
  );
}

function ContractItemCard({ item, index }) {
  const modelName =
    item.model ||
    item.equipment?.model ||
    item.equipment?.nama ||
    item.kdunit ||
    `Item #${index + 1}`;
  const tipeName = (
    item.tipe ||
    item.equipment?.tipe ||
    item.equipment?.kategori ||
    "Equipment"
  ).toUpperCase();
  const quantity = item.quantity || 1;
  const billingUnit = item.billing_unit || "HOUR";
  const billingLabel = billingLabels[billingUnit] || billingUnit;
  const rates = getItemRates(item);
  const activeRates = rates.filter(
    (r) => r.is_active === "Y" || r.is_active === true || r.is_active === 1,
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        borderTop: 3,
        borderTopColor: "primary.main",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1}
          alignItems={{ sm: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: "primary.lighter",
                color: "primary.main",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={700}>
                  {modelName}
                </Typography>
                <Chip
                  size="small"
                  label={tipeName}
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 600, height: 22 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Kebutuhan: <strong>{quantity} Unit</strong> · Skema Sewa:{" "}
                <strong>{billingLabel}</strong>
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${quantity} Unit`}
              color="primary"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={billingLabel}
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Stack>

        <Divider />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TruckFast size={18} color="#697586" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Spesifikasi Model
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {modelName} ({tipeName})
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Setting2 size={18} color="#697586" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Klausul Minimum Charge
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {billingUnit === "HOUR"
                    ? `Min. ${item.minimum_quantity ?? 0} Jam / ${minimumLabels[item.minimum_period] || "Bulan"}`
                    : "Tidak berlaku (Non-Hourly)"}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DocumentText size={18} color="#697586" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Catatan Item
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {item.notes || "-"}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Card
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "background.default" : "#fafafa",
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              spacing={1}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Lampiran Multi-Tools & Tarif Sewa
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeRates.map((r, rIdx) => {
                  const toolType = (r.tools_type || "BUCKET").toUpperCase();
                  const color = toolColorMap[toolType] || "primary";
                  return (
                    <Chip
                      key={rIdx}
                      size="small"
                      color={color}
                      variant="filled"
                      label={`${toolType}: ${formatPrice(r.unit_price)} / ${billingLabel}`}
                      sx={{ fontWeight: 700 }}
                    />
                  );
                })}
              </Stack>
            </Stack>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 1.5, overflow: "hidden" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.lighter" }}>
                    <TableCell
                      sx={{ fontWeight: 800, color: "primary.main", width: 50 }}
                    >
                      No
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 800, color: "primary.main" }}
                    >
                      Tools Attachment
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: "primary.main",
                        width: 140,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: "primary.main",
                        width: 220,
                      }}
                    >
                      Tarif Sewa ({billingLabel})
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {RENTAL_TOOLS.map((metaTool, tIdx) => {
                    const matched = rates.find(
                      (r) =>
                        (r.tools_type || "").toUpperCase() ===
                        metaTool.type.toUpperCase(),
                    );
                    const isActive =
                      matched &&
                      (matched.is_active === "Y" ||
                        matched.is_active === true ||
                        matched.is_active === 1);
                    const price = matched?.unit_price;

                    return (
                      <TableRow
                        key={metaTool.type}
                        hover
                        sx={{ "&:last-child td": { border: 0 } }}
                      >
                        <TableCell>
                          <Typography variant="caption" fontWeight={700}>
                            {tIdx + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {metaTool.label}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={isActive ? "Aktif" : "Tidak Aktif"}
                            color={isActive ? "success" : "default"}
                            variant={isActive ? "filled" : "outlined"}
                            sx={{ fontWeight: 700, height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={isActive ? "primary.main" : "text.disabled"}
                          >
                            {isActive ? formatPrice(price) : "-"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Card>
      </Stack>
    </Paper>
  );
}

function LoadingState() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={170} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} md={3} key={i}>
            <Skeleton variant="rounded" height={110} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={300} />
    </Stack>
  );
}

export default function RentalContractShow({ id }) {
  const { data, loading, error, mutate } = useRentalContract(id);
  const {
    data: audits,
    loading: auditsLoading,
    error: auditsError,
  } = useRentalContractAudits(id);
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [processingAction, setProcessingAction] = useState("");
  const [statusOverride, setStatusOverride] = useState("");

  if (loading)
    return (
      <>
        <Breadcrumbs
          custom
          heading="Detail Kontrak Rental"
          links={[
            { title: "Home", to: APP_DEFAULT_PATH },
            {
              title: "Kontrak Tarif Rental",
              to: "/rental-contracts",
            },
            { title: "Detail" },
          ]}
        />
        <LoadingState />
      </>
    );

  if (error || !data)
    return (
      <>
        <Breadcrumbs
          custom
          heading="Detail Kontrak Rental"
          links={[
            { title: "Home", to: APP_DEFAULT_PATH },
            {
              title: "Kontrak Tarif Rental",
              to: "/rental-contracts",
            },
            { title: "Detail" },
          ]}
        />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => mutate()}>
              Coba lagi
            </Button>
          }
        >
          Gagal memuat detail kontrak rental.
        </Alert>
      </>
    );

  const header = data.header || data;
  const permissions = data.permissions || {};
  const items = data.items || header.items || [];
  const status = statusOverride || header.status;
  const totalUnits = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 1),
    0,
  );

  const run = async (name) => {
    const statusByAction = {
      "request-approval": "PENDING_APPROVAL",
      approve: "APPROVED",
      reject: "REJECTED",
      cancel: "CANCELLED",
    };
    setProcessingAction(name);
    try {
      let response;
      if (name === "request-approval")
        response = await requestRentalContractApproval(id);
      if (name === "approve") response = await approveRentalContract(id);
      if (name === "reject")
        response = await rejectRentalContract(id, reason.trim());
      if (name === "cancel")
        response = await cancelRentalContract(id, reason.trim());
      setStatusOverride(response?.status || statusByAction[name]);
      openNotification({
        title: "success",
        message: "Aksi kontrak berhasil diproses",
        alert: { color: "success" },
      });
      setAction("");
      setReason("");
      await mutate();
    } catch (err) {
      openNotification({
        title: "error",
        message: getErrorMessage(err),
        alert: { color: "error" },
      });
    } finally {
      setProcessingAction("");
    }
  };

  const needsReason = action === "reject" || action === "cancel";
  const actionLabels = {
    "request-approval": "Mengajukan...",
    approve: "Menyetujui...",
    reject: "Menolak...",
    cancel: "Membatalkan...",
  };

  const actionButtons = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      flexWrap="wrap"
      useFlexGap
    >
      {permissions.can_update && ["DRAFT", "REJECTED"].includes(status) && (
        <Button
          component={Link}
          href={`/rental-contracts/${id}/edit`}
          startIcon={<Edit2 size={17} />}
          variant="outlined"
          disabled={Boolean(processingAction)}
        >
          Edit
        </Button>
      )}
      {(permissions.can_validate || permissions.can_request_approval) &&
        status === "DRAFT" && (
          <Button
            variant="contained"
            onClick={() => run("request-approval")}
            disabled={Boolean(processingAction)}
          >
            {processingAction === "request-approval"
              ? actionLabels["request-approval"]
              : "Ajukan approval"}
          </Button>
        )}
      {permissions.can_approve && status === "PENDING_APPROVAL" && (
        <Button
          color="success"
          variant="contained"
          startIcon={<TickCircle size={17} />}
          onClick={() => run("approve")}
          disabled={Boolean(processingAction)}
        >
          {processingAction === "approve" ? actionLabels.approve : "Setujui"}
        </Button>
      )}
      {permissions.can_reject && status === "PENDING_APPROVAL" && (
        <Button
          color="error"
          onClick={() => setAction("reject")}
          disabled={Boolean(processingAction)}
        >
          {processingAction === "reject" ? actionLabels.reject : "Tolak"}
        </Button>
      )}
      {permissions.can_remove &&
        ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(status) && (
          <Button
            color="warning"
            onClick={() => setAction("cancel")}
            disabled={Boolean(processingAction)}
          >
            {processingAction === "cancel" ? actionLabels.cancel : "Batalkan"}
          </Button>
        )}
    </Stack>
  );

  return (
    <>
      <Breadcrumbs
        custom
        heading={header.contract_number || "Detail Kontrak Rental"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          {
            title: "Kontrak Tarif Rental",
            to: "/rental-contracts",
          },
          { title: "Detail" },
        ]}
      />
      <Stack spacing={2.5}>
        <Paper
          sx={{
            p: { xs: 2.5, md: 3.5 },
            color: "common.white",
            borderRadius: 2,
            background:
              "linear-gradient(115deg, #173b66 0%, #236b78 100%)",
          }}
        >
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.72 }}>
                  Kontrak tarif rental alat berat
                </Typography>
                <Typography
                  variant="h2"
                  sx={{ color: "inherit", wordBreak: "break-word" }}
                >
                  {header.contract_number || `#${id}`}
                </Typography>
                <Typography sx={{ mt: 0.75, opacity: 0.78 }}>
                  Kelola spesifikasi model unit dan konfigurasi tarif
                  multi-tools dalam kontrak.
                </Typography>
              </Box>
              <Chip
                color={statusColor[status] || "default"}
                sx={{
                  alignSelf: { xs: "flex-start", md: "center" },
                  bgcolor: "rgba(255,255,255,.16)",
                  color: "common.white",
                  fontWeight: 700,
                }}
                label={
                  statusLabel[status] || status || "Status tidak diketahui"
                }
              />
            </Stack>
            {actionButtons}
          </Stack>
        </Paper>

        <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Model Alat Disewa"
              value={`${items.length} Model`}
              helper={`${totalUnits} Total Unit`}
              icon={TruckFast}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Total Unit Kebutuhan"
              value={`${totalUnits} Unit`}
              helper="kebutuhan operasional"
              icon={Truck}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Skema Utama"
              value={
                items.length
                  ? billingLabels[items[0].billing_unit] ||
                    items[0].billing_unit ||
                    "-"
                  : "-"
              }
              helper={items.length ? `${items[0].billing_unit || ""}` : ""}
              icon={Setting2}
              color="info"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Durasi Kontrak"
              value={
                header.start_date && header.end_date
                  ? `${Math.max(1, Math.ceil((new Date(header.end_date) - new Date(header.start_date)) / 86400000))} hari`
                  : "-"
              }
              helper={`${formatDate(header.start_date)} - ${formatDate(header.end_date)}`}
              icon={Calendar}
              color="success"
            />
          </Grid>
        </Grid>

        <MainCard
          title="Informasi Kontrak"
          secondary={<InfoCircle size={20} />}
        >
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ color: "primary.main", mt: 0.15 }}>
                  <ReceiptItem size={18} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Unit bisnis
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {header.bisnis?.nama ||
                      header.bisnis?.name ||
                      header.bisnis_name ||
                      header.bisnis_id}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ color: "primary.main", mt: 0.15 }}>
                  <Truck size={18} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Penyewa
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {header.penyewa?.nama ||
                      header.penyewa?.name ||
                      header.penyewa_name ||
                      header.penyewa_id}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ color: "primary.main", mt: 0.15 }}>
                  <Calendar size={18} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Mulai kontrak
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(header.start_date)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ color: "primary.main", mt: 0.15 }}>
                  <Calendar size={18} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Berakhir
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(header.end_date)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ color: "primary.main", mt: 0.15 }}>
                  <DocumentText size={18} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Catatan
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {header.notes || "-"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>

        <MainCard
          title="Daftar Model Alat & Multi-Tools Attachment"
          secondary={
            <Chip
              size="small"
              label={`${items.length} Model · ${totalUnits} Unit`}
            />
          }
        >
          {!items.length ? (
            <Alert severity="info">
              Belum ada item alat pada kontrak ini.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {items.map((item, index) => (
                <ContractItemCard
                  key={item.id || index}
                  item={item}
                  index={index}
                />
              ))}
            </Stack>
          )}
        </MainCard>

        <MainCard
          title="Riwayat Aktivitas"
          secondary={<Clock size={20} />}
        >
          {auditsLoading ? (
            <Stack spacing={1}>
              <Skeleton height={45} />
              <Skeleton height={45} />
            </Stack>
          ) : auditsError ? (
            <Alert severity="warning">
              Riwayat aktivitas tidak dapat dimuat.
            </Alert>
          ) : !audits?.length ? (
            <Alert severity="info">Belum ada aktivitas tercatat.</Alert>
          ) : (
            <Stack spacing={0}>
              {audits.map((audit, index) => (
                <Stack
                  key={audit.id || index}
                  direction="row"
                  spacing={1.5}
                  sx={{
                    pb: index === audits.length - 1 ? 0 : 2,
                    pt: index ? 2 : 0,
                    borderBottom:
                      index === audits.length - 1 ? 0 : 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: "primary.lighter",
                      color: "primary.main",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={15} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700}>
                      {audit.action ||
                        audit.event ||
                        audit.status ||
                        "Aktivitas kontrak"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {audit.description ||
                        audit.reason ||
                        audit.notes ||
                        "Perubahan tercatat pada kontrak."}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(
                        audit.created_at ||
                          audit.createdAt ||
                          audit.date,
                      )}
                      {audit.user_name || audit.actor_name
                        ? ` · ${audit.user_name || audit.actor_name}`
                        : ""}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </MainCard>
      </Stack>

      <Dialog
        open={Boolean(action)}
        onClose={() => !processingAction && setAction("")}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {action === "reject" ? "Tolak kontrak" : "Batalkan kontrak"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Berikan alasan agar keputusan ini tercatat dalam riwayat kontrak.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            required
            multiline
            minRows={3}
            label="Alasan"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAction("")}
            disabled={Boolean(processingAction)}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color={action === "reject" ? "error" : "warning"}
            disabled={
              Boolean(processingAction) || (needsReason && !reason.trim())
            }
            onClick={() => run(action)}
          >
            {processingAction === action
              ? actionLabels[action]
              : "Konfirmasi"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
