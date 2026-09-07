"use client";

import { useState } from "react";
import { useSnackbar } from "notistack";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { DocumentDownload, DocumentText, Filter, Refresh } from "iconsax-react";

import {
  downloadMonitoringOrderPart,
  useMonitoringOrderPart,
  useMonitoringOrderPartAccess,
} from "api/monitoring-order-part";
import IconButton from "components/@extended/IconButton";
import MainCard from "components/MainCard";
import MonitoringOrderPartDetail from "./detail";
import MonitoringOrderPartFilter from "./filter";
import MonitoringOrderPartList from "./list";
import { errorMessage, formatQuantity } from "./presentation";

const defaults = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return {
    date_from: `${year}-${month}-01`,
    date_to: `${year}-${month}-${day}`,
    date_field: "request",
    business_id: "",
    branch_id: "",
    warehouse_id: "",
    supplier_id: "",
    item_search: "",
    pr_code: "",
    po_code: "",
    priority: "",
    current_stage: "",
    procurement_stage: "",
    finance_stage: "",
    fulfillment_stage: "",
    overdue_only: false,
    anomaly_only: false,
    page: 1,
    perPage: 25,
    sort_by: "request_date",
    sort_direction: "desc",
  };
};

const hasExtraFilter = (params) =>
  [
    "business_id",
    "branch_id",
    "warehouse_id",
    "supplier_id",
    "item_search",
    "pr_code",
    "po_code",
    "priority",
    "current_stage",
    "procurement_stage",
    "finance_stage",
    "fulfillment_stage",
  ].some((key) => Boolean(params[key])) ||
  params.overdue_only ||
  params.anomaly_only;

const saveBlob = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
};

function SummaryCard({ label, value, color = "text.primary", wide = false }) {
  return (
    <Grid item xs={6} sm={wide ? 6 : 4} lg={wide ? 3 : 2}>
      <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h4"
          color={color}
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </Typography>
      </Paper>
    </Grid>
  );
}

export default function MonitoringOrderPartScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const [params, setParams] = useState(defaults);
  const [draftParams, setDraftParams] = useState(defaults);
  const [openFilter, setOpenFilter] = useState(false);
  const [detailContext, setDetailContext] = useState(null);
  const [exporting, setExporting] = useState(null);
  const access = useMonitoringOrderPartAccess();
  const result = useMonitoringOrderPart(params, access.canRead);

  const openFilterDrawer = () => {
    setDraftParams({ ...params });
    setOpenFilter(true);
  };
  const applyFilter = () => {
    setParams({ ...draftParams, page: 1, perPage: params.perPage });
    setOpenFilter(false);
  };
  const resetFilter = () =>
    setDraftParams({ ...defaults(), perPage: params.perPage });
  const download = async (format) => {
    if (exporting || !access.canExport) return;
    try {
      setExporting(format);
      enqueueSnackbar(`Menyiapkan ${format.toUpperCase()}...`, {
        variant: "info",
      });
      saveBlob(await downloadMonitoringOrderPart(params, format));
      enqueueSnackbar(
        `Monitoring Order Part ${format.toUpperCase()} berhasil diunduh`,
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(errorMessage(error, "Gagal mengunduh laporan."), {
        variant: "error",
      });
    } finally {
      setExporting(null);
    }
  };

  if (access.loading)
    return (
      <MainCard title="Monitoring Status Order Part">
        <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
          <CircularProgress />
          <Typography color="text.secondary">
            Memeriksa akses laporan...
          </Typography>
        </Stack>
      </MainCard>
    );
  if (access.error || !access.canRead)
    return (
      <MainCard title="Monitoring Status Order Part">
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => access.retry()}>
              Retry
            </Button>
          }
        >
          {access.error
            ? errorMessage(access.error)
            : "Anda tidak memiliki hak baca laporan ini."}
        </Alert>
      </MainCard>
    );

  const summary = result.summary;
  const exportTitle = access.canExport
    ? "Download report"
    : "Anda tidak memiliki hak export";
  return (
    <MainCard
      title="Monitoring Status Order Part"
      secondary={
        <Stack direction="row" gap={0.5}>
          <Tooltip title={`${exportTitle} PDF`}>
            <span>
              <IconButton
                aria-label="download-pdf"
                color="error"
                disabled={Boolean(exporting) || !access.canExport}
                onClick={() => download("pdf")}
                sx={{
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                {exporting === "pdf" ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DocumentDownload />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={`${exportTitle} Excel`}>
            <span>
              <IconButton
                aria-label="download-excel"
                color="success"
                disabled={Boolean(exporting) || !access.canExport}
                onClick={() => download("excel")}
                sx={{
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                {exporting === "excel" ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DocumentText />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Refresh">
            <span>
              <IconButton
                aria-label="refresh"
                color="primary"
                disabled={result.refreshing}
                onClick={() => result.retry()}
                sx={{
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton
              aria-label="filter"
              color="secondary"
              onClick={() =>
                openFilter ? setOpenFilter(false) : openFilterDrawer()
              }
              sx={{
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <Filter />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Periode {params.date_from} sampai {params.date_to}
            {result.generatedAt
              ? ` | Diperbarui ${new Date(result.generatedAt).toLocaleString("id-ID")}`
              : ""}
          </Typography>
          {exporting ? (
            <Typography variant="caption" color="primary">
              Menyiapkan {exporting.toUpperCase()}, mohon tunggu...
            </Typography>
          ) : null}
        </Box>
        <Grid container spacing={1.5}>
          <SummaryCard
            label="Total Item"
            value={Number(summary.total_items || 0).toLocaleString("id-ID")}
          />
          <SummaryCard
            label="Open"
            value={Number(summary.open_items || 0).toLocaleString("id-ID")}
            color="primary.main"
          />
          <SummaryCard
            label="PO Created"
            value={Number(summary.po_created_items || 0).toLocaleString(
              "id-ID",
            )}
            color="primary.main"
          />
          <SummaryCard
            label="Partial Shipped"
            value={Number(summary.partially_shipped_items || 0).toLocaleString(
              "id-ID",
            )}
            color="warning.main"
          />
          <SummaryCard
            label="Shipped"
            value={Number(summary.shipped_items || 0).toLocaleString("id-ID")}
            color="info.main"
          />
          <SummaryCard
            label="Partial Receipt"
            value={Number(summary.partially_received_items || 0).toLocaleString(
              "id-ID",
            )}
            color="warning.main"
          />
          <SummaryCard
            label="Received"
            value={Number(summary.received_items || 0).toLocaleString("id-ID")}
            color="success.main"
          />
          <SummaryCard
            label="Overdue"
            value={Number(summary.overdue_items || 0).toLocaleString("id-ID")}
            color="error.main"
          />
          <SummaryCard
            label="Anomaly"
            value={Number(summary.anomaly_items || 0).toLocaleString("id-ID")}
            color="warning.dark"
          />
          <SummaryCard
            label="Qty Ordered"
            value={formatQuantity(summary.total_qty_ordered || 0)}
            wide
          />
          <SummaryCard
            label="Qty Shipped"
            value={formatQuantity(summary.total_qty_shipped || 0)}
            wide
          />
          <SummaryCard
            label="Qty Received"
            value={formatQuantity(summary.total_qty_received || 0)}
            wide
          />
          <SummaryCard
            label="Qty Outstanding"
            value={formatQuantity(summary.total_qty_outstanding || 0)}
            color="error.main"
            wide
          />
        </Grid>
        {result.error ? (
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
        <MonitoringOrderPartList
          {...result}
          hasActiveFilter={hasExtraFilter(params)}
          onPageChange={(page) =>
            setParams((previous) => ({ ...previous, page }))
          }
          onRowsPerPageChange={(perPage) =>
            setParams((previous) => ({ ...previous, page: 1, perPage }))
          }
          onDetail={setDetailContext}
        />
      </Stack>
      <MonitoringOrderPartFilter
        open={openFilter}
        count={result.total}
        draftParams={draftParams}
        setDraftParams={setDraftParams}
        onApply={applyFilter}
        onReset={resetFilter}
        onClose={() => setOpenFilter(false)}
      />
      <MonitoringOrderPartDetail
        context={detailContext}
        onClose={() => setDetailContext(null)}
      />
    </MainCard>
  );
}
