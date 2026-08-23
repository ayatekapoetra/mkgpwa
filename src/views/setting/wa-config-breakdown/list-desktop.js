"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  styled,
  Typography,
  Chip,
  Stack,
  Button,
} from "@mui/material";

import {
  Tree,
  TickCircle,
  Calendar,
  Truck,
  Location,
  Sort,
  ArrowUp2,
  ArrowDown2,
} from "iconsax-react";

import Paginate from "components/Paginate";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

const ResizeHandle = styled("div")(({ theme, isresizing }) => ({
  position: "absolute",
  right: 0,
  top: 0,
  height: "100%",
  width: "6px",
  backgroundColor: isresizing ? theme.palette.primary.main : "transparent",
  cursor: "col-resize",
  userSelect: "none",
  touchAction: "none",
  zIndex: 1,
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
}));

const safeMomentFormat = (date, format = "DD MMM YYYY, HH:mm", fallback = "-") => {
  try {
    const m = moment(date);
    return m.isValid() ? m.format(format) : fallback;
  } catch (e) {
    return fallback;
  }
};

const safeText = (text, fallback = "-") => (text != null && text !== "" ? text : fallback);

export default function ListEquipmentProjectWaDesktop({ data, setParams }) {
  const [sorting, setSorting] = useState([]);

  const tableData = useMemo(() => {
    const rows = data?.rows?.data || data?.data?.rows || data?.data || data?.rows || data;
    return Array.isArray(rows) ? rows : [];
  }, [data]);

  const columns = useMemo(
    () => [
      {
        header: () => <Typography variant="subtitle">Aksi</Typography>,
        id: "actions",
        size: 100,
        cell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href={`/wa-config-breakdown/${row.original.id}`}
              variant="outlined"
              size="small"
            >
              Detail
            </Button>
          </Stack>
        ),
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Tree size={16} />
            <Typography variant="subtitle">Project / Area</Typography>
          </Stack>
        ),
        id: "project_area",
        size: 220,
        cell: ({ row }) => (
          <Stack spacing={0.3}>
            <Typography variant="subtitle" fontWeight="medium">
              {safeText(row.original.nmproject)}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Location size={14} />
              <Typography variant="caption" color="text.secondary">
                {safeText(row.original.area)}
              </Typography>
            </Stack>
          </Stack>
        ),
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Truck size={16} />
            <Typography variant="subtitle">Equipment</Typography>
          </Stack>
        ),
        id: "equipment",
        size: 200,
        cell: ({ row }) => {
          const eq = row.original.equipment;
          const modelManufaktur = [eq?.model, eq?.manufaktur].filter(Boolean).join(" - ");
          return (
            <Stack spacing={0.3}>
              <Typography variant="subtitle" fontWeight="medium">
                {eq?.kode || safeText(row.original.equipment_id)}
              </Typography>
              {modelManufaktur && (
                <Typography variant="caption" color="text.secondary">
                  {modelManufaktur}
                </Typography>
              )}
            </Stack>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Tree size={16} />
            <Typography variant="subtitle">Recipients</Typography>
          </Stack>
        ),
        accessorKey: "recipients",
        size: 260,
        cell: ({ row }) => {
          const raw = safeText(row.original.recipients);
          if (!raw || raw === "-") {
            return <Typography variant="caption" color="text.secondary">-</Typography>;
          }
          const recipients = raw.split(",").map((s) => s.trim()).filter(Boolean);
          if (!recipients.length) {
            return <Typography variant="caption" color="text.secondary">-</Typography>;
          }
          const maxVisible = 3;
          const visible = recipients.slice(0, maxVisible);
          const remaining = recipients.length - maxVisible;
          return (
            <Stack spacing={0.5} sx={{ py: 0.5 }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                {recipients.length} nomor/group
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {visible.map((num, i) => (
                  <Chip key={`${num}-${i}`} label={num} size="small" variant="outlined" sx={{ borderRadius: "6px", fontFamily: "monospace", fontSize: "0.7rem" }} />
                ))}
                {remaining > 0 && (
                  <Chip label={`+${remaining} lainnya`} size="small" color="primary" variant="soft" sx={{ borderRadius: "6px", fontWeight: 600 }} />
                )}
              </Stack>
            </Stack>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <TickCircle size={16} />
            <Typography variant="subtitle">Aktif</Typography>
          </Stack>
        ),
        accessorKey: "aktif",
        size: 100,
        cell: ({ row }) => (
          <Chip
            label={row.original.aktif === "Y" ? "Aktif" : "Non-aktif"}
            color={row.original.aktif === "Y" ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Calendar size={16} />
            <Typography variant="subtitle">Dibuat</Typography>
          </Stack>
        ),
        accessorKey: "created_at",
        size: 180,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.created_at || 0);
          const dateB = new Date(rowB.original.created_at || 0);
          return dateA - dateB;
        },
        cell: ({ row }) => (
          <Typography variant="caption">{safeMomentFormat(row.original.created_at)}</Typography>
        ),
      },
    ],
    []
  );

  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: "onChange",
    state: { columnSizing, columnSizingInfo, sorting },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: { minSize: 60 },
  });

  return (
    <Paper
      sx={{
        overflowX: "auto",
        width: "100%",
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Table sx={{ tableLayout: "fixed", minWidth: "100%" }}>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  colSpan={header.colSpan}
                  onClick={header.column.getToggleSortingHandler()}
                  sx={{
                    position: "relative",
                    width: header.getSize(),
                    minWidth: header.column.columnDef.minSize,
                    fontWeight: "bold",
                    backgroundColor: "background.paper",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                    padding: "12px 16px",
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    "&:hover": {
                      backgroundColor: header.column.getCanSort() ? "action.hover" : "background.paper",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", height: "100%", overflow: "hidden" }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <Box sx={{ ml: 1, display: "flex", alignItems: "center" }}>
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp2 size={16} variant="Outline" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown2 size={16} variant="Outline" />
                        ) : (
                          <Sort size={16} variant="Outline" />
                        )}
                      </Box>
                    )}
                    {header.column.getCanResize() && (
                      <ResizeHandle
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        isresizing={header.column.getIsResizing() ? "true" : undefined}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  sx={{
                    padding: "12px 16px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length}>
              <Paginate
                page={data?.rows?.page || data?.data?.page || data?.page || 1}
                total={data?.rows?.total || data?.data?.total || data?.total || 0}
                lastPage={data?.rows?.lastPage || data?.data?.lastPage || data?.lastPage || 1}
                perPage={data?.rows?.perPage || data?.data?.perPage || data?.perPage || 25}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
  );
}