"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Filter as FilterIcon, Refresh as RefreshIcon } from "iconsax-react";
import moment from "moment";

import {
  useGetOrderPayments,
  useOrderPaymentAccess,
  useOrderPaymentSummary,
} from "api/order-payments";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import Paginate from "components/Paginate";
import { APP_DEFAULT_PATH } from "config";
import OrderPaymentFilter, {
  EMPTY_FILTERS,
  defaultDateEnd,
  defaultDateStart,
} from "./filter";
import OrderPaymentList from "./list";
import useFilterStorage from "hooks/useFilterStorage";

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const buildDefaultFilters = () => ({
  ...EMPTY_FILTERS,
  page: 1,
  limit: 25,
  status: "pending",
  q: "",
  bisnis_id: "",
  cabang_id: "",
  pemasok_id: "",
  date_start: defaultDateStart(),
  date_end: defaultDateEnd(),
});

export default function OrderPaymentPage() {
  const [params, setParams, resetParams] = useFilterStorage(
    "mkg_filter_scm_order_payment",
    buildDefaultFilters
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const {
    permissions,
    loading: accessLoading,
    error: accessError,
    source: accessSource,
    usertype: accessUsertype,
    refresh: refreshAccess,
  } = useOrderPaymentAccess();
  const canRead = Boolean(permissions?.can_read);

  const listParams = useMemo(
    () => ({
      page: params.page,
      limit: params.limit,
      status: params.status,
      q: params.q,
      bisnis_id: params.bisnis_id,
      cabang_id: params.cabang_id,
      pemasok_id: params.pemasok_id,
      date_start: params.date_start,
      date_end: params.date_end,
    }),
    [params],
  );

  const summaryParams = useMemo(
    () => ({
      q: params.q,
      bisnis_id: params.bisnis_id,
      cabang_id: params.cabang_id,
      pemasok_id: params.pemasok_id,
      date_start: params.date_start,
      date_end: params.date_end,
    }),
    [params],
  );

  const { rows, page, total, lastPage, loading, error, refresh } =
    useGetOrderPayments(listParams, canRead);
  const { summary, refresh: refreshSummary } = useOrderPaymentSummary(
    summaryParams,
    canRead,
  );

  const stats = useMemo(
    () => ({
      pending: summary?.pending ?? 0,
      paid: summary?.paid ?? 0,
      pending_amount: summary?.pending_amount ?? 0,
      paid_amount: summary?.paid_amount ?? 0,
    }),
    [summary],
  );

  const dateLabel = useMemo(() => {
    const start = params.date_start
      ? moment(params.date_start).format("DD MMM YYYY")
      : "—";
    const end = params.date_end
      ? moment(params.date_end).format("DD MMM YYYY")
      : "—";
    return `${start} – ${end}`;
  }, [params.date_start, params.date_end]);

  const activeFilters = Object.entries(params).filter(([key, value]) => {
    if (["page", "limit"].includes(key)) return false;
    if (value === "" || value === null || value === undefined) return false;
    if (key === "status" && value === "pending") return false;
    if (key === "date_start" && value === defaultDateStart()) return false;
    if (key === "date_end" && value === defaultDateEnd()) return false;
    return true;
  }).length;

  const handleApplyFilter = (draft) => {
    setParams((current) => ({
      ...current,
      ...draft,
      page: 1,
      limit: Number(draft.limit) || current.limit || 25,
      date_start: draft.date_start || defaultDateStart(),
      date_end: draft.date_end || defaultDateEnd(),
    }));
    setFilterOpen(false);
  };

  const handleResetFilter = (resetValues) => {
    resetParams(resetValues);
    setFilterOpen(false);
  };

  return (
    <>
      <Breadcrumbs
        custom
        heading="Orders Payments"
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Orders Payments", to: "/orders-payments" },
        ]}
      />

      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Periode: {dateLabel}
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <MainCard contentSX={{ py: 2, px: 2.5 }} sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Antrian Bulan Berjalan
          </Typography>
          <Typography variant="h4" color="warning.main">
            {stats.pending}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {money(stats.pending_amount)}
          </Typography>
        </MainCard>
        <MainCard contentSX={{ py: 2, px: 2.5 }} sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Sudah bayar (diproses)
          </Typography>
          <Typography variant="h4" color="success.main">
            {stats.paid}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {dateLabel}
          </Typography>
        </MainCard>
        <MainCard contentSX={{ py: 2, px: 2.5 }} sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total nilai dibayar
          </Typography>
          <Typography variant="h4" color="primary.main">
            {money(stats.paid_amount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {stats.paid} transaksi
          </Typography>
        </MainCard>
      </Stack>

      <MainCard
        title={<Typography variant="h5">Orders Payments</Typography>}
        secondary={
          canRead ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              {permissions?.can_post || permissions?.can_create || permissions?.can_update ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  href="/orders-payments/new"
                >
                  Add Pembayaran
                </Button>
              ) : null}
              <IconButton
                color="secondary"
                onClick={() => {
                  refresh();
                  refreshSummary();
                }}
                sx={{ border: '1px solid', borderColor: 'divider' }}>
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
        {accessLoading || loading ? (
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
            Gagal memuat hak akses Orders Payments.{" "}
            {accessError?.message ||
              accessError?.response?.data?.message ||
              "Periksa koneksi / restart backend."}
          </Alert>
        ) : !canRead ? (
          <Alert severity="warning">
            Anda tidak memiliki akses untuk melihat Orders Payments.
            {accessUsertype
              ? ` (usertype: ${accessUsertype}, source: ${accessSource || "—"})`
              : " Sementara hanya usertype developer / administrator."}
          </Alert>
        ) : error ? (
          <Alert severity="error">
            Gagal memuat data. {error?.message || "Unknown error"}
          </Alert>
        ) : (
          <>
            <OrderPaymentList rows={rows} />
            <Box mt={2}>
              <Paginate
                page={page}
                lastPage={lastPage}
                total={total}
                onPageChange={(next) => setParams((p) => ({ ...p, page: next }))}
              />
            </Box>
          </>
        )}
      </MainCard>

      <OrderPaymentFilter
        open={filterOpen}
        params={params}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />
    </>
  );
}
