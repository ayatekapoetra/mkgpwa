"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Filter as FilterIcon, Refresh as RefreshIcon } from "iconsax-react";

import {
  createPaymentPlans,
  useFakturPembelianAccess,
  useFakturPembelianSummary,
  useGetFakturPembelian,
} from "api/faktur-pembelian";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import Paginate from "components/Paginate";
import { APP_DEFAULT_PATH } from "config";
import useFilterStorage from "hooks/useFilterStorage";

import FakturPembelianFilter from "./filter";
import FakturPembelianList from "./list";
import { buildDefaultFilters, money } from "./utils";

const FILTER_KEY = "mkg_filter_scm_faktur_pembelian";

export default function FakturPembelianPage() {
  const router = useRouter();
  const [params, setParams, resetParams] = useFilterStorage(
    FILTER_KEY,
    buildDefaultFilters,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);

  const {
    permissions,
    loading: accessLoading,
    error: accessError,
    source: accessSource,
    usertype: accessUsertype,
    refresh: refreshAccess,
  } = useFakturPembelianAccess();

  const canRead = Boolean(permissions?.can_read);
  const canCreate = Boolean(permissions?.can_create);

  const listParams = useMemo(
    () => ({
      status: params.status,
      bisnis_id: params.bisnis_id,
      cabang_id: params.cabang_id,
      pemasok_id: params.pemasok_id,
      top_type: params.top_type,
      metode: params.metode,
      kdfb: params.kdfb,
      no_po: params.no_po,
      no_pd: params.no_pd,
      due_before: params.due_before,
      overdue_only: params.overdue_only,
      q: params.q,
      page: params.page,
      perPage: params.perPage,
    }),
    [params],
  );

  const { rows, page, total, lastPage, loading, error, refresh } =
    useGetFakturPembelian(listParams, canRead);

  const { summary, refresh: refreshSummary } = useFakturPembelianSummary(
    { bisnis_id: params.bisnis_id, pemasok_id: params.pemasok_id },
    canRead,
  );

  const activeFilters = useMemo(
    () =>
      Object.entries(params).filter(([key, value]) => {
        if (["page", "perPage"].includes(key)) return false;
        if (value === "" || value === null || value === undefined) return false;
        if (key === "status" && value === "unpaid") return false;
        return true;
      }).length,
    [params],
  );

  const selectedRows = useMemo(() => Object.values(checked), [checked]);
  const totalSelected = selectedRows.reduce(
    (sum, row) => sum + (Number(row.sisa) || 0),
    0,
  );
  const selectedPemasok = new Set(
    selectedRows.map((row) => String(row.pemasok_id || "")),
  ).size;
  const selectedBisnis = new Set(
    selectedRows.map((row) => String(row.bisnis_id || "")),
  ).size;
  const planGroups = selectedBisnis * selectedPemasok || 0;

  const selectableRows = rows.filter((row) => !row.planned);
  const allChecked =
    selectableRows.length > 0 &&
    selectableRows.every((row) => checked[row.id]);

  const toggle = useCallback((row) => {
    if (row.planned) return;
    setChecked((prev) => {
      const next = { ...prev };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = row;
      return next;
    });
  }, []);

  const togglePage = useCallback(() => {
    setChecked((prev) => {
      const next = { ...prev };
      if (allChecked) {
        selectableRows.forEach((row) => {
          delete next[row.id];
        });
      } else {
        selectableRows.forEach((row) => {
          next[row.id] = row;
        });
      }
      return next;
    });
  }, [allChecked, selectableRows]);

  const handleApplyFilter = (draft) => {
    setParams((current) => ({
      ...current,
      ...draft,
      page: 1,
      perPage: Number(draft.perPage) || current.perPage || 25,
    }));
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    resetParams(buildDefaultFilters());
    setChecked({});
    setFilterOpen(false);
  };

  const handleCreatePlans = async () => {
    if (!selectedRows.length || saving) return;
    setSaving(true);
    try {
      const result = await createPaymentPlans({
        allocations: selectedRows.map((row) => ({
          faktur_id: row.id,
          amount: Number(row.sisa) || undefined,
        })),
      });

      const created = result?.created || [];
      const failed = result?.failed || [];
      openNotification({
        open: true,
        title: failed.length ? "Rencana dibuat sebagian" : "Rencana dibuat",
        message: [
          `${created.length} rencana pembayaran dibuat.`,
          ...(failed.length
            ? [`${failed.length} gagal: ${failed.map((f) => f.message).join("; ")}`]
            : []),
        ].join(" "),
        alert: { color: failed.length ? "warning" : "success" },
      });

      setChecked({});
      refresh();
      refreshSummary();
      router.push("/orders-payments?status=pending");
    } catch (err) {
      const payload = err?.payload;
      const detail = Array.isArray(payload?.failed)
        ? payload.failed.map((f) => f.message).join("; ")
        : "";
      openNotification({
        open: true,
        title: "Gagal membuat rencana",
        message: detail || err?.message || "Gagal membuat rencana pembayaran",
        alert: { color: "error" },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumbs
        custom
        heading="Faktur Pembelian"
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Chasier" },
          { title: "Faktur Pembelian", to: "/faktur-pembelian" },
        ]}
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <MainCard contentSX={{ py: 2, px: 2.5 }} sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total Faktur
          </Typography>
          <Typography variant="h4">{summary?.total_faktur ?? "—"}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {summary?.total_planned ?? 0} sudah direncanakan
          </Typography>
        </MainCard>
        <MainCard contentSX={{ py: 2, px: 2.5 }} sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total Sisa
          </Typography>
          <Typography variant="h4" color="warning.main">
            {money(summary?.total_sisa)}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            dari {money(summary?.total_grandtotal)}
          </Typography>
        </MainCard>
        <MainCard contentSX={{ py: 2, px: 2.5 }} sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Lewat Jatuh Tempo
          </Typography>
          <Typography variant="h4" color="error.main">
            {summary?.total_overdue ?? 0}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            faktur perlu perhatian
          </Typography>
        </MainCard>
      </Stack>

      <MainCard
        title={<Typography variant="h5">Faktur Pembelian</Typography>}
        secondary={
          canRead ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                color="secondary"
                onClick={() => {
                  refresh();
                  refreshSummary();
                }}
                sx={{ border: "1px solid", borderColor: "divider" }}
              >
                <RefreshIcon size={20} />
              </IconButton>
              <Button
                variant={activeFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setFilterOpen(true)}
              >
                {activeFilters ? ` (${activeFilters})` : ""}
              </Button>
            </Stack>
          ) : null
        }
      >
        {accessLoading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress size={28} />
          </Box>
        ) : accessError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refreshAccess()}>
                Coba lagi
              </Button>
            }
          >
            Gagal memuat hak akses Faktur Pembelian.{" "}
            {accessError?.message || "Periksa koneksi / restart backend."}
          </Alert>
        ) : !canRead ? (
          <Alert severity="warning">
            Anda tidak memiliki akses untuk melihat Faktur Pembelian.
            {accessUsertype
              ? ` (usertype: ${accessUsertype}, source: ${accessSource || "—"})`
              : ""}
          </Alert>
        ) : loading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="error">
            Gagal memuat data faktur:{" "}
            {error?.message || error?.diagnostic?.error || "Unknown error"}
          </Alert>
        ) : (
          <>
            <FakturPembelianList
              rows={rows}
              selectable={canCreate}
              checked={checked}
              onToggle={toggle}
              onTogglePage={togglePage}
              allChecked={allChecked}
            />

            {total > 0 ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                spacing={2}
                mt={2}
              >
                <Typography variant="body2" color="text.secondary">
                  Total {total} faktur · halaman {page} dari {lastPage}
                </Typography>
                <Paginate
                  page={page}
                  total={total}
                  perPage={params.perPage}
                  lastPage={lastPage}
                  onPageChange={(next) =>
                    setParams((current) => ({ ...current, page: next }))
                  }
                />
              </Stack>
            ) : null}

            {canCreate ? (
              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  mt: 2,
                  p: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      color={selectedRows.length ? "primary" : "default"}
                      label={`${selectedRows.length} faktur dipilih`}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {selectedPemasok} pemasok · {money(totalSelected)}
                      {selectedRows.length && planGroups
                        ? ` · ${planGroups} rencana`
                        : ""}
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                    disabled={!selectedRows.length || saving}
                    onClick={handleCreatePlans}
                  >
                    {saving ? "Menyimpan…" : "Kirim ke Rencana Pembayaran"}
                  </Button>
                </Stack>
              </Box>
            ) : null}
          </>
        )}
      </MainCard>

      <FakturPembelianFilter
        open={filterOpen}
        params={params}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />
    </>
  );
}
