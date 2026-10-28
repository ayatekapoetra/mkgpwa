"use client";

import { useState } from "react";
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
import { Trash } from "iconsax-react";

import { openNotification } from "api/notification";
import {
  deletePurchasingRequest,
  getPurchasingRequestError,
} from "api/purchasing-request";
import StatusChip from "./components/StatusChip";
import ProgressIndicator from "./components/ProgressIndicator";
import DeletePrDialog from "./components/DeletePrDialog";
import { formatCurrency } from "./utils";
import { isPrDeletable } from "./deletePrHelper";

export { isPrDeletable } from "./deletePrHelper";

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
function DesktopRequestList({ rows, permissions, onDeleteRequest }) {
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
            const canDelete = isPrDeletable(row, permissions);
            return (
              <TableRow hover key={row.id}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      component={Link}
                      href={`/purchasing-request/${row.id}`}
                      size="small"
                      variant="outlined"
                    >
                      Detail
                    </Button>
                    {canDelete && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Trash size={16} />}
                        onClick={() => onDeleteRequest?.(row)}
                      >
                        Hapus
                      </Button>
                    )}
                  </Stack>
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
function MobileRequestList({ rows, permissions, onDeleteRequest }) {
  if (!rows.length) {
    return <EmptyRequestList />;
  }
  return (
    <Stack spacing={1.5}>
      {rows.map((row) => {
        const stats = calculateItemStats(row);
        const canDelete = isPrDeletable(row, permissions);
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
                {canDelete ? (
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      component={Link}
                      href={`/purchasing-request/${row.id}`}
                      variant="outlined"
                    >
                      Lihat Detail
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<Trash size={16} />}
                      onClick={() => onDeleteRequest?.(row)}
                    >
                      Hapus
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    fullWidth
                    component={Link}
                    href={`/purchasing-request/${row.id}`}
                    variant="outlined"
                  >
                    Lihat Detail
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

/** Selects the existing responsive list layout for purchasing requests. */
export default function PurchasingRequestList({
  rows = [],
  permissions,
  onDeleted,
  mutate,
  onDeleteRequest: customOnDeleteRequest,
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRequest = (row) => {
    if (typeof customOnDeleteRequest === "function") {
      customOnDeleteRequest(row);
    } else {
      setDeleteTarget(row);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePurchasingRequest(deleteTarget.id);
      openNotification({
        open: true,
        title: "Berhasil",
        message: `Purchasing Request ${deleteTarget.kode || ""} berhasil dihapus/dinonaktifkan.`,
        alert: { color: "success" },
      });
      setDeleteTarget(null);
      if (typeof onDeleted === "function") {
        onDeleted();
      } else if (typeof mutate === "function") {
        mutate();
      }
    } catch (error) {
      const parsed = getPurchasingRequestError(
        error,
        "Gagal menghapus Purchasing Request",
      );
      openNotification({
        open: true,
        title: "Gagal Menghapus",
        message: parsed.message,
        alert: { color: "error" },
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {mobile ? (
        <MobileRequestList
          rows={rows}
          permissions={permissions}
          onDeleteRequest={handleDeleteRequest}
        />
      ) : (
        <DesktopRequestList
          rows={rows}
          permissions={permissions}
          onDeleteRequest={handleDeleteRequest}
        />
      )}
      <DeletePrDialog
        open={Boolean(deleteTarget)}
        row={deleteTarget}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
