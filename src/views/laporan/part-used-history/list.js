"use client";

import NextLink from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

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
const formatQuantity = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? quantityFormatter.format(number) : "-";
};
const formatMoney = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? moneyFormatter.format(number) : "-";
};
const formatDate = (value) => {
  if (!value) return "-";
  const parts = String(value).slice(0, 10).split("-");
  return parts.length === 3
    ? `${parts[2]}-${parts[1]}-${parts[0]}`
    : String(value);
};

export { formatMoney, formatQuantity, formatDate };

export default function PartUsedHistoryList({
  data,
  total,
  page,
  perPage,
  lastPage,
  summary,
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
    borderColor: "divider",
    verticalAlign: "middle",
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
          <Typography variant="subtitle1">Data Part Used History</Typography>
          <Typography variant="caption" color="text.secondary">
            Total seluruh filter: {formatMoney(summary?.total_extended_price)} (
            {Number(summary?.total_records ?? total).toLocaleString("id-ID")}{" "}
            data)
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
            minWidth: 1900,
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
              <TableCell rowSpan={2} sx={headerSx}>
                No
              </TableCell>
              <TableCell rowSpan={2} sx={headerSx}>
                Date
              </TableCell>
              <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 190 }}>
                Gudang
              </TableCell>
              <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 240 }}>
                Description
              </TableCell>
              <TableCell
                colSpan={2}
                align="center"
                sx={{ ...headerSx, bgcolor: theme.palette.primary.lighter }}
              >
                Stn.Order
              </TableCell>
              <TableCell
                colSpan={2}
                align="center"
                sx={{ ...headerSx, bgcolor: theme.palette.success.lighter }}
              >
                Stn.Used
              </TableCell>
              <TableCell rowSpan={2} align="right" sx={headerSx}>
                Unit Price
              </TableCell>
              <TableCell rowSpan={2} align="right" sx={headerSx}>
                Ext.Price
              </TableCell>
              <TableCell rowSpan={2} sx={headerSx}>
                Unit ID
              </TableCell>
              <TableCell rowSpan={2} sx={headerSx}>
                Receiver
              </TableCell>
              <TableCell rowSpan={2} sx={headerSx}>
                Delivery
              </TableCell>
              <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 220 }}>
                Remark
              </TableCell>
              <TableCell rowSpan={2} align="center" sx={headerSx}>
                Action
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="right"
                sx={{ ...headerSx, bgcolor: theme.palette.primary.lighter }}
              >
                Qty
              </TableCell>
              <TableCell
                sx={{ ...headerSx, bgcolor: theme.palette.primary.lighter }}
              >
                UOM
              </TableCell>
              <TableCell
                align="right"
                sx={{ ...headerSx, bgcolor: theme.palette.success.lighter }}
              >
                Qty
              </TableCell>
              <TableCell
                sx={{ ...headerSx, bgcolor: theme.palette.success.lighter }}
              >
                UOM
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 15 }, (__, cell) => (
                      <TableCell key={cell}>
                        <Skeleton width={cell === 3 ? 180 : 65} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!initialLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} align="center" sx={{ py: 7 }}>
                  <Typography color="text.secondary">
                    Tidak ada histori pemakaian part sesuai filter
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
            {!initialLoading &&
              data.map((row, index) => (
                <TableRow
                  key={row.item_id ?? `${row.transaction_id}-${index}`}
                  hover
                >
                  <TableCell>
                    {display(row.no, (page - 1) * perPage + index + 1)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2">
                      {formatDate(row.date_used)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {display(row.business_initial, row.business_code)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 190, whiteSpace: "nowrap" }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {display(row.warehouse_code)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {display(row.warehouse_name, "")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0}>
                      {row.transaction_id ? (
                        <Tooltip title="Buka Goods Issue">
                          <IconButton
                            component={NextLink}
                            href={`/goods-issues/${row.transaction_id}`}
                            aria-label={`Buka Goods Issue ${row.transaction_code || row.transaction_id}`}
                            size="small"
                            color="primary"
                            sx={{ p: 0.25 }}
                          >
                            <OpenInNewOutlinedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Typography
                        variant="caption"
                        color="primary"
                        fontWeight={700}
                      >
                        {display(row.item_code)}
                      </Typography>
                    </Stack>
                    <Tooltip title={display(row.item_name, "")}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        sx={{ maxWidth: 260 }}
                      >
                        {display(row.item_name)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {formatQuantity(row.order_qty)}
                  </TableCell>
                  <TableCell>{display(row.order_uom)}</TableCell>
                  <TableCell align="right">
                    {formatQuantity(row.used_qty)}
                  </TableCell>
                  <TableCell>{display(row.used_uom)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(row.unit_price)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(row.extended_price)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {display(row.equipment_code, "Tanpa Referensi")}
                    </Typography>
                    {row.equipment_model ? (
                      <Typography variant="caption" color="text.secondary">
                        {row.equipment_model}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{display(row.receiver)}</TableCell>
                  <TableCell>{display(row.delivered_by)}</TableCell>
                  <TableCell>
                    <Tooltip title={display(row.narrative, "")}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
                        {display(row.narrative)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        onDetail(row.transaction_id || row.detail_key)
                      }
                      disabled={!row.transaction_id && !row.detail_key}
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
