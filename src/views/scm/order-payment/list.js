"use client";

import Link from "next/link";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const formatDateLong = (v) => {
  if (!v) return "—";
  const m = moment(v);
  if (!m.isValid()) return String(v).slice(0, 10);
  return m.format("dddd, DD MMMM YYYY");
};

const truncate = (v, max = 50) => {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

const cellSx = {
  padding: "10px 12px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  borderBottom: "1px solid",
  borderColor: "divider",
};

export default function OrderPaymentList({ rows = [] }) {
  if (!rows.length) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary">
          Tidak ada Orders Payments sesuai filter.
        </Typography>
      </Box>
    );
  }

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
          fontSize: 13,
          tableLayout: "auto",
          "& th": {
            ...cellSx,
            backgroundColor: "grey.50",
            fontWeight: 700,
            textAlign: "left",
            position: "sticky",
            top: 0,
            zIndex: 1,
          },
          "& td": cellSx,
        }}
      >
        <thead>
          <tr>
            <th>Aksi</th>
            <th>No. Bayar</th>
            <th>Pemasok</th>
            <th>PO / PD</th>
            <th>Faktur</th>
            <th style={{ textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isPaid = row.status === "paid";
            return (
              <tr key={row.id}>
                <td>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant={isPaid ? "outlined" : "contained"}
                      href={`/orders-payments/${row.id}`}
                    >
                      {isPaid ? "Detail" : "Bayar"}
                    </Button>
                  </Stack>
                </td>
                <td>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {row.kdbayar || `#${row.id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {formatDateLong(row.trx_date || row.created_at)}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {row.pemasok_nama || row.party_name || "—"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    display="block"
                    title={row.pemasok_alamat || row.pemasok_kode || ""}
                  >
                    {truncate(row.pemasok_alamat, 50) || row.pemasok_kode || "—"}
                  </Typography>
                </td>
                <td>
                  <Stack direction="column" spacing={0.5}>
                    {row.no_po ? (
                      row.reff ? (
                        <Typography
                          component={Link}
                          href={`/purchasing-orders/${row.reff}`}
                          variant="body2"
                          color="primary"
                          noWrap
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            textDecoration: "none",
                            fontWeight: 700,
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          <LinkOutlinedIcon sx={{ fontSize: 16 }} />
                          {row.no_po}
                        </Typography>
                      ) : (
                        <Typography variant="body2" noWrap>
                          {row.no_po}
                        </Typography>
                      )
                    ) : null}
                    {row.no_pd ? (
                      row.reff_pd ? (
                        <Typography
                          component={Link}
                          href={`/pengajuan-dana/${row.reff_pd}`}
                          variant="body2"
                          color="primary"
                          noWrap
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            textDecoration: "none",
                            fontWeight: 700,
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          <LinkOutlinedIcon sx={{ fontSize: 16 }} />
                          {row.no_pd}
                        </Typography>
                      ) : (
                        <Typography
                          variant={row.no_po ? "caption" : "body2"}
                          color={row.no_po ? "text.secondary" : "inherit"}
                          noWrap
                          display="block"
                        >
                          {row.no_pd}
                        </Typography>
                      )
                    ) : null}
                    {!row.no_po && !row.no_pd ? (
                      <Typography variant="body2" noWrap>
                        —
                      </Typography>
                    ) : null}
                    <Typography variant="body2" noWrap>
                      {row.bisnis_kode || row.bisnis_nama || "—"} * {row.cabang_nama || "—"}
                    </Typography>
                  </Stack>
                </td>
                <td>
                  <Typography variant="body2" noWrap>
                    {row.faktur_kode || "—"}
                  </Typography>
                  <Chip
                    size="small"
                    label={row.status_label || row.status}
                    color={isPaid ? "success" : "warning"}
                    variant="outlined"
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {money(row.roundtotal || row.total)}
                  </Typography>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Box>
    </Box>
  );
}
