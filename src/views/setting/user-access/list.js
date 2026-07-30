'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import {
  Box,
  Stack,
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
  Tooltip,
  Avatar,
  LinearProgress
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Edit2, Trash } from 'iconsax-react';

import IconButton from 'components/@extended/IconButton';
import Paginate from 'components/Paginate';
import { PERMISSION_KEYS, countActivePerms, getInitials } from './permission-config';

const ResizeHandle = styled('div')(({ theme, isresizing }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: '6px',
  backgroundColor: isresizing ? theme.palette.primary.main : 'transparent',
  cursor: 'col-resize',
  userSelect: 'none',
  touchAction: 'none',
  zIndex: 1,
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.light
  }
}));

function PermissionBadges({ row }) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {PERMISSION_KEYS.map((p) => {
        const active = row[p.key] === 'Y';
        return (
          <Tooltip key={p.key} title={`${p.label}: ${active ? 'Aktif' : 'Nonaktif'} — ${p.description}`}>
            <Chip
              size="small"
              label={p.short}
              color={active ? p.color : 'default'}
              variant={active ? 'filled' : 'outlined'}
              sx={{
                height: 22,
                minWidth: 32,
                fontWeight: 700,
                fontSize: 11,
                opacity: active ? 1 : 0.45,
                '& .MuiChip-label': { px: 0.75 }
              }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}

function CoverageBar({ row }) {
  const theme = useTheme();
  const active = countActivePerms(row);
  const pct = (active / PERMISSION_KEYS.length) * 100;
  const color = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'info';

  return (
    <Stack spacing={0.5} sx={{ minWidth: 88 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          Coverage
        </Typography>
        <Typography variant="caption" fontWeight={700}>
          {active}/{PERMISSION_KEYS.length}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{
          height: 6,
          borderRadius: 1,
          bgcolor: alpha(theme.palette[color].main, 0.12)
        }}
      />
    </Stack>
  );
}

export default function ListUserAccess({ data = { data: [] }, setParams }) {
  const theme = useTheme();
  const tableData = useMemo(() => (Array.isArray(data.data) ? data.data : []), [data]);

  const columns = useMemo(
    () => [
      {
        header: 'Aksi',
        accessorKey: 'index',
        size: 96,
        minSize: 88,
        enableResizing: false,
        cell: ({ row }) => {
          const { user_id } = row.original;
          return (
            <Stack direction="row" spacing={0.5} justifyContent="center">
              <Tooltip title="Edit akses">
                <IconButton
                  size="small"
                  color="primary"
                  variant="light"
                  component={Link}
                  href={`/user-access/${user_id}/show`}
                >
                  <Edit2 size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Hapus semua akses">
                <IconButton
                  size="small"
                  color="error"
                  variant="light"
                  component={Link}
                  href={`/user-access/${user_id}/destroy`}
                >
                  <Trash size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        }
      },
      {
        header: 'User',
        accessorKey: 'nmuser',
        size: 220,
        minSize: 160,
        enableResizing: true,
        cell: ({ row }) => {
          const { user, nmuser } = row.original;
          const name = user?.nmlengkap || nmuser || '-';
          const type = user?.usertype || '-';
          return (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  color: 'primary.main'
                }}
              >
                {getInitials(name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={650} noWrap>
                  {name}
                </Typography>
                <Chip
                  size="small"
                  label={type}
                  variant="outlined"
                  sx={{ height: 20, mt: 0.25, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
                />
              </Box>
            </Stack>
          );
        }
      },
      {
        header: 'Menu / Submenu',
        accessorKey: 'menu.name',
        size: 220,
        minSize: 160,
        cell: ({ row }) => {
          const { menu, submenu, nmsubmenu } = row.original;
          return (
            <Box>
              <Typography variant="subtitle2" fontWeight={650} noWrap>
                {submenu?.name || nmsubmenu || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {menu?.name || menu?.title || '-'}
              </Typography>
            </Box>
          );
        }
      },
      {
        header: 'Permission Flags',
        accessorKey: 'read',
        size: 280,
        minSize: 220,
        cell: ({ row }) => <PermissionBadges row={row.original} />
      },
      {
        header: 'Coverage',
        accessorKey: 'coverage',
        size: 120,
        minSize: 100,
        enableResizing: false,
        cell: ({ row }) => <CoverageBar row={row.original} />
      }
    ],
    [theme]
  );

  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: 'onChange',
    state: { columnSizing, columnSizingInfo },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: { minSize: 60 }
  });

  return (
    <Paper
      elevation={0}
      sx={{
        overflowX: 'auto',
        width: '100%',
        boxShadow: 'none',
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: 0
      }}
    >
      <Table sx={{ tableLayout: 'fixed', minWidth: 900 }}>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  colSpan={header.colSpan}
                  sx={{
                    position: 'relative',
                    width: header.getSize(),
                    minWidth: header.column.columnDef.minSize,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5,
                    px: 2,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <ResizeHandle
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        isresizing={header.column.getIsResizing() ? 'true' : undefined}
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
                '&:last-child td': { borderBottom: 0 },
                transition: 'background-color 0.15s ease'
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    overflow: 'hidden',
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    verticalAlign: 'middle'
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
            <TableCell colSpan={columns.length} sx={{ borderBottom: 0, py: 1.5 }}>
              <Paginate
                page={data.page}
                total={data.total || 0}
                lastPage={data.lastPage || 1}
                perPage={data.perPage || 10}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
  );
}
