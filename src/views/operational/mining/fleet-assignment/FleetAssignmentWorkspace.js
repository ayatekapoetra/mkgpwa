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
import Typography from "@mui/material/Typography";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SpeedIcon from "@mui/icons-material/Speed";

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
  statusGradient,
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
    { key: "total", label: "Total Armada", caption: "Unit terpantau", value: summary.total, icon: <SpeedIcon />, accent: "#2767a8", soft: "#edf5ff" },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1 }}>
      {cards.map((card) => {
        const percentage = card.key === "total" ? (total > 0 ? 100 : 0) : total > 0 ? Math.round((Number(card.value) || 0) / total * 100) : 0;
        return (
          <Card
            key={card.key}
            elevation={0}
            sx={{
              background: `linear-gradient(145deg, #ffffff 0%, ${card.soft} 145%)`,
              color: "#17212b",
              borderRadius: 2,
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(28,43,56,0.09)",
              boxShadow: "0 5px 16px rgba(24,39,52,0.07)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              "&::before": { content: '""', position: "absolute", inset: "0 auto 0 0", width: 4, bgcolor: card.accent },
              "&::after": { content: '""', position: "absolute", width: 70, height: 70, borderRadius: "50%", right: -28, top: -35, bgcolor: card.soft, opacity: 0.9 },
              "&:hover": { transform: "translateY(-3px)", borderColor: card.accent, boxShadow: "0 10px 25px rgba(24,39,52,0.12)" },
            }}
          >
            <CardContent sx={{ p: 1.35, pl: 1.65, position: "relative", zIndex: 1, "&:last-child": { pb: 1.35 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "#65717c", fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase" }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ color: "#929aa1", fontSize: "0.58rem", mt: 0.15 }} noWrap>
                    {card.caption}
                  </Typography>
                </Box>
                <Box sx={{ width: 30, height: 30, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: card.soft, color: card.accent, flexShrink: 0, "& svg": { fontSize: 17 } }}>
                  {card.icon}
                </Box>
              </Stack>

              <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography sx={{ color: "#17212b", fontSize: "1.65rem", fontWeight: 900, lineHeight: 0.95, letterSpacing: -0.7 }}>
                  {loading ? <CircularProgress size={20} sx={{ color: card.accent }} /> : card.value}
                </Typography>
                <Typography sx={{ color: card.accent, fontSize: "0.62rem", fontWeight: 900 }}>
                  {percentage}%
                </Typography>
              </Stack>

              <Box sx={{ mt: 1.05, height: 3, borderRadius: 3, bgcolor: "rgba(31,46,59,0.08)", overflow: "hidden" }}>
                <Box sx={{ width: `${percentage}%`, height: "100%", borderRadius: 3, bgcolor: card.accent, transition: "width 0.35s ease" }} />
              </Box>
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
  const gradient = statusGradient(status);
  const glow = statusGlow(status);
  const code = item.equipment_abbr || item.equipment_kode || item.kode || item.code || item.kdunit || "-";
  const isHE = String(item.equipment_kategori || item.ctgunit || "").toUpperCase() === "HE";
  const Icon = isHE ? PrecisionManufacturingIcon : LocalShippingIcon;
  const activity = item.kegiatan_name || "Belum ada kegiatan";
  const operator = item.operator_nama || "Belum ada operator";
  const tilt = (String(code).split("").reduce((total, char) => total + char.charCodeAt(0), 0) % 3 - 1) * 0.45;

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Buka detail ${code}, status ${statusLabel(status)}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      sx={{
        background: "linear-gradient(145deg, #fffef9 0%, #f2eee1 100%)",
        color: "#18232f",
        borderRadius: "5px 5px 10px 10px",
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(41, 51, 62, 0.16)",
        boxShadow: "0 2px 2px rgba(0,0,0,0.16), 0 9px 18px rgba(0,0,0,0.22)",
        transform: `rotate(${tilt}deg)`,
        transformOrigin: "50% 8px",
        transition: "transform 0.22s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.22s ease",
        "&:hover": { transform: "translateY(-5px) rotate(0deg)", boxShadow: `0 14px 28px rgba(0,0,0,0.3), ${glow}` },
        "&:focus-visible": { outline: "3px solid", outlineColor: `${color}.light`, outlineOffset: 3, transform: "rotate(0deg)" },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: gradient,
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 9,
          left: "50%",
          width: 9,
          height: 9,
          borderRadius: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle at 35% 30%, #fff 0%, #aeb5bb 28%, #4e5963 72%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.45)",
          zIndex: 2,
        },
      }}
    >
      <Box sx={{ px: 1.6, pt: 2.7, pb: 1.2, display: "flex", alignItems: "flex-start", gap: 1.2 }}>
        <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 1.5, background: gradient, display: "grid", placeItems: "center", color: "#fff", boxShadow: glow }}>
          <Icon sx={{ fontSize: 23 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={900} fontSize="1.05rem" lineHeight={1.15} noWrap sx={{ letterSpacing: 0.25 }}>
            {code}
          </Typography>
          <Typography sx={{ color: "#69737c", fontSize: "0.68rem", mt: 0.3 }} noWrap>
            {item.equipment_model || item.equipment_nama || (isHE ? "Heavy Equipment" : "Dump Truck")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 1.6, py: 0.8, bgcolor: "rgba(38,50,61,0.055)", borderTop: "1px solid rgba(55,66,76,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ color: "#778088", fontSize: "0.61rem", fontWeight: 700 }}>INTERVAL</Typography>
        <Typography sx={{ fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.2 }}>
          {formatTime(item.start_time)} - {formatTime(item.finish_time)}
        </Typography>
      </Box>
    </Box>
  );
}

function MatrixSkeleton() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={188} sx={{ borderRadius: 1.5 }} />
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
          <Box
            sx={{
              width: quickSearchOpen ? { xs: "100%", sm: 270 } : 40,
              flex: quickSearchOpen ? { xs: 1, md: "0 0 auto" } : "0 0 40px",
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuickSearchOpen(false)} aria-label="Tutup pencarian">
                        <CloseIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
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
            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFilterOpen(true)} sx={{ borderRadius: 2, px: 2.5, whiteSpace: "nowrap" }}>
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </Badge>
        </Stack>
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
          divider={false}
          contentSX={{ p: 0, "&:last-child": { pb: 0 } }}
        >
          <Box sx={{ p: { xs: 1.5, md: 2 } }}>
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
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
                  gap: { xs: 2, md: 2.4 },
                  p: { xs: 2, md: 3 },
                  borderRadius: 2.5,
                  // backgroundColor: "#26343d",
                  // backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(135deg, rgba(255,255,255,0.025), transparent 55%)",
                  // backgroundSize: "12px 12px, 100% 100%",
                  // border: "8px solid #46545c",
                  // boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.3), inset 0 12px 30px rgba(0,0,0,0.18), 0 8px 24px rgba(20,30,38,0.16)",
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
      />
    </Stack>
  );
}
