"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Add, Filter as FilterIcon } from "iconsax-react";

import {
  useGetPurchasingRequests,
  usePurchasingRequestAccess,
} from "api/purchasing-request";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import Paginate from "components/Paginate";
import { APP_DEFAULT_PATH } from "config";
import PurchasingRequestFilter from "./filter";
import PurchasingRequestList from "./list";

const DEFAULT_FILTERS = {
  page: 1,
  limit: 25,
  bisnis_id: "",
  cabang_id: "",
  gudang_id: "",
  status: "",
  prioritas: "",
  kode: "",
  description: "",
  date_start: "",
  date_end: "",
};

/** Displays the permission-aware purchasing request list and filter controls. */
export default function PurchasingRequestPage() {
  const [params, setParams] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const { permissions, loading: accessLoading } = usePurchasingRequestAccess();
  const { rows, page, perPage, total, lastPage, loading, error } =
    useGetPurchasingRequests(params, permissions.can_read);
  const counts = useMemo(
    () =>
      rows.reduce(
        (result, row) => ({
          ...result,
          [row.status]: (result[row.status] || 0) + 1,
        }),
        {},
      ),
    [rows],
  );
  const activeFilters = Object.entries(params).filter(
    ([key, value]) => !["page", "limit"].includes(key) && Boolean(value),
  ).length;
  return (
    <>
      <Breadcrumbs
        custom
        heading="Purchasing Request"
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Purchasing Request", to: "/purchasing-request" },
        ]}
      />
      <MainCard
        title={
          permissions.can_insert ? (
            <Button
              component={Link}
              href="/purchasing-request/create"
              variant="contained"
              startIcon={<Add />}
            >
              Buat PR
            </Button>
          ) : null
        }
        secondary={
          permissions.can_read ? (
            <Button
              variant={activeFilters ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(true)}
            >
              Filter{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
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
              Anda tidak memiliki akses untuk melihat Purchasing Request.
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
                  ["Draft", counts.draft || 0],
                  ["Menunggu Validasi", counts.active || 0],
                  ["Menunggu Approval", counts.approved || 0],
                  ["Selesai", counts.finish || 0],
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
                  Gagal memuat Purchasing Request. {error.message}
                </Alert>
              )}
              {loading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <>
                  <PurchasingRequestList rows={rows} />
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
      <PurchasingRequestFilter
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
