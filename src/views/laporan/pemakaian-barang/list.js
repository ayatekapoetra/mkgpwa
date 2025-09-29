'use client';

import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';

import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableFooter, styled, Typography, IconButton } from '@mui/material';

import { useTheme } from '@mui/material/styles';

// ASSETS
import { Copy } from 'iconsax-react';

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

export default function ListPemakaianBarang({ data }) {
  const theme = useTheme();

  const tableData = useMemo(() => {
    return data;
  }, [data]);

  const headers = useMemo(() => {
    if (!tableData.length || !tableData[0] || typeof tableData[0] !== 'object') return [];
    return Object.keys(tableData[0]);
  }, [tableData]);

  const columns = useMemo(() => {
    const dynamicColumns = headers.map((header) => ({
      header: header === 'nama' ? 'Kode Equipment' : header,
      accessorKey: header,
      size: 150,
      minSize: 100,
      enableResizing: true,
      enableSorting: true,
      cell: (info) => {
        const value = info.getValue();
        if (typeof value === 'object') return JSON.stringify(value);
        if (header === 'nama')
          return (
            <Typography variant="subtitle1" gutterBottom>
              {value || '-'}
            </Typography>
          );
        if (typeof value === 'number' || !isNaN(parseFloat(value))) {
          return (
            <div style={{ textAlign: 'right' }}>
              <Typography variant="caption" gutterBottom>
                {value > 0 ? value?.toLocaleString('ID') : '-'}
              </Typography>
            </div>
          );
        }
        return value || '-';
      }
    }));

    // Add Total column
    dynamicColumns.push({
      header: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Total
          </Typography>
          <IconButton size="small" onClick={handleCopyTotal} sx={{ ml: 1 }}>
            <Copy size={16} />
          </IconButton>
        </Box>
      ),
      accessorKey: 'total',
      size: 120,
      minSize: 80,
      enableResizing: true,
      enableSorting: false,
      cell: (info) => {
        const row = info.row.original;
        const total = headers.filter((h) => h !== 'nama_barang').reduce((sum, key) => sum + (parseFloat(row[key]) || 0), 0);
        return <Box sx={{ textAlign: 'right', width: '100%' }}>{total > 0 ? total?.toLocaleString('ID') : '-'}</Box>;
      }
    });

    return dynamicColumns;
  }, [headers]);

  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});
  const [sorting, setSorting] = useState([]);

  const handleCopyTotal = () => {
    const totals = tableData.map((row) => {
      const total = headers.filter((h) => h !== 'nama').reduce((sum, key) => sum + (parseFloat(row[key]) || 0), 0);
      return total.toFixed(2);
    });
    navigator.clipboard.writeText(totals.join('\n'));
  };

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: 'onChange',
    enableColumnPinning: true,
    enableSorting: true,
    initialState: {
      columnPinning: { left: ['nama'] }
    },
    state: {
      columnSizing,
      columnSizingInfo,
      sorting
    },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: {
      minSize: 60
    }
  });

  if (!tableData.length) {
    return (
      <Paper
        sx={{
          padding: 2,
          textAlign: 'center',
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography>No data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        overflow: 'auto',
        maxHeight: '70vh',
        width: '100%',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Table
        sx={{
          tableLayout: 'auto'
        }}
      >
        <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.paper' }}>
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
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200],
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    },
                    ...(header.column.getIsPinned() && {
                      position: 'sticky',
                      left: header.column.getStart('left'),
                      zIndex: 2,
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200],
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                    })
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
                    borderColor: 'divider',
                    ...(cell.column.getIsPinned() && {
                      position: 'sticky',
                      left: cell.column.getStart('left'),
                      zIndex: 1,
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                    })
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
            {[...headers, 'total'].map((header) => (
              <TableCell
                key={header}
                sx={{
                  fontWeight: 'bold',
                  padding: '12px 16px',
                  textAlign: header === 'nama' ? 'left' : 'right',
                  color: 'text.primary',
                  ...(header === 'nama' && {
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200],
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                  })
                }}
              >
                {header === 'nama'
                  ? 'Total'
                  : header === 'total'
                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                        tableData.reduce(
                          (sum, row) =>
                            sum + headers.filter((h) => h !== 'nama').reduce((rowSum, key) => rowSum + (parseFloat(row[key]) || 0), 0),
                          0
                        )
                      )
                    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                        tableData.reduce((sum, row) => sum + (parseFloat(row[header]) || 0), 0)
                      )}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
  );
}
