"use client";

import Link from "next/link";
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
  Edit,
  Trash,
  Tag2,
  Calendar,
  Sort,
  ArrowUp2,
  ArrowDown2,
  Building4,
  Location,
  Android,
} from "iconsax-react";

import Paginate from "components/Paginate";
import IconButton from "components/@extended/IconButton";
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

export default function ListGroupTagDesktop({ data, setParams }) {
  const [sorting, setSorting] = useState([]);

  const safeMomentFormat = (date, format = "DD MMM YYYY", fallback = "-") => {
    try {
      const momentDate = moment(date);
      return momentDate.isValid() ? momentDate.format(format) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const safeTextFormat = (text, fallback = "-") => {
    return text != null && text !== "" ? text : fallback;
  };

  const tableData = useMemo(() => {
    const rows = data?.data?.rows || data?.data || data?.rows || data;
    return Array.isArray(rows) ? rows : [];
  }, [data]);

  const columns = useMemo(
    () => [
      {
        header: "ACT",
        accessorKey: "index",
        size: 90,
        minSize: 90,
        enableResizing: true,
        enableSorting: false,
        cell: ({ row }) => {
          const { id } = row.original;

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                color="primary"
                component={Link}
                href={`/timesheet-tag/${id}/edit`}
                title="Edit Group Tag"
              >
                <Edit />
              </IconButton>
            </Box>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Tag2 size={16} />
            <Typography variant="subtitle">Kegiatan</Typography>
          </Stack>
        ),
        accessorKey: "kegiatan",
        size: 120,
        cell: ({ row }) => {
          const { kegiatan } = row.original;
          const colorMap = {
            rental: "primary",
            barging: "success",
            mining: "warning",
            explorasi: "info",
          };
          return (
            <div style={{ textAlign: "center" }}>
              <Chip
                label={kegiatan?.toUpperCase() || "-"}
                color={colorMap[kegiatan] || "default"}
                size="small"
                sx={{ fontWeight: "bold" }}
              />
            </div>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Building4 size={16} />
            <Typography variant="subtitle">Cabang</Typography>
          </Stack>
        ),
        accessorKey: "cabang.nama",
        size: 200,
        cell: ({ row }) => {
          const { cabang } = row.original;
          return (
            <Typography variant="subtitle" fontWeight="medium">
              {safeTextFormat(cabang?.nama)}
            </Typography>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Android size={16} />
            <Typography variant="subtitle">Penyewa</Typography>
          </Stack>
        ),
        accessorKey: "penyewa.nama",
        size: 250,
        cell: ({ row }) => {
          const { penyewa } = row.original;
          return (
            <Typography variant="subtitle" fontWeight="medium">
              {safeTextFormat(penyewa?.nama)}
            </Typography>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Location size={16} />
            <Typography variant="subtitle">Lokasi Kerja (Pit)</Typography>
          </Stack>
        ),
        accessorKey: "pits",
        size: 300,
        cell: ({ row }) => {
          const { pitkerja } = row.original;
          return (
            <Typography variant="subtitle" fontWeight="medium">
              {pitkerja?.nama || '-'}
            </Typography>
          );
        },
      },
      {
        header: () => (
          <Stack direction="row" gap={1} alignItems="center">
            <Calendar size={16} />
            <Typography variant="subtitle">Dibuat</Typography>
          </Stack>
        ),
        accessorKey: "created_at",
        size: 150,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.created_at);
          const dateB = new Date(rowB.original.created_at);
          return dateA - dateB;
        },
        cell: ({ row }) => {
          const { created_at } = row.original;
          return (
            <Typography variant="caption">
              {safeMomentFormat(created_at, "DD MMM YYYY, HH:mm")}
            </Typography>
          );
        },
      },
    ],
    [],
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
      <Table
        sx={{
          tableLayout: "fixed",
          minWidth: "100%",
        }}
      >
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getCanSort() && (
                      <Box
                        sx={{ ml: 1, display: "flex", alignItems: "center" }}
                      >
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
                        isresizing={
                          header.column.getIsResizing() ? "true" : undefined
                        }
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
            <TableRow
              key={row.id}
              hover
              sx={{
                "&:last-child td": { borderBottom: 0 },
              }}
            >
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
                page={data?.data?.page || data?.page || 1}
                total={data?.data?.total || data?.total || 0}
                lastPage={data?.data?.lastPage || data?.lastPage || 1}
                perPage={data?.data?.perPage || data?.perPage || 25}
                onPageChange={(newPage) =>
                  setParams((prev) => ({ ...prev, page: newPage }))
                }
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
  );
}
