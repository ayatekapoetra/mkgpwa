'use client';

import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableFooter, styled, Typography } from '@mui/material';

import Paginate from 'components/Paginate';
import moment from 'moment';

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

export default function ListMiningRitase({ data }) {
  const tableData = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);
  const columns = useMemo(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'ritase.date_ops',
        size: 100,
        cell: ({ row }) => {
          const { date_ops } = row.original.ritase;
          return <Typography>{moment(date_ops).format('DD-MM-YYYY')}</Typography>;
        }
      },
      {
        header: 'Cabang',
        accessorKey: 'cabang.nama',
        size: 180
      },
      {
        header: 'Dome',
        accessorKey: 'dom.no_dom',
        size: 150,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Jenis Material',
        accessorKey: 'material.nama',
        size: 120,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Excavator',
        accessorKey: 'excavator.kode',
        size: 120,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Dumptruck',
        accessorKey: 'dumptruck.kode',
        size: 120,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Status',
        accessorKey: 'ritase.status',
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
