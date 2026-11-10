"use client";

import Link from "next/link";
import { Box, Checkbox, Chip, Stack, Typography } from "@mui/material";
import moment from "moment";
import "moment/locale/id";

import {
  agingColor,
  agingLabel,
  formatDate,
  INSTALLMENT_LABELS,
  money,
  TOP_TYPE_LABELS,
} from "./utils";

moment.locale("id");

const cellSx = {
  padding: "10px 12px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  borderBottom: "1px solid",
  borderColor: "divider",
};

export default function FakturPembelianList({
  rows = [],
  selectable = false,
  checked = {},
  onToggle,
  onTogglePage,
  allChecked = false,
}) {
  if (!rows.length) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary">
          Tidak ada faktur pembelian sesuai filter.
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
          borderCollapse: "collapse",
          fontSize: 13,
          "& th": {
            ...cellSx,
            textAlign: "left",
            fontWeight: 700,
            bgcolor: "action.hover",
            position: "sticky",
            top: 0,
            zIndex: 1,
          },
          "& tbody tr:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box component="thead">
          <Box component="tr">
            {selectable ? (
              <Box component="th" sx={{ ...cellSx, width: 44 }}>
                <Checkbox
                  size="small"
                  checked={allChecked}
                  indeterminate={
                    !allChecked &&
                    rows.some((row) => checked[row.id] && !row.planned)
                  }
                  onChange={onTogglePage}
                  inputProps={{ "aria-label": "Pilih semua faktur di halaman" }}
                />
              </Box>
            ) : null}
            <Box component="th">No. Faktur</Box>
            <Box component="th">Sumber</Box>
            <Box component="th">Pemasok</Box>
            <Box component="th">Bisnis / Cabang</Box>
            <Box component="th">Tgl Faktur</Box>
            <Box component="th">Jatuh Tempo</Box>
            <Box component="th">Umur</Box>
            <Box component="th">Skema</Box>
            <Box component="th" sx={{ textAlign: "right" }}>Grand Total</Box>
            <Box component="th" sx={{ textAlign: "right" }}>Sisa</Box>
            <Box component="th">Status</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((row) => (
            <Box component="tr" key={row.id}>
              {selectable ? (
                <Box component="td" sx={cellSx}>
                  <Checkbox
                    size="small"
                    disabled={Boolean(row.planned)}
                    checked={Boolean(checked[row.id])}
                    onChange={() => onToggle?.(row)}
                    inputProps={{ "aria-label": `Pilih faktur ${row.kdfb || row.id}` }}
                  />
                </Box>
              ) : null}
              <Box component="td" sx={cellSx}>
                <Link
                  href={`/faktur-pembelian/${row.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {row.kdfb || `#${row.id}`}
                  </Typography>
                </Link>
                {row.kode ? (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Vendor: {row.kode}
                  </Typography>
                ) : null}
              </Box>
              <Box component="td" sx={cellSx}>
                <Typography variant="body2">
                  {row.source_type === "po"
                    ? row.no_po || "PO"
                    : row.source_type === "pd"
                      ? row.nopd || "Pengajuan Dana"
                      : "Manual"}
                </Typography>
              </Box>
              <Box component="td" sx={cellSx}>
                <Typography variant="body2">{row.pemasok_nama || "—"}</Typography>
              </Box>
              <Box component="td" sx={cellSx}>
                <Typography variant="body2">{row.bisnis_nama || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.cabang_nama || "—"}
                </Typography>
              </Box>
              <Box component="td" sx={cellSx}>
                {formatDate(row.date_faktur)}
              </Box>
              <Box component="td" sx={cellSx}>
                {formatDate(row.next_due_date || row.due_date)}
              </Box>
              <Box component="td" sx={cellSx}>
                <Chip
                  size="small"
                  variant="outlined"
                  color={agingColor(row.aging_days, row)}
                  label={agingLabel(row)}
                />
              </Box>
              <Box component="td" sx={cellSx}>
                <Typography variant="caption" display="block">
                  {TOP_TYPE_LABELS[row.top_type] || "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.metode || "—"}
                  {row.installment_status && row.installment_status !== "NONE"
                    ? ` · ${INSTALLMENT_LABELS[row.installment_status] || row.installment_status}`
                    : ""}
                </Typography>
              </Box>
              <Box component="td" sx={{ ...cellSx, textAlign: "right" }}>
                {money(row.grandtotal)}
              </Box>
              <Box component="td" sx={{ ...cellSx, textAlign: "right" }}>
                <Typography variant="body2" fontWeight={700}>
                  {money(row.sisa)}
                </Typography>
              </Box>
              <Box component="td" sx={cellSx}>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  <Chip
                    size="small"
                    color={row.sisa > 0 ? "warning" : "success"}
                    label={row.sisa > 0 ? "Belum Lunas" : "Lunas"}
                  />
                  {row.planned ? (
                    <Chip size="small" color="info" variant="outlined" label="Rencana" />
                  ) : null}
                  {row.is_overdue ? (
                    <Chip size="small" color="error" variant="outlined" label="Lewat" />
                  ) : null}
                </Stack>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
