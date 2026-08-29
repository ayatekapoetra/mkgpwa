"use client";

import Link from "next/link";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
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

function DesktopList({ rows }) {
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
          "& th:nth-of-type(5), & td:nth-of-type(5)": {
            whiteSpace: "normal",
            minWidth: 220,
            maxWidth: 320,
          },
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            <th>Aksi</th>
            <th>Kode</th>
            <th>ReqCode</th>
            <th>Organisasi</th>
            <th>Pemasok</th>
            <th>Prioritas</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Grand Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>
                <Button
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
                  {row.author_pr || "-"}
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
              <td>
                <Typography variant="body2">{row.pemasok?.nama || "-"}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.pemasok?.alamat || "-"}
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

function MobileList({ rows }) {
  if (!rows.length) return <EmptyList />;
  return (
    <Stack spacing={1.5}>
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
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">{row.kdpo || "-"}</Typography>
              <StatusChip status={row.status} />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block">
              {row.kode_pr || "-"} · {row.author_pr || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {row.pemasok?.nama || "-"} · {row.cabang?.nama || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {row.pemasok?.alamat || "-"}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatCurrency(row.grandtotal)}
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              href={`/purchase-orders/${row.id}`}
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
export default function PurchaseOrderList({ rows = [] }) {
  return (
    <Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopList rows={rows} />
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileList rows={rows} />
      </Box>
    </Box>
  );
}
