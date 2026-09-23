"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSnackbar } from "notistack";
import moment from "moment";
import "moment/locale/id";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BuildIcon from "@mui/icons-material/Build";
import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import useSWR from "swr";

import {
  useFleetEquipmentAudit,
  updateOperationalDetails,
  revalidateFleetData,
  useFleetKegiatanOptions,
  useFleetMaterialOptions,
} from "api/fleet-assignment";
import { fetcher } from "utils/axios";
import { formatDateTime, statusColor, statusGradient, statusGlow, statusLabel } from "./shared";
import DailyBreakdownDrawer from "./DailyBreakdownDrawer";

const parseActivityTime = (value) => {
  if (!value) return null;
  const parsed = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateTimeInput = (value) => {
  const parsed = parseActivityTime(value);
  if (!parsed) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const unwrapOptions = (value) => {
  const payload = value?.rows ?? value?.data?.rows ?? value?.data ?? value;
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

const detailValues = (item) => ({
  operator_id: item?.operator_id || "",
  kegiatan_id: item?.kegiatan_id || "",
  material_id: item?.material_id || "",
  lokasi_pit_id: item?.lokasi_pit_id || "",
  lokasi_site_id: item?.lokasi_site_id || "",
  date_ops: item?.date_ops ? moment(item.date_ops).format("YYYY-MM-DD") : "",
  shift_id: item?.shift_id || "",
  start_time: dateTimeInput(item?.start_time),
  finish_time: dateTimeInput(item?.finish_time),
});

function InfoTile({ icon, label, value }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1.5, height: "100%" }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ color: "text.secondary", mt: 0.25 }}>{icon}</Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>{label}</Typography>
          <Typography variant="body2" fontWeight={600} noWrap>{value || "-"}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function AuditTimelineItem({ event, isLast }) {
  const actionLabel = statusLabel(event.action);
  const actionColor = statusColor(event.action);
  return (
    <Box sx={{ position: "relative", pl: 3.5, pb: isLast ? 0 : 2 }}>
      {!isLast && <Box sx={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, bgcolor: "divider" }} />}
      <Box sx={{ position: "absolute", left: 4, top: 4, width: 16, height: 16, borderRadius: "50%", bgcolor: `${actionColor}.main`, border: 3, borderColor: "background.paper", zIndex: 1 }} />
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "background.default", border: 1, borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight={700} color={`${actionColor}.main`}>{actionLabel}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {formatDateTime(event.created_at)} · {event.actor_name || "System"}
        </Typography>
        {(event.from_status || event.to_status) && (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }} useFlexGap flexWrap="wrap">
            {event.from_status && <Chip size="small" label={statusLabel(event.from_status)} color={statusColor(event.from_status)} variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.6875rem" } }} />}
            {event.from_status && event.to_status && <Typography variant="caption" color="text.secondary">→</Typography>}
            {event.to_status && <Chip size="small" label={statusLabel(event.to_status)} color={statusColor(event.to_status)} sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.6875rem" } }} />}
          </Stack>
        )}
        {(event.kegiatan_name || event.material_name || event.lokasi_pit_nama) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {[event.kegiatan_name, event.material_name, event.lokasi_pit_nama].filter(Boolean).join(" · ")}
          </Typography>
        )}
        {event.reason && <Typography variant="caption" sx={{ display: "block", mt: 0.25, fontStyle: "italic", color: "text.secondary" }}>{event.reason}</Typography>}
      </Paper>
    </Box>
  );
}

export default function EquipmentDetailDrawer({ item, open, onClose, canUpdate = true }) {
  const { enqueueSnackbar } = useSnackbar();
  const equipmentId = item?.equipment_id || "";
  const audit = useFleetEquipmentAudit(
    equipmentId,
    { date_ops: item?.date_ops || "", days: 3, future_days: 1 },
    Boolean(open && equipmentId && item?.date_ops)
  );

  const [statusSwitch, setStatusSwitch] = useState(() => String(item?.status || "").toLowerCase() || "beroperasi");
  const [activeItemId, setActiveItemId] = useState(() => item?.item_id || "");
  const [saving, setSaving] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [details, setDetails] = useState(() => detailValues(item));

  const equipmentKategori = String(item?.equipment_kategori || item?.ctgunit || "").toUpperCase();
  const intervalStart = parseActivityTime(item?.start_time);
  const intervalFinish = parseActivityTime(item?.finish_time);
  const currentTime = new Date();
  const breakdownAllowed = Boolean(intervalStart && intervalFinish && currentTime >= intervalStart && currentTime <= intervalFinish);
  const kegiatanSWR = useFleetKegiatanOptions(
    { kategori: equipmentKategori, status: "editable" },
    Boolean(open && editingDetails && equipmentKategori)
  );
  const materialSWR = useFleetMaterialOptions(Boolean(open && editingDetails));
  const masterQuery = new URLSearchParams({ page: "1", perPages: "1000" }).toString();
  const { data: operatorData, isLoading: operatorLoading } = useSWR(editingDetails ? `/master/karyawan/oprdrv?cabang_id=${item?.cabang_id || ""}` : null, fetcher, { revalidateOnFocus: false });
  const { data: pitData, isLoading: pitLoading } = useSWR(editingDetails ? `/master/lokasi-kerja/list?${masterQuery}` : null, fetcher, { revalidateOnFocus: false });
  const { data: siteData, isLoading: siteLoading } = useSWR(editingDetails ? `/master/penyewa/list?${masterQuery}` : null, fetcher, { revalidateOnFocus: false });
  const { data: shiftData, isLoading: shiftLoading } = useSWR(editingDetails ? "/master/shift/list" : null, fetcher, { revalidateOnFocus: false });

  const kegiatanOptions = kegiatanSWR.options || [];
  const detailKegiatanOptions = details.kegiatan_id && !kegiatanOptions.some((option) => String(option.id) === String(details.kegiatan_id))
    ? [{ id: details.kegiatan_id, nama: item?.kegiatan_name || `Kegiatan #${details.kegiatan_id}`, legacy: true }, ...kegiatanOptions]
    : kegiatanOptions;
  const materialOptions = materialSWR.options || [];
  const operatorOptions = unwrapOptions(operatorData);
  const pitOptions = unwrapOptions(pitData);
  const siteOptions = unwrapOptions(siteData);
  const shiftOptions = unwrapOptions(shiftData);
  const selectedDetailKegiatan = detailKegiatanOptions.find((option) => String(option.id) === String(details.kegiatan_id)) || null;
  const detailKegiatanChanged = String(details.kegiatan_id || "") !== String(item?.kegiatan_id || "");
  const detailTargetStatus = !detailKegiatanChanged
    ? statusSwitch
    : String(selectedDetailKegiatan?.subctg || "").trim().toLowerCase() === "standby" ? "standby" : "beroperasi";

  useEffect(() => {
    const currentStatus = String(item?.status || "").toLowerCase() || "beroperasi";
    setStatusSwitch(currentStatus);
    setActiveItemId(item?.item_id || "");
    setEditingDetails(false);
    setDetails(detailValues(item));
  }, [item]);

  const handleStatusSelect = (_, newValue) => {
    if (!newValue || newValue === statusSwitch || saving) return;
    if (newValue === "breakdown") {
      setBreakdownOpen(true);
      return;
    }
    setDetails(detailValues(item));
    setEditingDetails(true);
  };

  const setDetail = (field, value) => setDetails((current) => ({ ...current, [field]: value }));

  const handleEditDetails = () => {
    setDetails(detailValues(item));
    setEditingDetails(true);
  };

  const handleCancelDetails = () => {
    setDetails(detailValues(item));
    setEditingDetails(false);
  };

  const handleSaveDetails = async () => {
    const required = ["kegiatan_id", "lokasi_pit_id", "lokasi_site_id", "date_ops", "shift_id", "start_time", "finish_time"];
    if (required.some((field) => !details[field])) {
      enqueueSnackbar("Lengkapi seluruh Operational Details", { variant: "error" });
      return;
    }
    if (new Date(details.finish_time) <= new Date(details.start_time)) {
      enqueueSnackbar("Waktu selesai harus lebih besar dari waktu mulai", { variant: "error" });
      return;
    }

    setSaving(true);
    try {
      await updateOperationalDetails({
        item_id: activeItemId,
        equipment_id: equipmentId,
        ...details,
      });
      enqueueSnackbar("Operational Details berhasil diperbarui", { variant: "success" });
      setEditingDetails(false);
      await Promise.all([revalidateFleetData(), audit.mutate()]);
      onClose?.();
    } catch (error) {
      const msg = error?.diagnostic?.message || error?.response?.data?.diagnostic?.message || error?.message || "Gagal memperbarui Operational Details";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const code = item?.equipment_abbr || item?.equipment_kode || item?.kode || "-";
  const status = String(item?.status || "").toLowerCase();
  const breakdownHref = item?.daily_breakdown_id ? `/daily-breakdown/${item.daily_breakdown_id}` : "";
  const color = statusColor(status);
  const gradient = statusGradient(status);
  const glow = statusGlow(status);
  const isHE = equipmentKategori === "HE";
  const TypeIcon = isHE ? PrecisionManufacturingIcon : LocalShippingIcon;

  return (
    <>
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100vw", md: 760 }, maxWidth: "100%", height: "100%" } }}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Hero Header */}
        <Box sx={{ background: gradient, color: "#fff", p: 2.5, position: "relative", overflow: "hidden", boxShadow: glow }}>
          <Box sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1 }}><TypeIcon sx={{ fontSize: 120 }} /></Box>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position: "relative" }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.5 }}>Active Inspection</Typography>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 0.5 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}><TypeIcon /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>{code}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{item?.equipment_model || item?.equipment_nama || "-"}</Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={statusLabel(status)} sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700, backdropFilter: "blur(4px)" }} />
              <IconButton onClick={onClose} sx={{ color: "#fff" }} aria-label="Tutup"><CloseIcon /></IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5, overflowY: "auto", flex: 1 }}>
          <Stack spacing={2.5}>
            {/* Equipment Information */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>Equipment Information</Typography>
              <Grid container spacing={1.25}>
                <Grid item xs={12} sm={6}><InfoTile icon={<PrecisionManufacturingIcon fontSize="small" />} label="Kode Equipment" value={item?.equipment_kode} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Abbr" value={item?.equipment_abbr} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Model" value={item?.equipment_model} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Kategori" value={item?.equipment_kategori || item?.ctgunit} /></Grid>
              </Grid>
            </Box>

            {/* Status Switcher */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>Status Equipment</Typography>
              {status === "breakdown" ? (
                <Stack spacing={1.5}>
                  <Alert severity={breakdownHref ? "info" : "warning"}>
                    {breakdownHref
                      ? "Equipment sedang Breakdown. Perubahan ke Beroperasi atau Standby harus diproses melalui Daily Breakdown aktif terbaru agar penyelesaian pekerjaan dan waktu ready tercatat."
                      : "Data Daily Breakdown aktif untuk equipment ini tidak ditemukan. Hubungi administrator sebelum mengubah status equipment."}
                  </Alert>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />} component={breakdownHref ? Link : "button"} href={breakdownHref || undefined} disabled={!canUpdate || !breakdownHref}>
                      Proses ke Beroperasi
                    </Button>
                    <Button fullWidth variant="contained" color="warning" startIcon={<WarningAmberIcon />} component={breakdownHref ? Link : "button"} href={breakdownHref || undefined} disabled={!canUpdate || !breakdownHref}>
                      Proses ke Standby
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <>
                  <ToggleButtonGroup value={statusSwitch} exclusive onChange={handleStatusSelect} fullWidth disabled={saving || editingDetails || !canUpdate} sx={{ gap: 1, position: "relative", "& .MuiToggleButtonGroup-grouped": { mr: 1, border: 1, borderColor: "divider", borderRadius: "8px !important", "&:last-child": { mr: 0 } }, "& .MuiToggleButton-root": { py: 1.25, fontWeight: 700, gap: 0.75, textTransform: "none", fontSize: "0.875rem" } }}>
                    {saving && <Backdrop open sx={{ position: "absolute", zIndex: 1, bgcolor: "rgba(255,255,255,0.6)", borderRadius: 2 }}><CircularProgress size={24} /></Backdrop>}
                    <ToggleButton value="beroperasi" sx={{ "&.Mui-selected": { bgcolor: "success.main", color: "#fff", "&:hover": { bgcolor: "success.dark" } } }}><CheckCircleIcon fontSize="small" /> Beroperasi</ToggleButton>
                    <ToggleButton value="standby" sx={{ "&.Mui-selected": { bgcolor: "warning.main", color: "#fff", "&:hover": { bgcolor: "warning.dark" } } }}><WarningAmberIcon fontSize="small" /> Standby</ToggleButton>
                    <ToggleButton value="breakdown" disabled={!breakdownAllowed} sx={{ "&.Mui-selected": { bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } } }}><ErrorOutlineIcon fontSize="small" /> Breakdown</ToggleButton>
                  </ToggleButtonGroup>
                  {!breakdownAllowed && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      Breakdown hanya dapat dibuat ketika waktu sekarang berada dalam interval aktivitas equipment.
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Status Beroperasi atau Standby mengikuti Kegiatan yang dipilih melalui Edit Operational Details.
                  </Typography>
                </>
              )}
            </Box>

            <Divider />

            {/* Operational Info */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Operational Details</Typography>
                {!editingDetails && canUpdate && status !== "breakdown" && <Button size="small" startIcon={<EditOutlinedIcon />} onClick={handleEditDetails}>Edit</Button>}
              </Stack>
              {editingDetails ? (
                <Stack spacing={1.5}>
                  <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete options={operatorOptions} loading={operatorLoading} value={operatorOptions.find((option) => String(option.id) === String(details.operator_id)) || null} onChange={(_, value) => setDetail("operator_id", value?.id || "")} getOptionLabel={(option) => [option?.nama, option?.nik].filter(Boolean).join(" - ")} isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)} renderInput={(params) => <TextField {...params} size="small" label="Operator (Opsional)" />} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete options={detailKegiatanOptions} loading={kegiatanSWR.isLoading} value={selectedDetailKegiatan} onChange={(_, value) => setDetail("kegiatan_id", value?.id || "")} getOptionLabel={(option) => option?.legacy ? `${option.nama} (data saat ini)` : option?.nama || ""} isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)} renderInput={(params) => <TextField {...params} required size="small" label="Kegiatan" helperText={detailKegiatanChanged && selectedDetailKegiatan ? `Status akan menjadi ${detailTargetStatus === "standby" ? "Standby" : "Beroperasi"}` : ""} />} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete options={pitOptions} loading={pitLoading} value={pitOptions.find((option) => String(option.id) === String(details.lokasi_pit_id)) || null} onChange={(_, value) => setDetail("lokasi_pit_id", value?.id || "")} getOptionLabel={(option) => option?.nama || ""} isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)} renderInput={(params) => <TextField {...params} required size="small" label="Lokasi Pit" />} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete options={siteOptions} loading={siteLoading} value={siteOptions.find((option) => String(option.id) === String(details.lokasi_site_id)) || null} onChange={(_, value) => setDetail("lokasi_site_id", value?.id || "")} getOptionLabel={(option) => option?.nama || ""} isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)} renderInput={(params) => <TextField {...params} required size="small" label="Lokasi Site" />} />
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth required size="small" type="datetime-local" label="Waktu Mulai" value={details.start_time} onChange={(event) => setDetail("start_time", event.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth required size="small" type="datetime-local" label="Waktu Selesai" value={details.finish_time} onChange={(event) => setDetail("finish_time", event.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete options={materialOptions} loading={materialSWR.isLoading} value={materialOptions.find((option) => String(option.id) === String(details.material_id)) || null} onChange={(_, value) => setDetail("material_id", value?.id || "")} getOptionLabel={(option) => option?.nama || ""} isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)} renderInput={(params) => <TextField {...params} size="small" label="Material (Opsional)" />} />
                    </Grid>
                    <Grid item xs={12} sm={3}><TextField fullWidth required size="small" type="date" label="Tanggal Operasional" value={details.date_ops} onChange={(event) => setDetail("date_ops", event.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={3}>
                      <Autocomplete options={shiftOptions} loading={shiftLoading} value={shiftOptions.find((option) => String(option.id) === String(details.shift_id)) || null} onChange={(_, value) => setDetail("shift_id", value?.id || "")} getOptionLabel={(option) => option?.nama || option?.kode || ""} isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)} renderInput={(params) => <TextField {...params} required size="small" label="Shift" />} />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1.5}>
                    <Button fullWidth variant="outlined" color="secondary" onClick={handleCancelDetails} disabled={saving}>Batal</Button>
                    <Button fullWidth variant="contained" startIcon={<SaveIcon />} onClick={handleSaveDetails} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
                  </Stack>
                </Stack>
              ) : (
                <Grid container spacing={1.25}>
                  <Grid item xs={12} sm={6}><InfoTile icon={<PersonIcon fontSize="small" />} label="Operator" value={item?.operator_nama ? `${item.operator_nama} (${item.operator_nik || "-"})` : "-"} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Kegiatan" value={item?.kegiatan_name} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<LocationOnIcon fontSize="small" />} label="Lokasi Pit" value={item?.lokasi_pit_nama} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<LocationOnIcon fontSize="small" />} label="Lokasi Site" value={item?.lokasi_site_nama} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<ScheduleIcon fontSize="small" />} label="Waktu Mulai" value={formatDateTime(item?.start_time)} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<ScheduleIcon fontSize="small" />} label="Waktu Selesai" value={formatDateTime(item?.finish_time)} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Material" value={item?.material_name} /></Grid>
                  <Grid item xs={12} sm={6}><InfoTile icon={<ScheduleIcon fontSize="small" />} label="Tanggal / Shift" value={item?.date_ops ? `${moment(item.date_ops).locale("id").format("dddd, DD MMM YYYY")} · Shift ${item.shift_id || "-"}` : "-"} /></Grid>
                </Grid>
              )}
            </Box>

            <Divider />

            {/* Audit Trail */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <HistoryIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Audit Trail</Typography>
                {audit.total > 0 && <Chip size="small" label={`${audit.total} events`} sx={{ height: 20 }} />}
              </Stack>
              {audit.isLoading && <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /><Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Memuat riwayat...</Typography></Stack>}
              {audit.error && <Alert severity="error" sx={{ borderRadius: 2 }}>Gagal memuat audit trail.</Alert>}
              {!audit.isLoading && !audit.error && !audit.audit.length && (
                <Box sx={{ py: 4, textAlign: "center" }}><HistoryIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} /><Typography color="text.secondary" variant="body2">Belum ada riwayat perubahan untuk equipment ini.</Typography></Box>
              )}
              {!audit.isLoading && !audit.error && audit.audit.length > 0 && (
                <Stack spacing={0}>{audit.audit.map((event, index) => <AuditTimelineItem key={event.id} event={event} isLast={index === audit.audit.length - 1} />)}</Stack>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
    </Drawer>

    <DailyBreakdownDrawer
      open={breakdownOpen}
      onClose={() => setBreakdownOpen(false)}
      sourceItemId={activeItemId}
      equipmentId={item?.equipment_id || ""}
      equipmentKode={item?.equipment_kode || item?.equipment_abbr || ""}
      equipmentKategori={equipmentKategori}
      cabangId={item?.cabang_id}
      karyawanId={item?.operator_id || ""}
      karyawanName={item?.operator_nama || ""}
      intervalStart={item?.start_time}
      intervalFinish={item?.finish_time}
      onSuccess={async () => {
        setStatusSwitch("breakdown");
        await Promise.all([revalidateFleetData(), audit.mutate()]);
        onClose?.();
      }}
    />
    </>
  );
}
