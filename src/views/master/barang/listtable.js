'use client';

import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography, styled, IconButton } from '@mui/material';

import { Edit } from 'iconsax-react';

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

export default function ListTableBarang({ data = { data: [] } }) {
  console.log('ListTableBarang received data:', data);
  console.log('data.data:', data.data);
  console.log('data.data type:', typeof data.data);
  console.log('data.data length:', Array.isArray(data.data) ? data.data.length : 'not array');

  const tableData = useMemo(() => (Array.isArray(data.data) ? data.data : []), [data]);
  console.log('tableData:', tableData);

  const columns = useMemo(
    () => [
      {
        header: 'ACT',
        accessorKey: 'index',
        size: 30,
        enableResizing: true,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Box sx={{ width: 20, textAlign: 'center' }}>
              <IconButton variant="dashed" color="primary" component={Link} href={`/barang/${id}/show`}>
                <Edit />
              </IconButton>
            </Box>
          );
        }
      },

      {
        header: 'Kode',
        accessorKey: 'kode',
        size: 120,
        minSize: 120,
        enableResizing: true,
        cell: (info) => {
          return <Typography variant="subtitle1">{info.getValue() || '-'}</Typography>;
        }
      },
      {
        header: 'Nama',
        accessorKey: 'nama',
        size: 200,
        minSize: 200,
        enableResizing: true,
        cell: (info) => {
          return <Typography variant="subtitle1">{info.getValue() || '-'}</Typography>;
        }
      },
      {
        header: 'Manufacture',
        accessorKey: 'manufacture.nama',
        size: 150,
        minSize: 120,
        enableResizing: true,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Brand',
        accessorKey: 'brand.nama',
        size: 120,
        minSize: 100,
        enableResizing: true,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Application',
        accessorKey: 'application.nama',
        size: 150,
        minSize: 120,
        enableResizing: true,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Bisnis Unit',
        accessorKey: 'bisnis.name',
        size: 150,
        minSize: 120,
        enableResizing: true,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Satuan',
        accessorKey: 'satuan',
        size: 80,
        minSize: 80,
        enableResizing: true,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Min Stok',
        accessorKey: 'min_stok',
        size: 80,
        minSize: 80,
        enableResizing: true,
        cell: (info) => info.getValue() || '0'
      },
      {
        header: 'Kategori',
        accessorKey: 'kategori.nama',
        size: 120,
        minSize: 100,
        enableResizing: true,
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
        width: '100%',
        overflowX: 'auto', // biar bisa scroll horizontal
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
      </Table>
    </Paper>
  );
}