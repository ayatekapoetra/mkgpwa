"use client";

import React, { useState, useMemo } from "react";
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
} from "@mui/material";

import {
  Tag2,
  TickCircle,
  Calendar,
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

export default function ListGroupTagKegiatanDesktop({ data, setParams }) {
  const [sorting, setSorting] = useState([]);

  const safeMomentFormat = (date, format = "DD MMM YYYY, HH:mm", fallback = "-") => {
    try {
      const m = moment(date);
      return m.isValid() ? m.format(format) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const safeText = (text, fallback = "-") => (text != null && text !== "" ? text : fallback);

  const tableData = useMemo(() => {
    const rows = data?.rows?.data || data?.data?.rows || data?.data || data?.rows || data;
    return Array.isArray(rows) ? rows : [];
  }, [data]);

  const columns = useMemo(
    () => [
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Tag2 size={16} />
            <Typography variant="subtitle">CTG</Typography>
          </Stack>
        ),
        accessorKey: "ctg",
        size: 80,
        cell: ({ row }) => (
          <Typography variant="subtitle" fontWeight="medium" textAlign="center">
            {safeText(row.original.ctg)}
          </Typography>
        ),
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Tag2 size={16} />
            <Typography variant="subtitle">Kegiatan</Typography>
          </Stack>
        ),
        accessorKey: "nmkegiatan",
        size: 220,
        cell: ({ row }) => (
          <Typography variant="subtitle" fontWeight="medium">
            {safeText(row.original.nmkegiatan)}
          </Typography>
        ),
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Tag2 size={16} />
            <Typography variant="subtitle">Material</Typography>
          </Stack>
        ),
        accessorKey: "nmmaterial",
        size: 200,
        cell: ({ row }) => (
          <Typography variant="subtitle" fontWeight="medium">
            {safeText(row.original.nmmaterial)}
          </Typography>
        ),
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
          <Typography variant="caption">
            {safeMomentFormat(row.original.created_at)}
          </Typography>
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
    state: {
      columnSizing,
      columnSizingInfo,
      sorting,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: {
      minSize: 60,
    },
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
                      backgroundColor: header.column.getCanSort()
                        ? "action.hover"
                        : "background.paper",
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
