"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { CalendarEdit } from "iconsax-react";

import { fetchOutstanding, useOrderPaymentAccess } from "api/order-payments";
import {
  usePurchaseOrderCabang,
  usePurchaseOrderPemasok,
} from "api/purchase-orders";
import Paginate from "components/Paginate";
import { getSelectedOption } from "views/scm/purchasing-orders/utils";

import {
  formatDate,
  getDeliveryMeta,
  getDueDateMeta,
  getTerminLabel,
  getUnpayableReason,
  isRowPayable,
} from "./outstandingHelpers";
import { canRescheduleDueDate } from "./rescheduleDueDateHelpers";
import RescheduleDueDateModal from "./RescheduleDueDateModal";

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const truncate = (v, max = 50) => {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

const cellSx = {
  padding: "10px 12px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  borderBottom: "1px solid",
  borderColor: "divider",
};

const EMPTY_FILTERS = {
  kdfb: "",
  kdbayar: "",
  no_po: "",
  no_pd: "",
  pemasok_id: "",
  pemasok: "",
  metode: "",
  cabang_id: "",
  page: 1,
  limit: 25,
};

/**
 * Modal outstanding invoices with per-field filters + server paging.
 * Layout mirrors order-payment/list.js; action = checkbox.
 */
export default function OutstandingModal({
  open,
  bisnisId,
  excludeIds = [],
  onClose,
  onConfirm,
}) {
  const [checked, setChecked] = useState({}); // id -> row snapshot
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 25,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const { permissions } = useOrderPaymentAccess();
  const canReschedule = canRescheduleDueDate(permissions);

  const { rows: pemasok = [] } = usePurchaseOrderPemasok({}, open);
  const { rows: cabang = [] } = usePurchaseOrderCabang(
    { bisnis_id: bisnisId },
    open && Boolean(bisnisId),
  );

  const cabangOptions = useMemo(
    () =>
      cabang.filter(
        (row) =>
          !bisnisId ||
          !row.bisnis_id ||
          String(row.bisnis_id) === String(bisnisId),
      ),
    [cabang, bisnisId],
  );

  const load = useCallback(async () => {
    if (!open || !bisnisId) return;
    setLoading(true);
    try {
      const result = await fetchOutstanding({
        bisnis_id: bisnisId,
        page: applied.page,
        limit: applied.limit,
        kdfb: applied.kdfb || undefined,
        kdbayar: applied.kdbayar || undefined,
        no_po: applied.no_po || undefined,
        no_pd: applied.no_pd || undefined,
        pemasok_id: applied.pemasok_id || undefined,
        pemasok: applied.pemasok || undefined,
        metode: applied.metode || undefined,
        cabang_id: applied.cabang_id || undefined,
        exclude_ids: excludeIds.length ? excludeIds.join(",") : undefined,
      });
      setRows(result.rows || []);
      setMeta(result.meta || { page: 1, limit: 25, total: 0, total_pages: 1 });
    } catch (e) {
      setRows([]);
      setMeta({ page: 1, limit: 25, total: 0, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [open, bisnisId, applied, excludeIds]);

  useEffect(() => {
    if (open) {
      setFilters(EMPTY_FILTERS);
      setApplied(EMPTY_FILTERS);
      setChecked({});
    }
  }, [open, bisnisId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedRows = useMemo(() => Object.values(checked), [checked]);

  const isRowPayable = (r) => r.is_payable !== false && !r.disabled;

  const payableRows = useMemo(() => rows.filter(isRowPayable), [rows]);

  const pageSelectedCount = rows.filter((r) => checked[r.id]).length;

  const allPayableChecked =
    payableRows.length > 0 && payableRows.every((r) => checked[r.id]);

  const toggle = (row) => {
    if (!isRowPayable(row)) return;
    setChecked((prev) => {
      const next = { ...prev };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = row;
      return next;
    });
  };

  const togglePage = () => {
    setChecked((prev) => {
      const next = { ...prev };
      if (allPayableChecked) {
        payableRows.forEach((r) => {
          delete next[r.id];
        });
      } else {
        payableRows.forEach((r) => {
          next[r.id] = r;
        });
      }
      return next;
    });
  };

  const handleClose = () => {
    setChecked({});
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.(selectedRows);
    setChecked({});
  };

  const applyFilters = () => {
    setApplied({ ...filters, page: 1 });
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Pilih faktur outstanding
        <Typography variant="caption" color="text.secondary" display="block">
          Centang faktur (boleh beda pemasok, bisnis sama) lalu tambah ke alokasi
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Total data: <strong>{meta.total}</strong>
          {selectedRows.length
            ? ` · Terpilih: ${selectedRows.length}`
            : ""}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={1.5} mb={2}>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              size="small"
              fullWidth
              label="No. Faktur"
              value={filters.kdfb}
              onChange={setFilter("kdfb")}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              size="small"
              fullWidth
              label="Kode bayar"
              value={filters.kdbayar}
              onChange={setFilter("kdbayar")}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              size="small"
              fullWidth
              label="No. PO"
              value={filters.no_po}
              onChange={setFilter("no_po")}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              size="small"
              fullWidth
              label="No. PD"
              value={filters.no_pd}
              onChange={setFilter("no_pd")}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Autocomplete
              size="small"
              options={pemasok}
              value={getSelectedOption(pemasok, filters.pemasok_id)}
              getOptionLabel={(o) =>
                o.nama ? `${o.kode || ""} — ${o.nama}` : o.kode || ""
              }
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
              onChange={(_, o) =>
                setFilters((f) => ({
                  ...f,
                  pemasok_id: o?.id || "",
                  pemasok: "",
                }))
              }
              renderInput={(p) => <TextField {...p} label="Pemasok" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="Nama/kode pemasok"
              value={filters.pemasok}
              onChange={setFilter("pemasok")}
              disabled={Boolean(filters.pemasok_id)}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <TextField
              size="small"
              select
              fullWidth
              label="Metode"
              value={filters.metode}
              onChange={setFilter("metode")}
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="tunai">Tunai</MenuItem>
              <MenuItem value="kredit">Kredit</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <Autocomplete
              size="small"
              options={cabangOptions}
              value={getSelectedOption(cabangOptions, filters.cabang_id)}
              getOptionLabel={(o) => o.nama || o.name || o.kode || ""}
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
              onChange={(_, o) =>
                setFilters((f) => ({ ...f, cabang_id: o?.id || "" }))
              }
              renderInput={(p) => <TextField {...p} label="Cabang" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              size="small"
              select
              fullWidth
              label="Per halaman"
              value={filters.limit}
              onChange={setFilter("limit")}
            >
              {[10, 25, 50, 100].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={applyFilters} fullWidth>
                Cari
              </Button>
              <Button variant="outlined" onClick={resetFilters} fullWidth>
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {loading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress size={28} />
          </Box>
        ) : !rows.length ? (
          <Typography color="text.secondary" py={4} textAlign="center">
            Tidak ada faktur outstanding
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 1000,
                  borderCollapse: "collapse",
                  fontSize: 13,
                  "& th": {
                    ...cellSx,
                    backgroundColor: "background.default",
                    fontWeight: 700,
                    textAlign: "left",
                  },
                  "& td": cellSx,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>
                      <Checkbox
                        size="small"
                        checked={allPayableChecked}
                        indeterminate={
                          pageSelectedCount > 0 &&
                          pageSelectedCount < payableRows.length
                        }
                        onChange={togglePage}
                        disabled={!payableRows.length}
                      />
                    </th>
                    <th>Faktur</th>
                    <th>Pemasok</th>
                    <th>PO / PD</th>
                    <th>Jatuh Tempo & Termin</th>
                    <th>Status Pengiriman</th>
                    <th style={{ textAlign: "right" }}>Sisa Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const payable = isRowPayable(row);
                    const isOn = Boolean(checked[row.id]);
                    const dueMeta = getDueDateMeta(row);
                    const deliveryMeta = getDeliveryMeta(row);
                    const terminLabel = getTerminLabel(row);
                    const unpayableReason =
                      row.reason_unpayable ||
                      "Barang belum diterima (GRN pending), pelunasan belum dapat diproses kasir.";

                    return (
                      <tr
                        key={row.id}
                        style={{
                          opacity: payable ? 1 : 0.65,
                          backgroundColor: !payable
                            ? "rgba(0, 0, 0, 0.02)"
                            : "inherit",
                        }}
                      >
                        <td>
                          {payable ? (
                            <Checkbox
                              size="small"
                              checked={isOn}
                              onChange={() => toggle(row)}
                            />
                          ) : (
                            <Tooltip
                              title={unpayableReason}
                              arrow
                              placement="top"
                            >
                              <span>
                                <Checkbox size="small" checked={false} disabled />
                              </span>
                            </Tooltip>
                          )}
                        </td>
                        <td>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {row.kdfb || row.faktur_kode || `#${row.id}`}
                          </Typography>
                          {row.kdbayar ? (
                            <Typography
                              variant="caption"
                              color="primary"
                              noWrap
                              display="block"
                              fontWeight={600}
                              title={row.kdbayar}
                            >
                              {row.kdbayar}
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              display="block"
                            >
                              Belum ada kode bayar
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {formatDate(row.created_at)}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {row.pemasok_nama || "—"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                            title={row.pemasok_alamat || row.pemasok_kode || ""}
                          >
                            {truncate(row.pemasok_alamat, 50) ||
                              row.pemasok_kode ||
                              "—"}
                          </Typography>
                          <Chip
                            size="small"
                            label={row.metode || "—"}
                            color={
                              String(row.metode || "").toLowerCase() === "tunai"
                                ? "success"
                                : "default"
                            }
                            variant="outlined"
                            sx={{
                              mt: 0.5,
                              height: 20,
                              textTransform: "capitalize",
                              "& .MuiChip-label": { px: 1, fontSize: 11 },
                            }}
                          />
                        </td>
                        <td>
                          <Stack direction="column" spacing={0.5}>
                            {row.no_po ? (
                              <Typography variant="body2" noWrap fontWeight={700}>
                                {row.no_po}
                              </Typography>
                            ) : null}
                            {row.no_pd ? (
                              <Typography variant="body2" noWrap fontWeight={700}>
                                {row.no_pd}
                              </Typography>
                            ) : null}
                            {!row.no_po && !row.no_pd ? (
                              <Typography variant="body2" noWrap>
                                —
                              </Typography>
                            ) : null}
                            <Typography variant="body2" noWrap>
                              {row.bisnis_kode || row.bisnis_nama || "—"} *{" "}
                              {row.cabang_nama || "—"}
                            </Typography>
                          </Stack>
                        </td>
                        <td>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {dueMeta.dateFormatted}
                              </Typography>
                              {dueMeta.status !== "none" && (
                                <Chip
                                  size="small"
                                  label={dueMeta.label}
                                  color={dueMeta.color}
                                  variant={dueMeta.status === "safe" ? "outlined" : "filled"}
                                  sx={{
                                    mt: 0.5,
                                    height: 20,
                                    fontSize: 11,
                                    "& .MuiChip-label": { px: 1 },
                                  }}
                                />
                              )}
                              {terminLabel && (
                                <Typography
                                  variant="caption"
                                  color="info.main"
                                  display="block"
                                  fontWeight={600}
                                  sx={{ mt: 0.5 }}
                                >
                                  {terminLabel}
                                </Typography>
                              )}
                            </Box>
                            {canReschedule && (
                              <Tooltip title="Ubah Jatuh Tempo (Reschedule)" arrow>
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRescheduleTarget(row);
                                  }}
                                  aria-label="Ubah Jatuh Tempo"
                                >
                                  <CalendarEdit size={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </td>
                        <td>
                          <Chip
                            size="small"
                            label={deliveryMeta.label}
                            color={deliveryMeta.color}
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontSize: 11,
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                          {deliveryMeta.receivedAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              Tiba: {deliveryMeta.receivedAt}
                            </Typography>
                          )}
                          {!payable && (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                              sx={{
                                mt: 0.5,
                                fontWeight: 600,
                                maxWidth: 180,
                                whiteSpace: "normal",
                              }}
                            >
                              {unpayableReason}
                            </Typography>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {money(
                              row.next_due_amount ??
                                row.nominal_termin ??
                                row.sisa ??
                                row.total
                            )}
                          </Typography>
                          {row.nominal_termin &&
                            Number(row.sisa) > Number(row.nominal_termin) && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                dari total sisa {money(row.sisa)}
                              </Typography>
                            )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {row.status_label || row.sts_paid || "bersisa"}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Box>

            <Box mt={2}>
              <Paginate
                page={meta.page}
                lastPage={meta.total_pages || 1}
                total={meta.total}
                onPageChange={(next) =>
                  setApplied((a) => ({ ...a, page: next }))
                }
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          Terpilih: <strong>{selectedRows.length}</strong>
        </Typography>
        <Button onClick={handleClose}>Batal</Button>
        <Button
          variant="contained"
          disabled={!selectedRows.length}
          onClick={handleConfirm}
        >
          Tambah ke alokasi
        </Button>
      </DialogActions>

      <RescheduleDueDateModal
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        faktur={rescheduleTarget}
        permissions={permissions}
        onSuccess={(updated) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === updated.id || (r.kdfb && r.kdfb === updated.kdfb)
                ? { ...r, due_date: updated.due_date, new_due_date: updated.due_date }
                : r
            )
          );
          setChecked((prev) => {
            if (!prev[updated.id]) return prev;
            return {
              ...prev,
              [updated.id]: {
                ...prev[updated.id],
                due_date: updated.due_date,
              },
            };
          });
        }}
      />
    </Dialog>
  );
}
