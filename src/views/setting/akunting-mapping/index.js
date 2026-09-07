"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Autocomplete,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Filter, Refresh } from "iconsax-react";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import CircularLoader from "components/CircularLoader";
import { APP_DEFAULT_PATH } from "config";
import {
  DEFAULT_SOURCE_INSTANCE,
  GLOBAL_OPS_SOURCE_TYPES,
  SOURCE_TO_TARGET_DEFAULT,
  fetchAkuntingTargets,
  useAkuntingMappingMeta,
  useGetAkuntingMappings,
} from "api/akunting-mapping";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Setting" },
  { title: "Akunting Mapping" },
];

export default function AkuntingMappingScreen() {
  const [filters, setFilters] = useState({
    source_system: "OPS_BE",
    source_instance: DEFAULT_SOURCE_INSTANCE,
    source_entity_type: "",
    company_id: "",
    status: "ACTIVE",
    q: "",
    limit: 100,
    offset: 0,
  });
  const [draft, setDraft] = useState(filters);
  const { meta } = useAkuntingMappingMeta();
  const [companyOptions, setCompanyOptions] = useState([]);
  const { rows, total, dataLoading, dataMutate, dataError } =
    useGetAkuntingMappings(filters);

  const sourceTypes = (meta?.source_entity_types || []).filter(
    (type) => SOURCE_TO_TARGET_DEFAULT[type.value],
  );
  const statuses = meta?.statuses || ["ACTIVE", "INACTIVE", "PENDING_REVIEW"];

  useEffect(() => {
    fetchAkuntingTargets("COMPANY", { limit: 100 })
      .then(setCompanyOptions)
      .catch(() => setCompanyOptions([]));
  }, []);

  const applyFilter = () => setFilters({ ...draft, offset: 0 });

  const tableRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  return (
    <Fragment>
      <Breadcrumbs custom heading="Akunting Mapping" links={breadcrumbLinks} />
      <MainCard
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              component={Link}
              href="/akunting-mapping/create"
              startIcon={<Add />}
            >
              Tambah Mapping
            </Button>
            <Button
              variant="outlined"
              color="warning"
              component={Link}
              href="/akunting-mapping/issues"
            >
              Mapping Issues
            </Button>
            <IconButton color="secondary" onClick={() => dataMutate()}>
              <Refresh />
            </IconButton>
          </Stack>
        }
        content={false}
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              select
              size="small"
              label="Source Type"
              value={draft.source_entity_type}
              onChange={(e) =>
                setDraft((s) => ({ ...s, source_entity_type: e.target.value }))
              }
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Semua</MenuItem>
              {sourceTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {GLOBAL_OPS_SOURCE_TYPES.includes(t.value)
                    ? `${t.label || t.value} (Global OPS)`
                    : t.label || t.value}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              size="small"
              options={companyOptions}
              value={
                companyOptions.find(
                  (o) => String(o.id) === String(draft.company_id),
                ) || null
              }
              getOptionLabel={(option) =>
                `[${option.code || option.id}] ${option.name || option.legal_name || ""}`.trim()
              }
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              onChange={(_, option) =>
                setDraft((state) => ({
                  ...state,
                  company_id: option?.id || "",
                }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Target Company" />
              )}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={draft.status}
              onChange={(e) =>
                setDraft((s) => ({ ...s, status: e.target.value }))
              }
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Semua</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Cari"
              placeholder="id / kode / nama"
              value={draft.q}
              onChange={(e) => setDraft((s) => ({ ...s, q: e.target.value }))}
              sx={{ minWidth: 220 }}
            />
            <Button
              variant="outlined"
              startIcon={<Filter />}
              onClick={applyFilter}
            >
              Terapkan
            </Button>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Total: {total} mapping · Source: OPS_BE / {filters.source_instance}{" "}
            → dbaccounting
          </Typography>
          {dataError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {dataError?.message ||
                "Gagal memuat data. Pastikan ACCOUNTING_INTEGRATION_ENABLED=true di backend."}
            </Typography>
          )}
        </Box>

        {dataLoading ? (
          <CircularLoader />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>Source Type</TableCell>
                  <TableCell>Instance</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Target Type</TableCell>
                  <TableCell>Target Company</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 3, textAlign: "center" }}
                      >
                        Belum ada mapping.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {tableRows.map((row) => {
                  const company = companyOptions.find(
                    (option) => String(option.id) === String(row.company_id),
                  );
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            GLOBAL_OPS_SOURCE_TYPES.includes(
                              row.source_entity_type,
                            )
                              ? `${row.source_entity_type} (Global OPS)`
                              : row.source_entity_type
                          }
                        />
                      </TableCell>
                      <TableCell>{row.source_instance || "-"}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.source_entity_id}
                          {row.source_entity_code
                            ? ` · ${row.source_entity_code}`
                            : ""}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.source_entity_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.target_entity_type}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.target_company_code ||
                            row.company_code ||
                            company?.code ||
                            "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.target_company_name ||
                            row.company_name ||
                            company?.name ||
                            "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.target_entity_code ||
                            row.target_code ||
                            row.target_entity_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.target_entity_name || row.target_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={
                            row.status === "ACTIVE" ? "success" : "default"
                          }
                          label={row.status}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {row.notes || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={`/akunting-mapping/${row.id}`}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </MainCard>
    </Fragment>
  );
}
