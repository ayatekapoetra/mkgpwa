"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
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
    source_entity_type: "",
    status: "ACTIVE",
    q: "",
    limit: 100,
    offset: 0,
  });
  const [draft, setDraft] = useState(filters);
  const { meta } = useAkuntingMappingMeta();
  const { rows, total, dataLoading, dataMutate, dataError } = useGetAkuntingMappings(filters);

  const sourceTypes = meta?.source_entity_types || [];
  const statuses = meta?.statuses || ["ACTIVE", "INACTIVE", "PENDING_REVIEW"];

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
              onChange={(e) => setDraft((s) => ({ ...s, source_entity_type: e.target.value }))}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Semua</MenuItem>
              {sourceTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label || t.value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={draft.status}
              onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value }))}
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
            <Button variant="outlined" startIcon={<Filter />} onClick={applyFilter}>
              Terapkan
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Total: {total} mapping · Source system: OPS_BE → dbaccounting
          </Typography>
          {dataError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {dataError?.message || "Gagal memuat data. Pastikan ACCOUNTING_INTEGRATION_ENABLED=true di backend."}
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
                  <TableCell>Source</TableCell>
                  <TableCell>Target Type</TableCell>
                  <TableCell>Target ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                        Belum ada mapping.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {tableRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Chip size="small" label={row.source_entity_type} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {row.source_entity_id}
                        {row.source_entity_code ? ` · ${row.source_entity_code}` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.source_entity_name || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.target_entity_type}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                        {row.target_entity_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={row.status === "ACTIVE" ? "success" : "default"}
                        label={row.status}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{row.notes || "-"}</Typography>
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
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </MainCard>
    </Fragment>
  );
}
