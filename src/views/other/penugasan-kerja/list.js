'use client';

import Link from 'next/link';
import React, { useState, useMemo } from 'react';
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
  Badge,
  IconButton
} from '@mui/material';

import { Truck, TagUser, Edit } from 'iconsax-react';
import Paginate from 'components/Paginate';
import moment from 'moment';
import 'moment/locale/id';

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

export default function ListPenugasanKerja({ data = { data: [] }, setParams }) {
  const tableData = useMemo(() => (Array.isArray(data.data) ? data.data : []), [data]);

  const columns = useMemo(
    () => [
      {
        header: 'ACT',
        accessorKey: 'index',
        size: 70,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Box sx={{ width: 30, textAlign: 'center' }}>
              <IconButton variant="dashed" color="primary" component={Link} href={`/penugasan-kerja/${id}/show`}>
                <Edit />
              </IconButton>
            </Box>
          );
        }
      },
      {
        accessorKey: 'root.kode',
        header: 'Kode',
        size: 150,
        minSize: 80,
        enableResizing: true,
        cell: ({ row }) => {
          const root = row.original.root || {};
          return (
            <Stack gap={0} sx={{ lineHeight: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.2 }}>
                {moment(root.date_task).format('ddd, DD-MM-YYYY') || ''}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {root.kode || ''}
              </Typography>
            </Stack>
          );
        }
      },
      {
        header: 'Pemberi Tugas',
        accessorKey: 'root.nmassigner',
        size: 180,
        cell: ({ row }) => {
          const root = row.original.root || {};
          return (
            <Stack gap={0} sx={{ lineHeight: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.2 }}>
                {root.assigner.nama || ''}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {root.assigner.section || ''}
              </Typography>
            </Stack>
          );
        }
      },
      {
        header: 'Penerima Tugas',
        accessorKey: 'root.nmassigned',
        size: 180,
        cell: ({ row }) => {
          const root = row.original.root || {};
          return (
            <Stack spacing={1} direction="row" alignItems="center">
              <Box sx={{ width: 30 }}>
                {root.type === 'equipment' ? <Truck size="24" variant="Bold" /> : <TagUser size="24" variant="Bold" />}
              </Box>
              <Stack gap={0} sx={{ lineHeight: 1 }}>
                <Typography variant="body1" sx={{ lineHeight: 1.2 }}>
                  {root.nmassigned || ''}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {root.karyawan.section || ''}
                </Typography>
              </Stack>
            </Stack>
          );
        }
      },
      {
        header: 'Narasi Tugas',
        accessorKey: 'narasitask',
        size: 400,
        cell: ({ row }) => {
          const { narasitask, root } = row.original;
          switch (root.status) {
            case 'done':
              var badges = <Badge badgeContent={'done'} color="success" />;
              break;
            case 'check':
              var badges = <Badge badgeContent={'check'} color="primary" />;
              break;
            case 'reject':
              var badges = <Badge badgeContent={'reject'} color="error" />;
              break;
            default:
              var badges = <Badge badgeContent={'active'} color="secondary" />;
              break;
          }
          return (
            <Stack gap={0} sx={{ lineHeight: 1 }}>
              <Typography sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{narasitask || '-'}</Typography>
              <Box sx={{ ml: 2 }}>{badges}</Box>
            </Stack>
          );
        }
      },
      {
        header: 'Waktu',
        accessorKey: 'starttask',
        size: 180,
        cell: ({ row }) => {
          const { starttask, finishtask } = row.original;
          return (
            <Stack>
              <Typography variant="body1" sx={{ lineHeight: 1.2, color: 'success.dark' }}>
                {moment(starttask).format('HH:mm') || ''}
              </Typography>
              <Typography variant="body1" sx={{ color: 'warning.dark' }}>
                {moment(finishtask).format('HH:mm') || ''}
              </Typography>
            </Stack>
          );
        }
      },
      {
        header: 'Lokasi Tugas',
        accessorKey: 'pit.nama',
        size: 150,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Equipment',
        accessorKey: 'equipment.kode',
        size: 120,
        cell: (info) => info.getValue() || '-'
      }
    ],
    []
  );

  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
      columnSizingInfo
    },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      minSize: 60
    }
  });

  return (
    <Paper
      sx={{
        overflowX: 'auto',
        width: '100%',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Table
        sx={{
          tableLayout: 'fixed',
          minWidth: '100%'
        }}
      >
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
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    padding: '12px 16px',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
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
                '&:last-child td': { borderBottom: 0 }
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  sx={{
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
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
