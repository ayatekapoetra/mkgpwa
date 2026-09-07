"use client";

import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import {
  ArrowRight,
  Calendar,
  DocumentText,
  Filter,
  MinusCirlce,
  Refresh,
  SearchNormal,
  User,
} from "iconsax-react";

import { useMonitoringSparepartStockMovements } from "api/monitoring-sparepart-stock";
import { formatQuantity } from "./list";

const display = (value, fallback = "-") =>
  value === undefined || value === null || value === "" ? fallback : value;
const historyQuantity = (value) =>
  value === undefined || value === null || value === ""
    ? "-"
    : formatQuantity(value);
const sourceTypes = {
  GOODS_RECEIPT: { label: "Receipt", color: "success" },
  TRANSFER_IN: { label: "Transfer In", color: "success" },
  TRANSFER_OUT: { label: "Transfer Out", color: "warning" },
  TRANSFER_CANCEL: { label: "Cancel", color: "info" },
  GOODS_ISSUE: { label: "Issue", color: "error" },
  ISSUE_VOID: { label: "Void", color: "info" },
  ISSUE_REVISE: { label: "Revise", color: "info" },
  UNKNOWN: { label: "Unknown", color: "default" },
};
const errorMessage = (error) =>
  error?.response?.data?.diagnostic?.message ||
  error?.diagnostic?.message ||
  error?.message ||
  "Gagal memuat movement history.";

const FilterToggleBtn = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
  fontSize: "0.8rem",
  fontWeight: 600,
}));

export default function MonitoringSparepartStockDetail({ context, onClose }) {
  const [showFilter, setShowFilter] = useState(false);
  const [draft, setDraft] = useState({
    date_from: "",
    date_to: "",
    search_narasi: "",
    search_user: "",
    perPage: 25,
  });
  const [applied, setApplied] = useState({
    date_from: "",
    date_to: "",
    search_narasi: "",
    search_user: "",
    perPage: 25,
    page: 1,
  });

  useEffect(() => {
    setDraft({
      date_from: "",
      date_to: "",
      search_narasi: "",
      search_user: "",
      perPage: 25,
    });
    setApplied({
      date_from: "",
      date_to: "",
      search_narasi: "",
      search_user: "",
      perPage: 25,
      page: 1,
    });
  }, [context]);

  const result = useMonitoringSparepartStockMovements(context, applied);
  const orderUom = context?.order_uom || "";
  const usedUom = context?.used_uom || "";
  const hasDualUom =
    orderUom && usedUom && orderUom.toUpperCase() !== usedUom.toUpperCase();
  const activeFilterCount = [
    "date_from",
    "date_to",
    "search_narasi",
    "search_user",
  ].filter((k) => Boolean(applied[k])).length;

  const applyFilter = () => {
    setApplied({ ...draft, page: 1 });
    setShowFilter(false);
  };
  const resetFilter = () => {
    const clean = {
      date_from: "",
      date_to: "",
      search_narasi: "",
      search_user: "",
      perPage: applied.perPage,
    };
    setDraft(clean);
    setApplied({ ...clean, page: 1 });
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(context)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100vw", md: 620 },
          maxWidth: "100%",
          height: "100%",
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Box>
            <Typography variant="h5">Movement History</Typography>
            <Typography variant="caption" color="text.secondary">
              Audit trail perubahan stock
            </Typography>
          </Box>
          <IconButton aria-label="Tutup movement history" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />

        {/* Item info + current stock */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: "action.hover",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="overline" color="primary.main" fontWeight={700}>
            {display(context?.item_code)}
          </Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
            {display(context?.item_name)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {display(context?.part_number, "Tanpa part number")} |{" "}
            {display(context?.warehouse_code || context?.warehouse_name)} | Rack{" "}
            {display(context?.rack_code)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                bgcolor: "background.paper",
                flex: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.2, display: "block" }}
              >
                Current (Order)
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatQuantity(context?.stock_order)}{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {orderUom}
                </Typography>
              </Typography>
            </Box>
            {hasDualUom ? (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  flex: 1,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.2, display: "block" }}
                >
                  Current (Pakai)
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="secondary.main"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatQuantity(context?.stock_used)}{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {usedUom}
                  </Typography>
                </Typography>
              </Box>
            ) : null}
            {/* Filter toggle bar */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              sx={{ px: 2, py: 1 }}
            >
              <FilterToggleBtn
                size="small"
                color={activeFilterCount ? "primary" : "inherit"}
                variant={activeFilterCount ? "contained" : "outlined"}
                startIcon={
                  showFilter ? <MinusCirlce size={16} /> : <Filter size={16} />
                }
                onClick={() => setShowFilter((v) => !v)}
              >
                {showFilter ? "Hide" : "Filter"}
                {activeFilterCount ? ` (${activeFilterCount})` : ""}
              </FilterToggleBtn>
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={() => result.retry()}
                  disabled={result.refreshing}
                >
                  <Refresh size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Collapsible filter panel */}
        <Collapse in={showFilter}>
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  size="small"
                  type="date"
                  label="Dari Tanggal"
                  value={draft.date_from}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, date_from: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  size="small"
                  type="date"
                  label="Sampai Tanggal"
                  value={draft.date_to}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, date_to: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <TextField
                size="small"
                fullWidth
                label="Cari Narasi"
                value={draft.search_narasi}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    search_narasi: e.target.value.slice(0, 200),
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchNormal size={16} />
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  size="small"
                  fullWidth
                  label="Cari User"
                  value={draft.search_user}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      search_user: e.target.value.slice(0, 200),
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={16} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  size="small"
                  label="Rows"
                  value={draft.perPage}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, perPage: Number(e.target.value) }))
                  }
                  sx={{ minWidth: 100 }}
                >
                  {[25, 50, 100].map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={resetFilter}
                >
                  Reset
                </Button>
                <Button size="small" variant="contained" onClick={applyFilter}>
                  Apply
                </Button>
              </Stack>
            </Stack>
          </Box>
          <Divider />
        </Collapse>

        {result.refreshing ? <LinearProgress /> : null}

        {/* History list */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {result.loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              sx={{ minHeight: 240 }}
            >
              <CircularProgress />
              <Typography color="text.secondary">
                Memuat movement history...
              </Typography>
            </Stack>
          ) : null}
          {!result.loading && result.error ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => result.retry()}
                >
                  Retry
                </Button>
              }
            >
              {errorMessage(result.error)}
            </Alert>
          ) : null}
          {!result.loading && !result.error && !result.data.length ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
              <DocumentText size={36} />
              <Typography variant="subtitle1">Belum ada movement</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Riwayat perubahan stock untuk item dan rack ini belum tersedia.
              </Typography>
            </Stack>
          ) : null}

          {!result.loading && !result.error && result.data.length ? (
            <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
              {result.data.map((movement, index) => {
                const source =
                  sourceTypes[movement.source_type] || sourceTypes.UNKNOWN;
                const delta = Number(movement.qty_delta);
                const deltaUsed =
                  movement.qty_delta_used != null
                    ? Number(movement.qty_delta_used)
                    : null;
                const isPositive = delta >= 0;
                const mvtUom = movement.uom || orderUom;
                const mvtUsedUom = movement.used_uom || usedUom || mvtUom;
                const showDual =
                  hasDualUom &&
                  mvtUom &&
                  mvtUsedUom &&
                  mvtUom.toUpperCase() !== mvtUsedUom.toUpperCase();
                const isLast = index === result.data.length - 1;
                return (
                  <Stack
                    key={movement.id ?? index}
                    direction="row"
                    spacing={1.25}
                    sx={{ pb: 1.25 }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: isPositive ? "success.main" : "error.main",
                        flexShrink: 0,
                        mt: 0.75,
                      }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        pb: 1.25,
                        borderBottom: isLast ? "none" : "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {/* Row 1: badge + delta + date */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ flexWrap: "wrap", gap: 0.5 }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                        >
                          <Chip
                            size="small"
                            label={source.label}
                            color={source.color}
                            sx={{
                              height: 20,
                              "& .MuiChip-label": {
                                px: 0.75,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={isPositive ? "success.main" : "error.main"}
                            sx={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {isPositive ? "+" : ""}
                            {formatQuantity(delta)} {mvtUom}
                          </Typography>
                          {showDual && deltaUsed != null ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              ({isPositive ? "+" : ""}
                              {formatQuantity(deltaUsed)} {mvtUsedUom})
                            </Typography>
                          ) : null}
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{ flexShrink: 0 }}
                        >
                          <Calendar size={13} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.7rem" }}
                          >
                            {movement.created_at
                              ? new Date(movement.created_at).toLocaleString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "-"}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Row 2: qty before -> after — order + pakai berdampingan dalam container */}
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          sx={{
                            flex: 1,
                            justifyContent: "center",
                            bgcolor: "secondary.lighter",
                            borderRadius: 0.75,
                            py: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Order:
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: 600,
                            }}
                          >
                            {historyQuantity(movement.qty_before)}
                          </Typography>
                          <ArrowRight size={12} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: 700,
                            }}
                          >
                            {historyQuantity(movement.qty_after)}
                            {movement.qty_after == null ? "" : ` ${mvtUom}`}
                          </Typography>
                        </Stack>
                        {showDual &&
                        movement.qty_before_used != null &&
                        movement.qty_after_used != null ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{
                              flex: 1,
                              justifyContent: "center",
                              bgcolor: "secondary.lighter",
                              borderRadius: 0.75,
                              py: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Pakai:
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontVariantNumeric: "tabular-nums",
                                fontWeight: 600,
                              }}
                            >
                              {historyQuantity(movement.qty_before_used)}
                            </Typography>
                            <ArrowRight size={12} />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontVariantNumeric: "tabular-nums",
                                fontWeight: 700,
                              }}
                            >
                              {historyQuantity(movement.qty_after_used)}{" "}
                              {mvtUsedUom}
                            </Typography>
                          </Stack>
                        ) : null}
                      </Stack>

                      {/* Row 3: doc code + user berdampingan space-between */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mt: 0.5 }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <DocumentText size={13} />
                          <Typography variant="caption" fontWeight={600}>
                            {display(movement.source_doc_kode, "Tanpa kode")}
                          </Typography>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <User size={13} />
                          <Typography variant="caption" color="text.secondary">
                            {display(movement.created_by_name, "System")}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Row 4: narasi */}
                      {movement.narasi ? (
                        <Tooltip title={movement.narasi} arrow>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mt: 0.25,
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {movement.narasi}
                          </Typography>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          ) : null}
        </Box>

        {/* Footer — pagination only */}
        <Divider />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            {result.total > 0
              ? `${(result.page - 1) * result.perPage + 1}-${Math.min(result.page * result.perPage, result.total)} dari ${result.total.toLocaleString("id-ID")}`
              : "0 data"}
          </Typography>
          <Pagination
            count={result.lastPage}
            page={Math.min(result.page, result.lastPage)}
            onChange={(_, page) => setApplied((prev) => ({ ...prev, page }))}
            disabled={result.loading || result.refreshing}
            color="primary"
            showFirstButton
            showLastButton
            size="small"
          />
        </Stack>
      </Stack>
    </Drawer>
  );
}
