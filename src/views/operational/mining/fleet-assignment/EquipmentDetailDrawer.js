"use client";

import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

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

import {
  useFleetEquipmentAudit,
  updateEquipmentStatus,
  revalidateFleetData,
  useFleetKegiatanOptions,
  useFleetMaterialOptions,
} from "api/fleet-assignment";
import { formatDateTime, statusColor, statusGradient, statusGlow, statusLabel } from "./shared";
import DailyBreakdownDrawer from "./DailyBreakdownDrawer";

const parseActivityTime = (value) => {
  if (!value) return null;
  const parsed = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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

export default function EquipmentDetailDrawer({ item, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const equipmentId = item?.equipment_id || "";
  const audit = useFleetEquipmentAudit(
    equipmentId,
    { date_ops: item?.date_ops || "", days: 3, future_days: 1 },
    Boolean(open && equipmentId && item?.date_ops)
  );

  const [statusSwitch, setStatusSwitch] = useState(() => String(item?.status || "").toLowerCase() || "beroperasi");
  const [activeItemId, setActiveItemId] = useState(() => item?.item_id || "");
  const [pendingStatus, setPendingStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const equipmentKategori = String(item?.equipment_kategori || item?.ctgunit || "").toUpperCase();
  const intervalStart = parseActivityTime(item?.start_time);
  const intervalFinish = parseActivityTime(item?.finish_time);
  const currentTime = new Date();
  const breakdownAllowed = Boolean(intervalStart && intervalFinish && currentTime >= intervalStart && currentTime <= intervalFinish);
  const needsKegiatan = pendingStatus === "beroperasi" || pendingStatus === "standby";
  const needsMaterial = pendingStatus === "beroperasi";

  const kegiatanSWR = useFleetKegiatanOptions(
    { kategori: equipmentKategori, status: pendingStatus || "" },
    Boolean(open && needsKegiatan && equipmentKategori)
  );
  const materialSWR = useFleetMaterialOptions(Boolean(open && needsMaterial));

  const kegiatanOptions = kegiatanSWR.options || [];
  const materialOptions = materialSWR.options || [];

  useEffect(() => {
    const currentStatus = String(item?.status || "").toLowerCase() || "beroperasi";
    setStatusSwitch(currentStatus);
    setActiveItemId(item?.item_id || "");
    setPendingStatus(null);
    setSelectedKegiatan(null);
    setSelectedMaterial(null);
  }, [item]);

  const handleStatusSelect = (_, newValue) => {
    if (!newValue || newValue === statusSwitch || saving) return;
    if (newValue === "breakdown") {
      setBreakdownOpen(true);
      return;
    }
    setPendingStatus(newValue);
    setSelectedKegiatan(null);
    setSelectedMaterial(null);
  };

  const handleSave = async () => {
    if (!pendingStatus) return;
    if (needsKegiatan && !selectedKegiatan) {
      enqueueSnackbar("Kegiatan wajib dipilih", { variant: "error" });
      return;
    }
    if (needsMaterial && !selectedMaterial) {
      enqueueSnackbar("Material wajib dipilih", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const result = await updateEquipmentStatus(activeItemId, pendingStatus, null, {
        equipment_id: equipmentId,
        kegiatan_id: selectedKegiatan?.id || null,
        kegiatan_name: selectedKegiatan?.nama || null,
        material_id: selectedMaterial?.id || null,
        material_name: selectedMaterial?.nama || null,
      });
      enqueueSnackbar(`Status berhasil diubah ke ${pendingStatus}`, { variant: "success" });
      setActiveItemId(result?.item_id || activeItemId);
      setStatusSwitch(pendingStatus);
      setPendingStatus(null);
      setSelectedKegiatan(null);
      setSelectedMaterial(null);
      await Promise.all([revalidateFleetData(), audit.mutate()]);
      onClose?.();
    } catch (error) {
      const msg = error?.diagnostic?.message || error?.response?.data?.diagnostic?.message || error?.message || "Gagal mengubah status";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingStatus(null);
    setSelectedKegiatan(null);
    setSelectedMaterial(null);
  };

  const code = item?.equipment_abbr || item?.equipment_kode || item?.kode || "-";
  const status = String(item?.status || "").toLowerCase();
  const color = statusColor(status);
  const gradient = statusGradient(status);
  const glow = statusGlow(status);
  const isHE = equipmentKategori === "HE";
  const TypeIcon = isHE ? PrecisionManufacturingIcon : LocalShippingIcon;
  const canSave = pendingStatus && (!needsKegiatan || selectedKegiatan) && (!needsMaterial || selectedMaterial);

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
              <ToggleButtonGroup value={pendingStatus || statusSwitch} exclusive onChange={handleStatusSelect} fullWidth disabled={saving} sx={{ gap: 1, position: "relative", "& .MuiToggleButtonGroup-grouped": { mr: 1, border: 1, borderColor: "divider", borderRadius: "8px !important", "&:last-child": { mr: 0 } }, "& .MuiToggleButton-root": { py: 1.25, fontWeight: 700, gap: 0.75, textTransform: "none", fontSize: "0.875rem" } }}>
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
            </Box>

            {/* Kegiatan & Material Selection (muncul saat pendingStatus) */}
            {pendingStatus && pendingStatus !== "breakdown" && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>
                  Konfirmasi Perubahan Status
                </Typography>
                <Stack spacing={2}>
                  {needsKegiatan && (
                    <Autocomplete
                      fullWidth
                      options={kegiatanOptions}
                      value={selectedKegiatan}
                      onChange={(_, val) => setSelectedKegiatan(val)}
                      loading={kegiatanSWR.isLoading}
                      noOptionsText={kegiatanSWR.error ? "Gagal memuat kegiatan" : "Tidak ada kegiatan yang sesuai"}
                      getOptionLabel={(opt) => opt?.nama || ""}
                      isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                      renderInput={(params) => <TextField {...params} label="Kegiatan" required size="small" />}
                    />
                  )}
                  {needsMaterial && (
                    <Autocomplete
                      fullWidth
                      options={materialOptions}
                      value={selectedMaterial}
                      onChange={(_, val) => setSelectedMaterial(val)}
                      loading={materialSWR.isLoading}
                      noOptionsText={materialSWR.error ? "Gagal memuat material" : "Tidak ada material"}
                      getOptionLabel={(opt) => opt?.nama || ""}
                      isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                      renderInput={(params) => <TextField {...params} label="Material" required size="small" />}
                    />
                  )}
                  <Stack direction="row" spacing={1.5}>
                    <Button fullWidth variant="outlined" color="error" onClick={handleCancel} disabled={saving}>Batal</Button>
                    <Button fullWidth variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !canSave}>
                      {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null} Simpan
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            <Divider />

            {/* Operational Info */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>Operational Details</Typography>
              <Grid container spacing={1.25}>
                <Grid item xs={12} sm={6}><InfoTile icon={<PersonIcon fontSize="small" />} label="Operator" value={item?.operator_nama ? `${item.operator_nama} (${item.operator_nik || "-"})` : "-"} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Kegiatan" value={item?.kegiatan_name} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<LocationOnIcon fontSize="small" />} label="Lokasi Pit" value={item?.lokasi_pit_nama} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<LocationOnIcon fontSize="small" />} label="Lokasi Site" value={item?.lokasi_site_nama} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<ScheduleIcon fontSize="small" />} label="Waktu Mulai" value={formatDateTime(item?.start_time)} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<ScheduleIcon fontSize="small" />} label="Waktu Selesai" value={formatDateTime(item?.finish_time)} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<BuildIcon fontSize="small" />} label="Material" value={item?.material_name} /></Grid>
                <Grid item xs={12} sm={6}><InfoTile icon={<ScheduleIcon fontSize="small" />} label="Tanggal / Shift" value={item?.date_ops ? `${item.date_ops} · Shift ${item.shift_id || "-"}` : "-"} /></Grid>
              </Grid>
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
