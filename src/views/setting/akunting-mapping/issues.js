"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Filter, Refresh } from "iconsax-react";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import CircularLoader from "components/CircularLoader";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import { openNotification } from "api/notification";
import {
  requeueAkuntingMappingIssue,
  useGetAkuntingMappingIssues,
} from "api/akunting-mapping";

const EVENT_TYPES = ["PURCHASE_INVOICE_READY", "AP_PAYMENT_POSTED"];
const STATUSES = ["BLOCKED_MAPPING", "DEAD_LETTER"];
const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Akunting Mapping", to: "/akunting-mapping" },
  { title: "Issues" },
];

function dateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("id-ID");
}

function errorMessage(error) {
  return (
    error?.diagnostic?.message ||
    error?.message ||
    "Operasi Mapping Issues gagal"
  );
}

export default function AkuntingMappingIssuesScreen() {
  const [filters, setFilters] = useState({
    status: "",
    event_type: "",
    page: 1,
    per_page: 25,
  });
  const [draft, setDraft] = useState(filters);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const {
    issues,
    pagination,
    issuesLoading,
    issuesRefreshing,
    issuesError,
    refreshIssues,
  } = useGetAkuntingMappingIssues(filters);

  const closeDialog = () => {
    if (submitting) return;
    setSelected(null);
    setReason("");
    setConfirmed(false);
  };

  const submitRequeue = async () => {
    const cleanReason = reason.trim();
    if (!cleanReason || !confirmed || !selected) return;
    setSubmitting(true);
    try {
      const response = await requeueAkuntingMappingIssue(selected.id, cleanReason);
      setUpgradeResult(response.rows);
      openNotification({
        open: true,
        title: "success",
        message: response?.diagnostic?.message || "Outbox berhasil di-requeue",
        alert: { color: "success" },
      });
      setSelected(null);
      setReason("");
      setConfirmed(false);
      await refreshIssues();
    } catch (error) {
      openNotification({
        open: true,
        title: "error",
        message: errorMessage(error),
        alert: { color: "error" },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Mapping Issues" links={breadcrumbLinks} />
      <MainCard
        content={false}
        sx={{ mt: 1 }}
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button component={Link} href="/akunting-mapping" variant="outlined">
              Daftar Mapping
            </Button>
            <IconButton
              color="secondary"
              disabled={issuesRefreshing}
              onClick={() => refreshIssues()}
              aria-label="Refresh mapping issues"
            >
              <Refresh />
            </IconButton>
          </Stack>
        }
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              select
              size="small"
              label="Status"
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({ ...current, status: event.target.value }))
              }
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Semua status</MenuItem>
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Event"
              value={draft.event_type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  event_type: event.target.value,
                }))
              }
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="">Semua event</MenuItem>
              {EVENT_TYPES.map((event) => (
                <MenuItem key={event} value={event}>
                  {event}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Filter />}
              onClick={() => setFilters({ ...draft, page: 1 })}
            >
              Terapkan
            </Button>
          </Stack>
        </Box>

        {upgradeResult && (
          <Alert severity="success" sx={{ m: 2 }} onClose={() => setUpgradeResult(null)}>
            Outbox #{upgradeResult.id} menjadi {upgradeResult.status}. Payload{" "}
            {upgradeResult.payload_upgraded
              ? `di-upgrade dari schema v${upgradeResult.old_schema} ke v${upgradeResult.new_schema}`
              : `tetap menggunakan schema v${upgradeResult.new_schema}`}.
          </Alert>
        )}
        {issuesError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {errorMessage(issuesError)}
          </Alert>
        )}

        {issuesLoading ? (
          <CircularLoader />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>Outbox / Event</TableCell>
                  <TableCell>Document</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Failure</TableCell>
                  <TableCell>Missing Mapping</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        Tidak ada blocked mapping atau dead letter.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {issues.map((row) => (
                  <TableRow key={row.id} hover sx={{ verticalAlign: "top" }}>
                    <TableCell>
                      <Typography fontWeight={700}>#{row.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.event?.type}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Schema v{row.schema}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {row.details?.document?.number || row.aggregate?.id || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.details?.document?.type || row.aggregate?.type || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={row.status === "BLOCKED_MAPPING" ? "warning" : "error"}
                        label={row.status}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="caption" fontWeight={700}>
                        HTTP {row.last_http_status || "-"}
                        {row.details?.error_code ? ` · ${row.details.error_code}` : ""}
                      </Typography>
                      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                        {row.last_error || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {(row.details?.missing_mappings || []).map((missing, index) => (
                          <Chip
                            key={`${missing.entity_type}-${missing.source_id}-${index}`}
                            size="small"
                            variant="outlined"
                            label={`${missing.entity_type || "ENTITY"}: ${missing.source_code || missing.source_id || "-"}`}
                          />
                        ))}
                        {!row.details?.missing_mappings?.length && (
                          <Typography variant="caption" color="text.secondary">
                            Tidak tersedia
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {row.attempts?.count} / {row.attempts?.max}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{dateTime(row.updated_at)}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Dibuat {dateTime(row.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setSelected(row)}
                      >
                        Requeue
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={pagination.total || 0}
              page={Math.max(0, (pagination.page || 1) - 1)}
              rowsPerPage={pagination.per_page || 25}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={(_, page) =>
                setFilters((current) => ({ ...current, page: page + 1 }))
              }
              onRowsPerPageChange={(event) => {
                const perPage = Number(event.target.value);
                setDraft((current) => ({ ...current, per_page: perPage, page: 1 }));
                setFilters((current) => ({ ...current, per_page: perPage, page: 1 }));
              }}
            />
          </Box>
        )}
      </MainCard>

      <Dialog open={Boolean(selected)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Requeue outbox #{selected?.id}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Pastikan mapping atau penyebab kegagalan sudah diperbaiki. Tindakan ini
            tercatat atas user yang sedang login.
          </Alert>
          <TextField
            autoFocus
            required
            fullWidth
            multiline
            minRows={3}
            label="Alasan requeue"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            inputProps={{ maxLength: 800 }}
            helperText={`${reason.length}/800`}
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
            }
            label="Saya mengonfirmasi remediasi sudah dilakukan dan event boleh dikirim ulang."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!reason.trim() || !confirmed || submitting}
            onClick={submitRequeue}
          >
            {submitting ? "Memproses..." : "Konfirmasi Requeue"}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
