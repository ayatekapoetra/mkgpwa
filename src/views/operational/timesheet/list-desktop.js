"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import moment from "moment";
import "moment/locale/id";

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
  Badge,
  Stack,
  IconButton as MuiIconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

// THIRD - PARTY
import {
  Timer1,
  Edit,
  Calendar,
  Building4,
  Location,
  UserSquare,
  GasStation,
  TruckFast,
  Sort,
  ArrowUp2,
  ArrowDown2,
  ArrowDown3,
  ArrowRight3,
} from "iconsax-react";

import Paginate from "components/Paginate";
import IconButton from "components/@extended/IconButton";

// Set moment locale to Indonesian
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

export default function ListTimesheetDesktop({
  data,
  queueStatus = {},
  setParams,
}) {
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState("");

  // Helper functions for safe data formatting
  const safeMomentFormat = (date, format = "DD-MM-YYYY", fallback = "-") => {
    try {
      const momentDate = moment(date);
      return momentDate.isValid() ? momentDate.format(format) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const safeTimeFormat = (
    timeString,
    format = "ddd, HH:mm",
    fallback = "-",
  ) => {
    try {
      if (!timeString) return fallback;

      // Debug log in development
      if (process.env.NODE_ENV === "development") {
        console.log("safeTimeFormat processing:", timeString);
      }

      // Try parsing with different formats
      let momentTime;

      // Try as full datetime first (ISO format, YYYY-MM-DDTHH:mm:ss, etc)
      momentTime = moment(timeString);
      if (momentTime.isValid()) {
        const result = momentTime.format(format);
        if (process.env.NODE_ENV === "development") {
          console.log("Parsed as full datetime:", result);
        }
        return result;
      }

      // Try as time only (HH:mm format)
      momentTime = moment(timeString, "HH:mm");
      if (momentTime.isValid()) {
        const result = momentTime.format(format);
        if (process.env.NODE_ENV === "development") {
          console.log("Parsed as HH:mm:", result);
        }
        return result;
      }

      // Try as time with seconds (HH:mm:ss format)
      momentTime = moment(timeString, "HH:mm:ss");
      if (momentTime.isValid()) {
        const result = momentTime.format(format);
        if (process.env.NODE_ENV === "development") {
          console.log("Parsed as HH:mm:ss:", result);
        }
        return result;
      }

      // Try as datetime without timezone (YYYY-MM-DD HH:mm)
      momentTime = moment(timeString, "YYYY-MM-DD HH:mm");
      if (momentTime.isValid()) {
        const result = momentTime.format(format);
        if (process.env.NODE_ENV === "development") {
          console.log("Parsed as YYYY-MM-DD HH:mm:", result);
        }
        return result;
      }

      // Try as datetime with seconds (YYYY-MM-DD HH:mm:ss)
      momentTime = moment(timeString, "YYYY-MM-DD HH:mm:ss");
      if (momentTime.isValid()) {
        const result = momentTime.format(format);
        if (process.env.NODE_ENV === "development") {
          console.log("Parsed as YYYY-MM-DD HH:mm:ss:", result);
        }
        return result;
      }

      // If all parsing fails, return the original string as fallback
      if (process.env.NODE_ENV === "development") {
        console.log("All parsing failed, returning original:", timeString);
      }
      return timeString || fallback;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("Error in safeTimeFormat:", error);
      }
      return fallback;
    }
  };

  const safeNumberFormat = (number, decimals = 2, fallback = "-") => {
    try {
      return number != null && !isNaN(number)
        ? Number(number).toFixed(decimals)
        : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const safeTextFormat = (text, fallback = "-") => {
    return text != null && text !== "" ? text : fallback;
  };

  // Reusable TableCell components
  const TimeCell = ({ timeString, format = "ddd, HH:mm", fallback = "-" }) => {
    // Debug: log the actual timeString received
    if (process.env.NODE_ENV === "development") {
      console.log(
        "TimeCell received timeString:",
        timeString,
        "type:",
        typeof timeString,
      );
    }

    return (
      <Typography variant="body2" fontWeight="medium">
        {safeTimeFormat(timeString, format, fallback)}
      </Typography>
    );
  };

  const LocationCell = ({ location, fallback = "-" }) => (
    <Typography variant="body2" fontWeight="medium">
      {safeTextFormat(location?.nama, fallback)}
    </Typography>
  );

  const ActivityCell = ({ activity, fallback = "-" }) => (
    <Typography variant="body2" fontWeight="medium">
      {safeTextFormat(activity?.nama, fallback)}
    </Typography>
  );

  const TextCell = ({ text, fallback = "-", fontWeight = "medium", color }) => (
    <Typography variant="body2" fontWeight={fontWeight} color={color}>
      {safeTextFormat(text, fallback)}
    </Typography>
  );

  const tableData = useMemo(() => {
    const rows = data?.data?.rows || data?.data || data?.rows || data;
    const processedRows = Array.isArray(rows) ? rows : [];

    // Merge queue status with table data
    return processedRows.map((row) => ({
      ...row,
      syncStatus: queueStatus[row.id] || "synced",
    }));
  }, [data, queueStatus]);

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
          const { id, status } = row.original;
          const isExpanded = expandedRows.has(id);
          if (status == "A") {
            var btnColor = "secondary";
          } else if (status == "W") {
            var btnColor = "warning";
          } else {
            var btnColor = "error";
          }

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* Edit button */}
              <IconButton
                size={"small"}
                color={btnColor}
                component={Link}
                href={`/timesheet/${id}/show`}
                title="Edit Timesheet"
              >
                <Edit />
              </IconButton>

              {/* Expand button - show for all rows temporarily for debugging */}
              <MuiIconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  const newExpanded = new Set(expandedRows);
                  if (isExpanded) {
                    newExpanded.delete(id);
                  } else {
                    newExpanded.add(id);
                  }
                  setExpandedRows(newExpanded);
                }}
                title={isExpanded ? "Collapse Details" : "Expand Details"}
                sx={{
                  color: isExpanded ? "primary.main" : "text.secondary",
                  transition: "color 0.2s ease",
                }}
              >
                {isExpanded ? (
                  <ArrowDown3 size={16} />
                ) : (
                  <ArrowRight3 size={16} />
                )}
              </MuiIconButton>
            </Box>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "syncStatus",
        size: 100,
        enableSorting: false,
        cell: ({ row }) => {
          const { syncStatus } = row.original;
          console.log("row.original--", row.original);

          if (syncStatus === "pending") {
            return (
              <div style={{ textAlign: "center" }}>
                <Badge badgeContent={"OFFLINE"} color="warning" />
              </div>
            );
          } else if (syncStatus === "synced") {
            return (
              <div style={{ textAlign: "center" }}>
                <Badge badgeContent={"SYNCED"} color="success" />
              </div>
            );
          } else if (syncStatus === "failed") {
            return (
              <div style={{ textAlign: "center" }}>
                <Badge badgeContent={"FAILED"} color="error" />
              </div>
            );
          }
          return <div style={{ textAlign: "center" }}>-</div>;
        },
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <Calendar size={16} />
            <Typography variant="subtitle">Tanggal</Typography>
          </Stack>
        ),
        accessorKey: "date_ops",
        size: 120,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.date_ops);
          const dateB = new Date(rowB.original.date_ops);
          return dateA - dateB;
        },
        cell: ({ row }) => {
          const { date_ops } = row.original;
          return <Typography>{safeMomentFormat(date_ops)}</Typography>;
        },
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <Building4 size={16} />
            <Typography variant="subtitle">Bisnis</Typography>
          </Stack>
        ),
        accessorKey: "bisnis.initial",
        size: 100,
        cell: ({ row }) => {
          const { bisnis } = row.original;
          return (
            <div style={{ textAlign: "center" }}>
              <Typography>{safeTextFormat(bisnis?.initial)}</Typography>
            </div>
          );
        },
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <Location size={16} />
            <Typography variant="subtitle">Site</Typography>
          </Stack>
        ),
        accessorKey: "cabang.initial",
        size: 80,
        cell: ({ row }) => {
          const { cabang } = row.original;
          return (
            <div style={{ textAlign: "center" }}>
              <Typography>{safeTextFormat(cabang?.initial)}</Typography>
            </div>
          );
        },
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <UserSquare size={16} />
            <Typography variant="subtitle">Operator / Driver</Typography>
          </Stack>
        ),
        accessorKey: "karyawan.nama",
        size: 250,
        cell: (info) => safeTextFormat(info.getValue()),
      },
      {
        header: "Equipment",
        accessorKey: "kdunit",
        size: 120,
        cell: (info) => safeTextFormat(info.getValue()),
      },
      {
        header: "Penyewa",
        accessorKey: "penyewa.abbr",
        size: 80,
        cell: (info) => safeTextFormat(info.getValue()),
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <GasStation size={16} />
            <Typography variant="subtitle">BBM</Typography>
          </Stack>
        ),
        accessorKey: "bbm",
        size: 80,
        cell: (info) => (
          <div style={{ textAlign: "right" }}>
            {safeTextFormat(info.getValue())}
          </div>
        ),
      },
      {
        header: "SMU Start",
        accessorKey: "smustart",
        size: 120,
        meta: { align: "right" },
        cell: (info) => (
          <div style={{ textAlign: "right" }}>
            {safeTextFormat(info.getValue())}
          </div>
        ),
      },
      {
        header: "SMU Finish",
        accessorKey: "smufinish",
        size: 120,
        cell: (info) => (
          <div style={{ textAlign: "right" }}>
            {safeTextFormat(info.getValue())}
          </div>
        ),
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <TruckFast size={16} />
            <Typography variant="subtitle">SMU USED</Typography>
          </Stack>
        ),
        accessorKey: "usedhmkm",
        size: 120,
        cell: (info) => (
          <div style={{ textAlign: "right" }}>
            {safeNumberFormat(info.getValue(), 2)}
          </div>
        ),
      },
      {
        header: () => (
          <Stack direction="col" gap={1} alignItems="center">
            <Timer1 size={16} />
            <Typography variant="subtitle">LS</Typography>
          </Stack>
        ),
        accessorKey: "longshift",
        size: 80,
        cell: ({ row }) => {
          const { longshift } = row.original;
          if (longshift == "ls0") {
            return (
              <div style={{ textAlign: "center" }}>
                <Badge badgeContent={"LS0"} color="success" />
              </div>
            );
          } else if (longshift == "ls1") {
            return (
              <div style={{ textAlign: "center" }}>
                <Badge badgeContent={"LS1"} color="warning" />
              </div>
            );
          } else {
            return (
              <div style={{ textAlign: "center" }}>
                <Badge badgeContent={"LS2"} color="error" />
              </div>
            );
          }
        },
      },
      {
        header: "ALokasi",
        accessorKey: "mainact",
        size: 120,
        cell: (info) => safeTextFormat(info.getValue()?.toUpperCase()),
      },
      {
        header: "Metode",
        accessorKey: "metode",
        size: 80,
        cell: (info) => safeTextFormat(info.getValue()?.toUpperCase()),
      },
    ],
    [expandedRows],
  );
  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  const renderNestedRows = (parentRow, parentColumns) => {
    const { items = [] } = parentRow.original;
    const isExpanded = expandedRows.has(parentRow.original.id);
    const itemsArray = Array.isArray(items) ? items : [];

    if (!isExpanded || itemsArray.length === 0) {
      return null;
    }

    // Sort items by starttime (oldest to newest)
    const sortedItems = [...itemsArray].sort((a, b) => {
      const timeA = a.starttime ? new Date(a.starttime) : new Date(0);
      const timeB = b.starttime ? new Date(b.starttime) : new Date(0);
      return timeA - timeB; // Ascending order (oldest first)
    });

    return (
      <TableRow>
        <TableCell colSpan={parentColumns.length} sx={{ p: 0, border: "none" }}>
          <Box sx={{ bgcolor: "background.default", p: 2 }}>
            <Paper
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Seq
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Lokasi
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Lokasi Tujuan
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Kegiatan
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Material
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Start Time
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      End Time
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Waktu (jam)
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      SMU Start
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      SMU Finish
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Used SMU
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Ritase
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "background.paper" }}
                    >
                      Tools
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedItems.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <TextCell
                          text={item.seq}
                          fontWeight="bold"
                          color="primary.main"
                        />
                      </TableCell>
                      <TableCell>
                        <LocationCell location={item.lokasi} />
                      </TableCell>
                      <TableCell>
                        <LocationCell location={item.lokasiTujuan} />
                      </TableCell>
                      <TableCell>
                        <ActivityCell activity={item.kegiatan} />
                      </TableCell>
                      <TableCell>
                        <ActivityCell activity={item.material} />
                      </TableCell>
                      <TableCell>
                        <TimeCell timeString={item.starttime} />
                      </TableCell>
                      <TableCell>
                        <TimeCell timeString={item.endtime} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.timetot
                            ? safeNumberFormat(item.timetot / 60, 2)
                            : "-"}{" "}
                          jam
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextCell text={item.smustart} />
                      </TableCell>
                      <TableCell>
                        <TextCell text={item.smufinish} />
                      </TableCell>
                      <TableCell>
                        <TextCell
                          text={item.usedsmu}
                          fontWeight="bold"
                          color="success.main"
                        />
                      </TableCell>
                      <TableCell>
                        <TextCell text={item.ritase} />
                      </TableCell>
                      <TableCell>
                        <TextCell text={item.tools} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

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
          {table.getRowModel().rows.map((row) => {
            // Debug log untuk status
            if (row.original.status === "R") {
              console.log("Found status R row:", row.original);
            }
            return (
              <React.Fragment key={row.id}>
                <TableRow
                  hover
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                    bgcolor:
                      row.original.status === "W"
                        ? "background.default"
                        : row.original.status === "R"
                          ? "warning.default"
                          : expandedRows.has(row.original.id)
                            ? "action.hover"
                            : "background.paper",
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
                        borderBottom: expandedRows.has(row.original.id)
                          ? "2px solid"
                          : "1px solid",
                        borderColor: expandedRows.has(row.original.id)
                          ? "primary.main"
                          : "divider",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {renderNestedRows(row, columns)}
              </React.Fragment>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length}>
              <Paginate
                page={data?.data?.page || data?.page}
                total={data?.data?.total || data?.total || 0}
                lastPage={data?.data?.lastPage || data?.lastPage || 1}
                perPage={data?.data?.perPage || data?.perPage || 10}
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
