"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import AddIcon from "@mui/icons-material/Add";

import MainCard from "components/MainCard";
import {
  fleetErrorMessage,
  useFleetAssignmentAccess,
  useFleetMatrix,
  useFleetSummary,
} from "api/fleet-assignment";
import {
  localDate,
  statusColor,
  statusGlow,
  statusLabel,
  formatTime,
  countActiveFilters,
} from "./shared";
import FleetAssignmentFilter from "./filter";
import EquipmentDetailDrawer from "./EquipmentDetailDrawer";

function SummaryCard({ summary, loading }) {
  const total = Number(summary.total) || 0;
  const cards = [
    { key: "beroperasi", label: "Beroperasi", caption: "Unit produktif", value: summary.beroperasi, icon: <CheckCircleIcon />, accent: "#16844a", soft: "#eaf8f0" },
    { key: "standby", label: "Standby", caption: "Menunggu aktivitas", value: summary.standby, icon: <WarningAmberIcon />, accent: "#c66b08", soft: "#fff5e5" },
    { key: "breakdown", label: "Breakdown", caption: "Perlu penanganan", value: summary.breakdown, icon: <ErrorOutlineIcon />, accent: "#c53c3c", soft: "#fff0ef" },
    { key: "nostatus", label: "Tanpa Status", caption: "Belum dilaporkan", value: summary.nostatus, icon: <HelpOutlineIcon />, accent: "#68737d", soft: "#f0f3f5" },
    { key: "total", label: "Total Armada", caption: "Unit terpantau", value: summary.total, icon: <SpeedIcon />, accent: "#2767a8", soft: "#edf5ff" },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: 0.75 }}>
      {cards.map((card) => {
        const percentage = card.key === "total" ? (total > 0 ? 100 : 0) : total > 0 ? Math.round((Number(card.value) || 0) / total * 100) : 0;
        const isTotal = card.key === "total";
        return (
          <Card
            key={card.key}
            elevation={0}
            sx={{
              background: `linear-gradient(145deg, #ffffff 0%, ${card.soft} 145%)`,
              color: "#17212b",
              borderRadius: 1.5,
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(28,43,56,0.09)",
              boxShadow: isTotal ? "0 4px 12px rgba(39,103,168,0.12)" : "0 3px 10px rgba(24,39,52,0.06)",
              gridColumn: { xs: isTotal ? "span 2" : "auto", sm: "auto" },
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              "&::before": { content: '""', position: "absolute", inset: "0 auto 0 0", width: 4, bgcolor: card.accent },
              "&::after": { content: '""', position: "absolute", width: 48, height: 48, borderRadius: "50%", right: -19, top: -24, bgcolor: card.soft, opacity: 0.9 },
              "&:hover": { transform: "translateY(-2px)", borderColor: card.accent, boxShadow: "0 7px 18px rgba(24,39,52,0.1)" },
            }}
          >
            <CardContent sx={{ p: 1, pl: 1.35, position: "relative", zIndex: 1, "&:last-child": { pb: 1 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.75}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "#65717c", fontSize: "0.58rem", fontWeight: 800, letterSpacing: 0.55, textTransform: "uppercase" }} noWrap>
                    {card.label}
                  </Typography>
                  <Typography sx={{ color: "#17212b", fontSize: "1.35rem", fontWeight: 900, lineHeight: 1.05, mt: 0.25, letterSpacing: -0.5 }}>
                    {loading ? <CircularProgress size={16} sx={{ color: card.accent }} /> : card.value}
                  </Typography>
                </Box>
                <Box sx={{ width: 28, height: 28, borderRadius: 1.15, display: "grid", placeItems: "center", bgcolor: card.soft, color: card.accent, flexShrink: 0, "& svg": { fontSize: 16 } }}>
                  {card.icon}
                </Box>
              </Stack>

              <Box sx={{ mt: 0.7, height: 2, borderRadius: 3, bgcolor: "rgba(31,46,59,0.08)", overflow: "hidden" }}>
                <Box sx={{ width: `${percentage}%`, height: "100%", borderRadius: 3, bgcolor: card.accent, transition: "width 0.35s ease" }} />
              </Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.35 }}>
                <Typography sx={{ color: "#929aa1", fontSize: "0.52rem" }} noWrap>{card.caption}</Typography>
                <Typography sx={{ color: card.accent, fontSize: "0.55rem", fontWeight: 900 }}>{percentage}%</Typography>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

function EquipmentCard({ item, onClick }) {
  const status = String(item.status || "").toLowerCase();
  const color = statusColor(status);
  const glow = statusGlow(status);
  const code = item.equipment_abbr || item.equipment_kode || item.kode || item.code || item.kdunit || "-";
  const category = String(item.equipment_kategori || item.ctgunit || "-").toUpperCase();
  const shortStatus = status === "beroperasi" ? "WORK" : status === "standby" ? "STAN" : status === "breakdown" ? "B-DOWN" : statusLabel(status).toUpperCase();
  const background = status === "breakdown"
    ? "linear-gradient(145deg, rgba(211,47,47,0.05), rgba(211,47,47,0.13))"
    : "none";

  return (
    <Tooltip title={`${item.equipment_model || item.equipment_nama || category} · ${item.kegiatan_name || "Belum ada kegiatan"} · ${formatTime(item.start_time)}-${formatTime(item.finish_time)}`} arrow>
      <Box
        role="button"
        tabIndex={0}
        aria-label={`Buka detail ${code}, status ${statusLabel(status)}`}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
        sx={{
          height: 76,
          minWidth: 0,
          px: 0.7,
          py: 0.85,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          borderRadius: 1.4,
          border: 2,
          borderColor: `${color}.main`,
          background,
          boxShadow: `0 3px 9px rgba(24,39,52,0.09), ${glow}`,
          transition: "transform 0.16s ease, box-shadow 0.16s ease",
          "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 17px rgba(24,39,52,0.15), ${glow}` },
          "&:focus-visible": { outline: "3px solid", outlineColor: `${color}.light`, outlineOffset: 2 },
        }}
      >
        <Typography sx={{ position: "absolute", top: 4, right: 5, color: `${color}.dark`, fontSize: "0.48rem", fontWeight: 900 }}>{category}</Typography>
        <Typography sx={{ width: "100%", textAlign: "center", fontSize: "0.72rem", fontWeight: 900, lineHeight: 1.1, mt: 0.3 }} noWrap>{code}</Typography>
        <Typography sx={{ mt: 0.75, color: `${color}.dark`, fontSize: "0.58rem", fontWeight: 900, letterSpacing: 0.45 }}>{shortStatus}</Typography>
      </Box>
    </Tooltip>
  );
}

function MatrixSkeleton() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(6, minmax(0, 1fr))", md: "repeat(8, minmax(0, 1fr))", lg: "repeat(12, minmax(0, 1fr))" }, gap: 0.8 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 1.4 }} />
      ))}
    </Box>
  );
}

export default function FleetAssignmentWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const access = useFleetAssignmentAccess();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [scope, setScope] = useState({
    date_ops: searchParams.get("date_ops") || localDate(),
    shift_id: searchParams.get("shift_id") || "",
    area: searchParams.get("area") || "",
    lokasi_site_id: searchParams.get("lokasi_site_id") || "",
    ctgunit: searchParams.get("ctgunit") || "",
    status: searchParams.get("status") || "",
    search: searchParams.get("search") || "",
  });

  useEffect(() => {
    const query = new URLSearchParams({ ...scope });
    Array.from(query.entries()).forEach(([key, value]) => !value && query.delete(key));
    router.replace(`/fleet-assignment?${query}`, { scroll: false });
  }, [router, scope]);

  const matrixParams = useMemo(() => ({
    date_ops: scope.date_ops, shift_id: scope.shift_id, area: scope.area,
    lokasi_site_id: scope.lokasi_site_id, ctgunit: scope.ctgunit,
    status: scope.status, search: scope.search, perPage: 1000,
  }), [scope]);

  const summaryParams = useMemo(() => ({
    date_ops: scope.date_ops, shift_id: scope.shift_id, area: scope.area,
    lokasi_site_id: scope.lokasi_site_id, ctgunit: scope.ctgunit,
  }), [scope]);

  const enabled = access.permissions.read && Boolean(scope.date_ops);
  const matrix = useFleetMatrix(matrixParams, enabled);
  const summary = useFleetSummary(summaryParams, enabled);
  const activeFilterCount = countActiveFilters(scope);

  const quickSearchLower = quickSearch.trim().toLowerCase();
  const filteredData = useMemo(() => {
    if (!quickSearchLower) return matrix.matrix.data;
    return matrix.matrix.data.filter((item) =>
      String(item.equipment_kode || "").toLowerCase().includes(quickSearchLower) ||
      String(item.equipment_abbr || "").toLowerCase().includes(quickSearchLower) ||
      String(item.equipment_nama || "").toLowerCase().includes(quickSearchLower) ||
      String(item.operator_nama || "").toLowerCase().includes(quickSearchLower) ||
      String(item.operator_nik || "").toLowerCase().includes(quickSearchLower)
    );
  }, [matrix.matrix.data, quickSearchLower]);

  if (access.accessLoading)
    return <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>;
  if (access.accessError || !access.permissions.read)
    return <Alert severity="error">Akses Fleet Assignment tidak tersedia. Data dan aksi ditutup secara default.</Alert>;

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <GridViewOutlinedIcon color="primary" />
            <Typography variant="h4" fontWeight={700}>Fleet Assignment</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time equipment status matrix dari Daily Activity
          </Typography>
        </Box>
      </Stack>

      <FleetAssignmentFilter
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        scope={scope}
        setScope={setScope}
      />

      {!enabled && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>Pilih tanggal operasi untuk memuat matrix equipment.</Alert>
      )}

      {enabled && (
        <MainCard
          title={(
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/fleet-assignment/create")} disabled={!access.permissions.insert} sx={{ borderRadius: 1.5, whiteSpace: "nowrap" }}>
              Add Data
            </Button>
          )}
          secondary={(
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ width: "100%" }}>
              <Box
                sx={{
                  width: quickSearchOpen ? { xs: "100%", sm: 270 } : 40,
                  flex: quickSearchOpen ? { xs: 1, sm: "0 0 auto" } : "0 0 40px",
                  display: "flex",
                  justifyContent: "flex-end",
                  transition: "width 0.24s cubic-bezier(0.2,0.8,0.2,1)",
                }}
              >
                {quickSearchOpen ? (
                  <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    placeholder="Cari equipment / operator..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setQuickSearchOpen(false)} aria-label="Tutup pencarian"><CloseIcon sx={{ fontSize: 17 }} /></IconButton></InputAdornment>,
                      sx: { borderRadius: 5, bgcolor: "background.paper", pr: 0.4 },
                    }}
                  />
                ) : (
                  <IconButton
                    aria-label="Buka pencarian equipment"
                    onClick={() => setQuickSearchOpen(true)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 1,
                      borderColor: quickSearch ? "primary.main" : "divider",
                      bgcolor: quickSearch ? "primary.main" : "background.paper",
                      color: quickSearch ? "primary.contrastText" : "text.secondary",
                      boxShadow: quickSearch ? "0 5px 14px rgba(25,118,210,0.25)" : "none",
                      "&:hover": { bgcolor: quickSearch ? "primary.dark" : "action.hover" },
                    }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Badge color="primary" variant="dot" invisible={activeFilterCount === 0}>
                <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFilterOpen(true)} sx={{ borderRadius: 1.5, px: { xs: 1.5, sm: 2.5 }, whiteSpace: "nowrap" }}>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </Badge>
            </Stack>
          )}
          divider
          contentSX={{ p: 0, "&:last-child": { pb: 0 } }}
          sx={{
            "& .MuiCardHeader-root": { p: { xs: 1.5, sm: 2 }, flexWrap: { xs: "wrap", sm: "nowrap" }, gap: 1 },
            "& .MuiCardHeader-content": { flex: { xs: "1 0 auto", sm: "1 1 auto" } },
            "& .MuiCardHeader-action": { width: { xs: "100%", sm: "auto" }, ml: { xs: 0, sm: "auto" } },
          }}
        >
          <Box sx={{ p: { xs: 1, sm: 1.25 } }}>
            <SummaryCard summary={summary.summary} loading={summary.isLoading} />
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            {summary.error && (
              <Alert severity="warning" sx={{ mb: 2 }}>{fleetErrorMessage(summary.error, "Gagal memuat ringkasan.")}</Alert>
            )}
            {matrix.error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {fleetErrorMessage(matrix.error, "Gagal memuat matrix equipment.")}
              </Alert>
            )}
            {matrix.isLoading ? (
              <MatrixSkeleton />
            ) : !filteredData.length ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <GridViewOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">{quickSearchLower ? `Tidak ada equipment cocok dengan "${quickSearch}".` : "Tidak ada equipment untuk filter ini."}</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(6, minmax(0, 1fr))", md: "repeat(8, minmax(0, 1fr))", lg: "repeat(12, minmax(0, 1fr))" },
                  gap: 0.8,
                  p: { xs: 0.5, md: 1 },
                  borderRadius: 2.5,
                }}
              >
                {filteredData.map((item, index) => (
                  <EquipmentCard
                    key={item.item_id || item.equipment_id || index}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </Box>
            )}
          </Box>
        </MainCard>
      )}

      <EquipmentDetailDrawer
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        canUpdate={access.permissions.update}
      />
    </Stack>
  );
}
