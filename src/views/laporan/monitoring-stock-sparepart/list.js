"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Eye, Warning2 } from "iconsax-react";

const quantityFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});
const moneyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const display = (value, fallback = "-") =>
  value === undefined || value === null || value === "" ? fallback : value;
export const formatQuantity = (value) =>
  Number.isFinite(Number(value))
    ? quantityFormatter.format(Number(value))
    : "-";
export const formatMoney = (value) =>
  Number.isFinite(Number(value)) ? moneyFormatter.format(Number(value)) : "-";
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("id-ID") : "-";
const statusProps = {
  available: { label: "Available", color: "success" },
  low: { label: "Low Stock", color: "warning" },
  out: { label: "Out of Stock", color: "default" },
  negative: { label: "Negative", color: "error" },
};
const warningText = (row) => {
  const warnings = [];
  if (row.stock_status === "negative") warnings.push("Stock negatif");
  if (row.has_master_warning)
    warnings.push("Relasi master tidak lengkap atau inactive");
  if (row.has_conversion_warning)
    warnings.push("Faktor konversi tidak valid; fallback 1 digunakan");
  if (row.has_minimum_stock_warning)
    warnings.push("Minimum stock tidak tersedia; fallback 0 digunakan");
  if (row.price_available === false) warnings.push("Harga belum tersedia");
  if (Number(row.snapshot_row_count) > 1)
    warnings.push(`${row.snapshot_row_count} snapshot digabung`);
  if (row.has_business_mismatch)
    warnings.push("Business snapshot berbeda dengan master");
  if (row.has_rack_warehouse_mismatch)
    warnings.push("Rack master terdaftar pada warehouse berbeda");
  return warnings;
};

export default function MonitoringStockList({
  data,
  total,
  page,
  perPage,
  lastPage,
  initialLoading,
  refreshing,
  onPageChange,
  onRowsPerPageChange,
  onDetail,
}) {
  const theme = useTheme();
  const headerSx = {
    bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
    fontWeight: 700,
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };
  const numericSx = {
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  };
  const first = total ? (page - 1) * perPage + 1 : 0;
  const last = Math.min(page * perPage, total);

  return (
    <Paper variant="outlined" sx={{ position: "relative", overflow: "hidden" }}>
      {refreshing ? (
        <LinearProgress
          sx={{ position: "absolute", inset: "0 0 auto", zIndex: 6 }}
        />
      ) : null}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ p: 2 }}
      >
        <Stack>
          <Typography variant="subtitle1">Posisi Stock per Rack</Typography>
          <Typography variant="caption" color="text.secondary">
            {total.toLocaleString("id-ID")} baris pada filter aktif
          </Typography>
        </Stack>
        <TextField
          select
          size="small"
          label="Rows"
          value={perPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          disabled={refreshing}
          sx={{ minWidth: 100 }}
        >
          {[25, 50, 100, 500].map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <TableContainer sx={{ maxHeight: "68vh", overflow: "auto" }}>
        <Table
          sx={{
            minWidth: 2250,
            "& .MuiTableCell-root": { verticalAlign: "top" },
          }}
        >
          <TableHead
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              "& .MuiTableCell-root": { verticalAlign: "middle" },
            }}
          >
            <TableRow>
              <TableCell sx={headerSx}>No</TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 150 }}>
                Business
              </TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 180 }}>
                Warehouse
              </TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 150 }}>Rack</TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 250 }}>
                Description
              </TableCell>
              <TableCell align="right" sx={headerSx}>
                Order Stock
              </TableCell>
              <TableCell align="right" sx={headerSx}>
                Used Stock
              </TableCell>
              <TableCell align="right" sx={headerSx}>
                Minimum
              </TableCell>
              <TableCell sx={headerSx}>Status</TableCell>
              <TableCell align="right" sx={headerSx}>
                Unit Price
              </TableCell>
              <TableCell align="right" sx={headerSx}>
                Stock Value
              </TableCell>
              <TableCell sx={headerSx}>Price Period</TableCell>
              <TableCell sx={headerSx}>Last Update</TableCell>
              <TableCell align="center" sx={headerSx}>
                Warning
              </TableCell>
              <TableCell align="center" sx={headerSx}>
                Detail
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 15 }, (__, cell) => (
                      <TableCell key={cell}>
                        <Skeleton width={cell === 4 ? 180 : 65} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!initialLoading && !data.length ? (
              <TableRow>
                <TableCell colSpan={15} align="center" sx={{ py: 7 }}>
                  <Typography color="text.secondary">
                    Tidak ada stock sparepart sesuai filter
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
            {!initialLoading &&
              data.map((row, index) => {
                const status = statusProps[row.stock_status] || {
                  label: display(row.stock_status),
                  color: "default",
                };
                const warnings = warningText(row);
                return (
                  <TableRow
                    key={[
                      row.business_id,
                      row.warehouse_id,
                      row.rack_id,
                      row.item_id,
                      row.stable_id,
                    ].join("-")}
                    hover
                  >
                    <TableCell>
                      {display(row.no, (page - 1) * perPage + index + 1)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {display(row.business_code)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {display(row.business_name, "")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {display(row.warehouse_code)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {display(row.warehouse_name, "")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {display(row.rack_code)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {display(row.rack_name, "")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="primary"
                        fontWeight={700}
                      >
                        {display(row.item_code)}
                      </Typography>
                      <Tooltip title={display(row.item_name, "")}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          sx={{ maxWidth: 280 }}
                        >
                          {display(row.item_name)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        ...numericSx,
                        color:
                          Number(row.stock_order) < 0
                            ? "error.main"
                            : "inherit",
                        fontWeight: Number(row.stock_order) < 0 ? 700 : 400,
                      }}
                    >
                      {formatQuantity(row.stock_order)}{" "}
                      {display(row.order_uom, "")}
                    </TableCell>
                    <TableCell align="right" sx={numericSx}>
                      {formatQuantity(row.stock_used)}{" "}
                      {display(row.used_uom, "")}
                    </TableCell>
                    <TableCell align="right" sx={numericSx}>
                      {formatQuantity(row.minimum_stock_order)}{" "}
                      {display(row.order_uom, "")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={status.label}
                        color={status.color}
                      />
                    </TableCell>
                    <TableCell align="right" sx={numericSx}>
                      {row.price_available === false ? (
                        <Tooltip title="Harga belum tersedia">
                          <Typography variant="caption" color="warning.main">
                            Harga belum tersedia
                          </Typography>
                        </Tooltip>
                      ) : (
                        formatMoney(row.unit_price)
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ ...numericSx, fontWeight: 700 }}
                    >
                      {formatMoney(row.stock_value)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {display(row.price_period)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(row.last_stock_update_at)}
                    </TableCell>
                    <TableCell align="center">
                      {warnings.length ? (
                        <Tooltip
                          title={
                            <Box>
                              {warnings.map((warning) => (
                                <Typography
                                  key={warning}
                                  variant="caption"
                                  display="block"
                                >
                                  {warning}
                                </Typography>
                              ))}
                            </Box>
                          }
                        >
                          <Warning2
                            size={20}
                            color={theme.palette.warning.main}
                          />
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Distribusi rack">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={`Detail ${display(row.item_code, row.item_id)}`}
                            disabled={
                              !row.item_id ||
                              !row.warehouse_id ||
                              !row.business_id
                            }
                            onClick={() => onDetail(row)}
                          >
                            <Eye size={19} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="body2" color="text.secondary">
          Menampilkan {first}-{last} dari {total.toLocaleString("id-ID")} data
        </Typography>
        <Pagination
          count={lastPage}
          page={Math.min(page, lastPage)}
          onChange={(_, value) => onPageChange(value)}
          disabled={refreshing}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Stack>
    </Paper>
  );
}
