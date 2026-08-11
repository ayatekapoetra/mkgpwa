"use client";

import Link from "next/link";
import moment from "moment";
import "moment/locale/id";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import StatusChip from "./components/StatusChip";
import ProgressIndicator from "./components/ProgressIndicator";
import { formatCurrency } from "./utils";

moment.locale("id");

const calculateItemStats = (row) => {
  const items = (row.items || []).filter((item) => item.aktif !== "N");
  return {
    total: items.length,
    validated: items.filter(
      (item) => item.user_validated || item.date_validated,
    ).length,
    approved: items.filter((item) => item.user_approved || item.date_approved)
      .length,
    totalDiscount: items.reduce(
      (total, item) => total + Number(item.potongan || 0),
      0,
    ),
    totalPpn: items.reduce(
      (total, item) => total + Number(item.ppn_rp || 0),
      0,
    ),
  };
};

/** Displays the empty state when no requests match the current filters. */
function EmptyRequestList() {
  return (
    <Stack alignItems="center" sx={{ py: 8 }}>
      <Typography variant="h6" color="text.secondary">
        Tidak ada Purchasing Request sesuai filter.
      </Typography>
    </Stack>
  );
}

/** Renders purchasing requests in the desktop table layout. */
function DesktopRequestList({ rows }) {
  if (!rows.length) {
    return <EmptyRequestList />;
  }
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ overflowX: "auto" }}
    >
      <Table size="small" sx={{ minWidth: 1200 }}>
        <TableHead>
          <TableRow>
            <TableCell>Aksi</TableCell>
            <TableCell>Kode</TableCell>
            <TableCell>Organisasi</TableCell>
            <TableCell>Prioritas</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const stats = calculateItemStats(row);
            return (
              <TableRow hover key={row.id}>
                <TableCell>
                  <Button
                    component={Link}
                    href={`/purchasing-request/${row.id}`}
                    size="small"
                    variant="outlined"
                  >
                    Detail
                  </Button>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {row.kode || "-"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {row.date_ro
                      ? moment(row.date_ro).format("ddd, DD MMMM YYYY")
                      : "-"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {row.creator?.nmlengkap ||
                      row.creator?.nama_lengkap ||
                      row.creator?.username ||
                      "-"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {row.bisnis?.name || row.bisnis?.initial || "-"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.cabang?.nama || "-"} /{" "}
                    {row.gudang?.nama || row.gudang?.name || "-"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.prioritas || "-"}
                    color={
                      row.prioritas === "P1"
                        ? "error"
                        : row.prioritas === "P2"
                          ? "warning"
                          : "success"
                    }
                  />
                </TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 180 }}>
                    <ProgressIndicator items={row.items || []} />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700}>
                    {formatCurrency(row.total_ro)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Diskon: {formatCurrency(stats.totalDiscount)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    PPN: {formatCurrency(stats.totalPpn)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Renders purchasing requests as cards on smaller screens. */
function MobileRequestList({ rows }) {
  if (!rows.length) {
    return <EmptyRequestList />;
  }
  return (
    <Stack spacing={1.5}>
      {rows.map((row) => {
        const stats = calculateItemStats(row);
        return (
          <Card variant="outlined" key={row.id}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography variant="h6">{row.kode || "-"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.date_ro
                        ? moment(row.date_ro).format("ddd, DD MMMM YYYY")
                        : "-"}
                    </Typography>
                  </Box>
                  <StatusChip status={row.status} />
                </Stack>
                <Typography variant="body2">
                  {row.description || "Tanpa deskripsi"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.creator?.nmlengkap || row.creator?.nama_lengkap || "-"} ·{" "}
                  {row.cabang?.nama || "-"}
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    Item {stats.total}
                  </Typography>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(row.total_ro)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Diskon: {formatCurrency(stats.totalDiscount)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      PPN: {formatCurrency(stats.totalPpn)}
                    </Typography>
                  </Box>
                </Stack>
                <ProgressIndicator items={row.items || []} />
                <Button
                  fullWidth
                  component={Link}
                  href={`/purchasing-request/${row.id}`}
                  variant="outlined"
                >
                  Lihat Detail
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

/** Selects the existing responsive list layout for purchasing requests. */
export default function PurchasingRequestList({ rows = [] }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  return mobile ? (
    <MobileRequestList rows={rows} />
  ) : (
    <DesktopRequestList rows={rows} />
  );
}
