"use client";

import Link from "next/link";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import moment from "moment";
import "moment/locale/id";

import StatusChip from "./components/StatusChip";
import { formatCurrency } from "./utils";

moment.locale("id");

function EmptyList() {
  return (
    <Stack alignItems="center" sx={{ py: 8 }}>
      <Typography variant="h6" color="text.secondary">
        Tidak ada Purchase Order sesuai filter.
      </Typography>
    </Stack>
  );
}

function PageSelection({ rows, selectedIds, onSelect }) {
  const count = rows.filter((row) => selectedIds.has(String(row.id))).length;
  return (
    <Checkbox
      checked={rows.length > 0 && count === rows.length}
      indeterminate={count > 0 && count < rows.length}
      disabled={!rows.length}
      onChange={(_, checked) => onSelect(rows, checked)}
      inputProps={{ 'aria-label': 'Pilih semua PO di halaman ini' }}
    />
  );
}

function DesktopList({ rows, selectionMode, selectedIds, onSelect }) {
  if (!rows.length) return <EmptyList />;
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <Box
        component="table"
        sx={{
          width: "100%",
          minWidth: 1100,
          borderCollapse: "collapse",
          fontSize: 12,
          tableLayout: "auto",
          "& th, & td": {
            padding: 1,
            whiteSpace: "nowrap",
            verticalAlign: "top",
          },
          "& .supplier-description": {
            whiteSpace: "normal",
            minWidth: 220,
            maxWidth: 320,
          },
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            {selectionMode && <th><PageSelection rows={rows} selectedIds={selectedIds} onSelect={onSelect} /></th>}
            <th>Aksi</th>
            <th>Kode</th>
            <th>ReqCode</th>
            <th>Organisasi</th>
            <th className="supplier-description">Pemasok & Narasi</th>
            <th>Prioritas</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Grand Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
              {selectionMode && <td><Checkbox checked={selectedIds.has(String(row.id))} onChange={(_, checked) => onSelect([row], checked)} inputProps={{ 'aria-label': `Pilih PO ${row.kdpo || row.id}` }} /></td>}
              <td>
                <Button
                  component={Link}
                  size="small"
                  variant="outlined"
                  href={`/purchasing-orders/${row.id}`}
                >
                  Detail
                </Button>
              </td>
              <td>
                <Typography variant="body2" fontWeight={700}>{row.kdpo || "-"}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.request_date
                    ? moment(row.request_date).format("DD MMM YYYY")
                    : "-"}
                </Typography>
              </td>
              <td>
                {row.pr && row.kode_pr ? (
                  <Typography
                    component={Link}
                    href={`/purchasing-request/${row.pr}`}
                    variant="body2"
                    fontWeight={700}
                    color="primary"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                  >
                    <LinkOutlinedIcon sx={{ fontSize: 16 }} />
                    {row.kode_pr}
                  </Typography>
                ) : (
                  <Typography variant="body2" fontWeight={700}>
                    {row.kode_pr || "-"}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.author_pr || row.purchaseRequest?.creator?.nama_lengkap || "-"}
                </Typography>
              </td>
              <td>
                <Typography variant="body2">
                  {row.bisnis?.name || row.bisnis?.initial || "-"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.cabang?.nama || "-"}
                </Typography>
              </td>
              <td className="supplier-description">
                <Typography variant="body2">{row.pemasok?.nama || "-"}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.narasi || "-"}
                </Typography>
              </td>
              <td>{row.prioritas || "-"}</td>
              <td>
                <StatusChip status={row.status} />
              </td>
              <td style={{ textAlign: "right" }}>
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(row.grandtotal)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Item: {row.totalItems || 0}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

function MobileList({ rows, selectionMode, selectedIds, onSelect }) {
  if (!rows.length) return <EmptyList />;
  return (
    <Stack spacing={1.5}>
      {selectionMode && <FormControlLabel control={<PageSelection rows={rows} selectedIds={selectedIds} onSelect={onSelect} />} label="Pilih semua di halaman ini" />}
      {rows.map((row) => (
        <Box
          key={row.id}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
          }}
        >
          <Stack spacing={1}>
            {selectionMode && <FormControlLabel control={<Checkbox checked={selectedIds.has(String(row.id))} onChange={(_, checked) => onSelect([row], checked)} inputProps={{ 'aria-label': `Pilih PO ${row.kdpo || row.id}` }} />} label="Pilih PO" />}
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">{row.kdpo || "-"}</Typography>
              <StatusChip status={row.status} />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block">
              {row.kode_pr || "-"} · {row.author_pr || row.purchaseRequest?.creator?.nama_lengkap || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {row.pemasok?.nama || "-"} · {row.cabang?.nama || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {row.narasi || "-"}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatCurrency(row.grandtotal)}
            </Typography>
            <Button
              component={Link}
              fullWidth
              variant="outlined"
              size="small"
              href={`/purchasing-orders/${row.id}`}
            >
              Lihat Detail
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

/** Responsive purchase order list. */
export default function PurchaseOrderList({ rows = [], selectionMode = false, selectedIds = new Set(), onSelect = () => {} }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const props = { rows, selectionMode, selectedIds, onSelect };
  return isMobile ? <MobileList {...props} /> : <DesktopList {...props} />;
}
