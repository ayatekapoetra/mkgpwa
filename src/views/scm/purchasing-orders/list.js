"use client";

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
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Kode</th>
            <th style={{ padding: 8 }}>Organisasi</th>
            <th style={{ padding: 8 }}>Pemasok</th>
            <th style={{ padding: 8 }}>Prioritas</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8, textAlign: "right" }}>Grand Total</th>
            <th style={{ padding: 8 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <Typography variant="body2" fontWeight={700}>{row.kdpo || "-"}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.kode_pr || "-"}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.request_date
                    ? moment(row.request_date).format("DD MMM YYYY")
                    : "-"}
                </Typography>
              </td>
              <td style={{ padding: 8 }}>
                <Typography variant="body2">
                  {row.bisnis?.name || row.bisnis?.initial || "-"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.cabang?.nama || "-"}
                </Typography>
              </td>
              <td style={{ padding: 8 }}>{row.pemasok?.nama || "-"}</td>
              <td style={{ padding: 8 }}>{row.prioritas || "-"}</td>
              <td style={{ padding: 8 }}>
                <StatusChip status={row.status} />
              </td>
              <td style={{ padding: 8, textAlign: "right" }}>
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(row.grandtotal)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Item: {row.totalItems || 0}
                </Typography>
              </td>
              <td style={{ padding: 8 }}>
                <Button
                  size="small"
                  variant="outlined"
                  href={`/purchasing-orders/${row.id}`}
                >
                  Detail
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
            <Typography variant="caption" color="text.secondary">
              {row.pemasok?.nama || "-"} · {row.cabang?.nama || "-"}
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
