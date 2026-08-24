"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Export as ExportIcon, Filter as FilterIcon } from "iconsax-react";

import {
  exportPurchaseOrders,
  useGetPurchaseOrders,
  usePurchaseOrderAccess,
} from "api/purchase-orders";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import Paginate from "components/Paginate";
import { APP_DEFAULT_PATH } from "config";
import PurchaseOrderFilter from "./filter";
import PurchaseOrderList from "./list";

const DEFAULT_FILTERS = {
  page: 1,
  limit: 25,
  bisnis_id: "",
  cabang_id: "",
  gudang_id: "",
  pemasok_id: "",
  status: "",
  prioritas: "",
  kode: "",
  narasi: "",
  date_start: "",
  date_end: "",
};

/** Permission-aware purchase order list with filter controls. */
export default function PurchaseOrderPage() {
  const [params, setParams] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { permissions, loading: accessLoading } = usePurchaseOrderAccess();
  const { rows, page, perPage, total, lastPage, loading, error } =
    useGetPurchaseOrders(params, permissions.can_read);

  const counts = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }),
        {},
      ),
    [rows],
  );

  const activeFilters = Object.entries(params).filter(
    ([key, value]) => !["page", "limit"].includes(key) && Boolean(value),
  ).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportPurchaseOrders(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "purchase-orders.xlsx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      openNotification({
        open: true,
        title: "Export gagal",
        message: err?.message || "Gagal mengekspor data",
        alert: { color: "error" },
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Breadcrumbs
        custom
        heading="Purchase Order"
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Purchase Order", to: "/purchase-orders" },
        ]}
      />
      <MainCard
        title={
          <Typography variant="h5">Purchase Order</Typography>
        }
        secondary={
          permissions.can_read ? (
            <Stack direction="row" spacing={1.5}>
              {permissions.can_export && (
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? "Mengekspor..." : "Export"}
                </Button>
              )}
              <Button
                variant={activeFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setFilterOpen(true)}
              >
                Filter{activeFilters ? ` (${activeFilters})` : ""}
              </Button>
            </Stack>
          ) : null
        }
        content
      >
        <Stack spacing={3}>
          {accessLoading && (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {!accessLoading && !permissions.can_read && (
            <Alert severity="warning">
              Anda tidak memiliki akses untuk melihat Purchase Order.
            </Alert>
          )}
          {permissions.can_read && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2,1fr)",
                    md: "repeat(4,1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {[
                  ["Baru", counts.open || 0],
                  ["Menunggu Verifikasi", counts.verify || 0],
                  ["Diproses", counts.close || 0],
                  ["Ditolak", counts.reject || 0],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h4">{value}</Typography>
                  </Box>
                ))}
              </Box>
              {error && (
                <Alert severity="error">
                  Gagal memuat Purchase Order. {error.message}
                </Alert>
              )}
              {loading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <>
                  <PurchaseOrderList rows={rows} />
                  <Paginate
                    page={page || params.page}
                    perPage={perPage}
                    total={total}
                    lastPage={lastPage}
                    onPageChange={(value) =>
                      setParams((current) => ({ ...current, page: value }))
                    }
                  />
                </>
              )}
            </>
          )}
        </Stack>
      </MainCard>
      <PurchaseOrderFilter
        open={filterOpen}
        params={params}
        onClose={() => setFilterOpen(false)}
        onApply={(value) => {
          setParams((current) => ({ ...current, ...value, page: 1 }));
          setFilterOpen(false);
        }}
        onReset={() => {
          setParams(DEFAULT_FILTERS);
          setFilterOpen(false);
        }}
      />
    </>
  );
}