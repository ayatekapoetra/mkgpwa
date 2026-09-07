"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Eye, TickCircle, Warning2 } from "iconsax-react";

import {
  STAGES,
  displayValue,
  formatDate,
  formatQuantity,
  stageAvailable,
  stageColor,
  stageLabel,
  stageState,
} from "./presentation";

function StageIndicator({ row, stage, onDetail, compact = false }) {
  const value = stageState(row, stage.key);
  const available = stageAvailable(value);
  const color = stageColor(value.state);
  const title = `${stage.label}: ${stageLabel(value.state || "not_started")}${value.date ? ` | ${formatDate(value.date, true)}` : ""}${value.document_code ? ` | ${value.document_code}` : ""}`;
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          color={color === "default" ? "inherit" : color}
          disabled={!available}
          aria-label={`Detail ${stage.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onDetail({ trackingId: row.tracking_id, stage: stage.key });
          }}
          sx={{
            flexDirection: "column",
            borderRadius: 1,
            minWidth: compact ? 45 : 58,
            py: 0.5,
          }}
        >
          {["partial", "warning"].includes(value.state) ? (
            <Warning2 size={compact ? 16 : 18} />
          ) : (
            <TickCircle
              size={compact ? 16 : 18}
              variant={available ? "Bold" : "Linear"}
            />
          )}
          <Typography
            variant="caption"
            color="inherit"
            sx={{ fontSize: compact ? 9 : 10, lineHeight: 1.2 }}
          >
            {stage.label}
          </Typography>
          {!compact && value.date ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: 9, whiteSpace: "nowrap" }}
            >
              {new Date(value.date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
              })}
            </Typography>
          ) : null}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function StatusChips({ row }) {
  return (
    <Stack spacing={0.5} alignItems="flex-start">
      <Chip
        size="small"
        label={stageLabel(row.current_stage)}
        color={stageColor(row.current_stage)}
      />
      <Chip
        size="small"
        variant="outlined"
        label={`Finance: ${stageLabel(row.finance_stage)}`}
        color={stageColor(row.finance_stage)}
      />
      {row.is_overdue ? (
        <Chip
          size="small"
          label={`Overdue ${formatQuantity(row.stage_age_days)} hari`}
          color="error"
        />
      ) : null}
      {row.has_anomaly ? (
        <Tooltip
          title={(row.anomaly_codes || []).join(", ") || "Anomaly aktif"}
        >
          <Chip
            size="small"
            icon={<Warning2 size={14} />}
            label="Anomaly"
            color="warning"
          />
        </Tooltip>
      ) : null}
    </Stack>
  );
}

function QuantityProgress({ row }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 135 }}>
      <Typography variant="body2" fontWeight={700}>
        {formatQuantity(row.qty_received)} / {formatQuantity(row.qty_ordered)}{" "}
        {displayValue(row.uom, "")}
      </Typography>
      <LinearProgress
        variant="determinate"
        color={
          Number(row.qty_received) >= Number(row.qty_ordered) &&
          Number(row.qty_ordered) > 0
            ? "success"
            : "primary"
        }
        value={Math.min(
          100,
          Number(row.qty_ordered) > 0
            ? (Number(row.qty_received) / Number(row.qty_ordered)) * 100
            : 0,
        )}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <Typography variant="caption" color="text.secondary">
        Kirim {formatQuantity(row.qty_shipped)} | Sisa{" "}
        {formatQuantity(row.qty_outstanding)}
      </Typography>
    </Stack>
  );
}

function MobileRows({ data, initialLoading, onDetail, emptyText }) {
  if (initialLoading)
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={230} />
        ))}
      </Stack>
    );
  if (!data.length)
    return (
      <Typography align="center" color="text.secondary" sx={{ py: 7 }}>
        {emptyText}
      </Typography>
    );
  return (
    <Stack spacing={1.5}>
      {data.map((row) => (
        <Card key={row.tracking_id} variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                gap={1}
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight={700}
                  >
                    {displayValue(row.item_code)}
                    {row.part_number ? ` | PN ${row.part_number}` : ""}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {displayValue(row.item_name)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip
                    size="small"
                    label={stageLabel(row.current_stage)}
                    color={stageColor(row.current_stage)}
                  />
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => onDetail({ trackingId: row.tracking_id })}
                    aria-label={`Detail ${row.tracking_key || row.tracking_id}`}
                  >
                    <Eye size={19} />
                  </IconButton>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Bisnis / Gudang
                  </Typography>
                  <Typography variant="body2">
                    {displayValue(row.business_code, row.business_name)} |{" "}
                    {displayValue(row.warehouse_code, row.warehouse_name)}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    PR / PO
                  </Typography>
                  <Typography variant="body2">
                    {displayValue(row.pr_code)} / {displayValue(row.po_code)}
                  </Typography>
                </Box>
              </Stack>
              <QuantityProgress row={row} />
              <Stack
                direction="row"
                gap={0.5}
                sx={{ overflowX: "auto", pb: 0.5 }}
              >
                {STAGES.map((stage) => (
                  <StageIndicator
                    key={stage.key}
                    row={row}
                    stage={stage}
                    compact
                    onDetail={onDetail}
                  />
                ))}
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  variant="caption"
                  color={row.is_overdue ? "error.main" : "text.secondary"}
                >
                  {row.is_overdue
                    ? "Melewati SLA"
                    : `Umur ${formatQuantity(row.age_days)} hari`}
                </Typography>
                <Typography
                  variant="caption"
                  color={row.has_anomaly ? "warning.main" : "text.secondary"}
                >
                  {row.has_anomaly
                    ? `${row.anomaly_codes?.length || 1} anomaly`
                    : `Update ${formatDate(row.stage_changed_at)}`}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default function MonitoringOrderPartList({
  data,
  total,
  page,
  perPage,
  lastPage,
  initialLoading,
  refreshing,
  hasActiveFilter,
  onPageChange,
  onRowsPerPageChange,
  onDetail,
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const headerSx = {
    bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
    fontWeight: 700,
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };
  const first = total ? (page - 1) * perPage + 1 : 0;
  const last = Math.min(page * perPage, total);
  const emptyText = hasActiveFilter
    ? "Tidak ada lifecycle part yang cocok dengan filter"
    : "Belum ada lifecycle order part";

  return (
    <Paper variant="outlined" sx={{ position: "relative", overflow: "hidden" }}>
      {refreshing ? (
        <LinearProgress
          sx={{ position: "absolute", inset: "0 0 auto", zIndex: 7 }}
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
          <Typography variant="subtitle1">Lifecycle Order Part</Typography>
          <Typography variant="caption" color="text.secondary">
            {total.toLocaleString("id-ID")} item pada filter aktif
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
      {mobile ? (
        <Box sx={{ px: 1.5, pb: 2 }}>
          <MobileRows
            data={data}
            initialLoading={initialLoading}
            onDetail={onDetail}
            emptyText={emptyText}
          />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: "68vh", overflow: "auto" }}>
          <Table
            stickyHeader
            sx={{
              minWidth: 2050,
              "& .MuiTableCell-root": { verticalAlign: "top" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={headerSx}>No</TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 155 }}>
                  Bisnis / Gudang
                </TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 260 }}>Part</TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 150 }}>
                  Dokumen
                </TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 180 }}>
                  Status
                </TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 165 }}>
                  Quantity
                </TableCell>
                {STAGES.map((stage) => (
                  <TableCell key={stage.key} align="center" sx={headerSx}>
                    {stage.label}
                  </TableCell>
                ))}
                <TableCell sx={headerSx}>Umur</TableCell>
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
                          <Skeleton width={cell === 2 ? 190 : 60} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!initialLoading && !data.length ? (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 7 }}>
                    <Typography color="text.secondary">{emptyText}</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
              {!initialLoading &&
                data.map((row, index) => (
                  <TableRow key={row.tracking_id} hover>
                    <TableCell>
                      {displayValue(row.no, (page - 1) * perPage + index + 1)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {displayValue(row.business_code, row.business_name)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {displayValue(row.branch_name, "")}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {displayValue(row.warehouse_code, row.warehouse_name)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="primary"
                        fontWeight={700}
                      >
                        {displayValue(row.item_code)}
                        {row.part_number ? ` | PN ${row.part_number}` : ""}
                      </Typography>
                      <Tooltip title={displayValue(row.item_name, "")}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                          sx={{ maxWidth: 280 }}
                        >
                          {displayValue(row.item_name)}
                        </Typography>
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary">
                        {displayValue(
                          row.supplier_name,
                          "Supplier belum tersedia",
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        MRO: {displayValue(row.mro_code)}
                      </Typography>
                      <Typography variant="body2">
                        PR: {displayValue(row.pr_code)}
                      </Typography>
                      <Typography variant="body2">
                        PO: {displayValue(row.po_code)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChips row={row} />
                    </TableCell>
                    <TableCell>
                      <QuantityProgress row={row} />
                    </TableCell>
                    {STAGES.map((stage) => (
                      <TableCell key={stage.key} align="center">
                        <StageIndicator
                          row={row}
                          stage={stage}
                          onDetail={onDetail}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography
                        variant="body2"
                        color={row.is_overdue ? "error.main" : "inherit"}
                      >
                        {formatQuantity(row.age_days)} hari
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stage {formatQuantity(row.stage_age_days)} hari
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detail lifecycle">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() =>
                            onDetail({ trackingId: row.tracking_id })
                          }
                          aria-label={`Detail ${row.tracking_key || row.tracking_id}`}
                        >
                          <Eye size={19} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
